import { AFFECTIVE, PSYCHOMOTOR, assessmentOf, gradeScore, ordinal, rankBy } from "./grading";
import type { Assessment } from "./types";
import { one, rows } from "./db";
import {
  attendanceStats,
  classForTerm,
  getClass,
  getPupil,
  getSettings,
  getTerm,
  pupilsForTerm,
  releaseOf,
  scheduleTotal,
  scoresForClass,
  subjectsForTrack,
  type Pupil,
  type ScoreRow,
  type SubjectRow,
} from "./repo";

async function oneRemark(studentId: number, termId: number) {
  return (await one<{ form_comment: string; principal_remark: string }>(
    "SELECT form_comment, principal_remark FROM remarks WHERE student_id=? AND term_id=?",
    studentId,
    termId,
  ));
}

async function traits(studentId: number, termId: number) {
  return (await rows<{ trait: string; domain: string; rating: number }>(
    "SELECT trait, domain, rating FROM trait_ratings WHERE student_id=? AND term_id=?",
    studentId,
    termId,
  ));
}

function totalOf(score: ScoreRow | undefined, assess: Assessment): number | null {
  if (assess.kind !== "numeric" || !score || score.ca == null || score.exam == null) return null;
  return score.ca + score.exam;
}

export type ReportSubject = {
  name: string;
  shortName: string;
  ca: number | null;
  exam: number | null;
  total: number | null;
  grade: string | null;
  remark: string | null;
  position: string | null;
  qualitative: string | null;
};

export type ReportSheet = {
  pupil: Pupil;
  classId: number;
  className: string;
  track: string;
  termLabel: string;
  term: Awaited<ReturnType<typeof getTerm>>;
  assess: Assessment;
  attendance: { opened: number; present: number; absent: number };
  subjects: ReportSubject[];
  totalScore: number | null;
  obtainable: number;
  average: number | null;
  position: string | null;
  numberInClass: number;
  affective: { trait: string; rating: number | null }[];
  psychomotor: { trait: string; rating: number | null }[];
  formComment: string;
  principalRemark: string;
  formTeacher: string;
  principal: string;
  nextFeesKobo: number;
  releaseStatus: string;
  age: number | null;
};

export async function buildReport(studentId: number, termId: number): Promise<ReportSheet | null> {
  const pupil = (await getPupil(studentId));
  const classId = (await classForTerm(studentId, termId));
  if (!pupil || !classId) return null;
  const klass = (await getClass(classId));
  if (!klass) return null;
  const term = (await getTerm(termId));
  const assess = assessmentOf(klass.track);
  const subjects = (await subjectsForTrack(klass.track));
  const cohort = (await pupilsForTerm(classId, termId));
  const scores = (await scoresForClass(classId, termId));
  const byKey = new Map(scores.map((score) => [`${score.student_id}:${score.subject_id}`, score]));
  const release = (await releaseOf(classId, termId));
  const settings = (await getSettings());

  const subjectPositions = new Map<number, Map<number, number>>();
  if (assess.kind === "numeric") {
    for (const subject of subjects) {
      const ranked = cohort
        .map((child) => ({ id: child.id, score: totalOf(byKey.get(`${child.id}:${subject.id}`), assess) }))
        .filter((row): row is { id: number; score: number } => row.score != null);
      subjectPositions.set(subject.id, rankBy(ranked));
    }
  }

  const completeIds: { id: number; score: number }[] = [];
  for (const child of cohort) {
    if (assess.kind !== "numeric") continue;
    const totals = subjects.map((subject) => totalOf(byKey.get(`${child.id}:${subject.id}`), assess));
    if (totals.every((value) => value != null)) {
      const sum = totals.reduce<number>((acc, value) => acc + (value ?? 0), 0);
      completeIds.push({ id: child.id, score: sum / subjects.length });
    }
  }
  const classRanks = rankBy(completeIds);

  const lines: ReportSubject[] = subjects.map((subject: SubjectRow) => {
    const score = byKey.get(`${pupil.id}:${subject.id}`);
    if (assess.kind === "qualitative") {
      return {
        name: subject.name,
        shortName: subject.short_name,
        ca: null,
        exam: null,
        total: null,
        grade: null,
        remark: null,
        position: null,
        qualitative: score?.qualitative ?? null,
      };
    }
    const total = totalOf(score, assess);
    const graded = total == null ? null : gradeScore(assess.scale, total);
    const pos = subjectPositions.get(subject.id)?.get(pupil.id);
    return {
      name: subject.name,
      shortName: subject.short_name,
      ca: score?.ca ?? null,
      exam: score?.exam ?? null,
      total,
      grade: graded?.grade ?? null,
      remark: graded?.remark ?? null,
      position: pos ? ordinal(pos) : null,
      qualitative: null,
    };
  });

  const mine = completeIds.find((row) => row.id === pupil.id);
  const remark = (await oneRemark(pupil.id, termId));
  const traitRows = (await traits(pupil.id, termId));
  const traitMap = new Map(traitRows.map((row) => [row.trait, row.rating]));
  const attendance = (await attendanceStats(pupil.id, termId));
  const age = pupil.dob ? ageYears(pupil.dob, term.ends_on) : null;

  return {
    pupil,
    classId,
    className: klass.arm ? `${klass.name} ${klass.arm}` : klass.name,
    track: klass.track,
    termLabel: `${term.name} Term · ${term.session_name}`,
    term,
    assess,
    attendance,
    subjects: lines,
    totalScore: mine && assess.kind === "numeric" ? Math.round(mine.score * subjects.length) : null,
    obtainable: subjects.length * 100,
    average: mine ? mine.score : null,
    position: mine ? ordinal(classRanks.get(pupil.id) ?? 0) : null,
    numberInClass: cohort.length,
    affective: AFFECTIVE.map((trait) => ({ trait, rating: traitMap.get(trait) ?? null })),
    psychomotor: PSYCHOMOTOR.map((trait) => ({ trait, rating: traitMap.get(trait) ?? null })),
    formComment: remark?.form_comment ?? "",
    principalRemark: remark?.principal_remark ?? "",
    formTeacher: release.form_teacher_name || klass.form_teacher_name || "Form teacher",
    principal: release.principal_name || settings.principal_name,
    nextFeesKobo: (await scheduleTotal(klass.track)),
    releaseStatus: release.status,
    age,
  };
}

function ageYears(dob: string, on: string): number | null {
  const born = new Date(dob + "T00:00:00Z");
  const at = new Date(on + "T00:00:00Z");
  if (Number.isNaN(born.getTime()) || Number.isNaN(at.getTime())) return null;
  let age = at.getUTCFullYear() - born.getUTCFullYear();
  const month = at.getUTCMonth() - born.getUTCMonth();
  if (month < 0 || (month === 0 && at.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

export type BroadRow = {
  pupil: Pupil;
  cells: { shortName: string; total: number | null; grade: string | null; qualitative: string | null }[];
  total: number | null;
  average: number | null;
  position: string | null;
};

export async function buildBroadsheet(classId: number, termId: number) {
  const klass = (await getClass(classId));
  if (!klass) return null;
  const term = (await getTerm(termId));
  const assess = assessmentOf(klass.track);
  const subjects = (await subjectsForTrack(klass.track));
  const cohort = (await pupilsForTerm(classId, termId));
  const scores = (await scoresForClass(classId, termId));
  const byKey = new Map(scores.map((score) => [`${score.student_id}:${score.subject_id}`, score]));
  const complete: { id: number; score: number }[] = [];
  const rowsOut: BroadRow[] = cohort.map((pupil) => {
    const cells = subjects.map((subject) => {
      const score = byKey.get(`${pupil.id}:${subject.id}`);
      if (assess.kind === "qualitative") {
        return { shortName: subject.short_name, total: null, grade: null, qualitative: score?.qualitative ?? null };
      }
      const total = totalOf(score, assess);
      const graded = total == null ? null : gradeScore(assess.scale, total);
      return { shortName: subject.short_name, total, grade: graded?.grade ?? null, qualitative: null };
    });
    const numeric = cells.map((cell) => cell.total);
    const done = assess.kind === "numeric" && numeric.every((value) => value != null);
    const sum = done ? numeric.reduce<number>((acc, value) => acc + (value ?? 0), 0) : null;
    if (done && sum != null) complete.push({ id: pupil.id, score: sum / subjects.length });
    return { pupil, cells, total: sum, average: done && sum != null ? sum / subjects.length : null, position: null };
  });
  const ranks = rankBy(complete);
  for (const row of rowsOut) {
    const pos = ranks.get(row.pupil.id);
    if (pos) row.position = ordinal(pos);
  }
  rowsOut.sort((a, b) => (ranks.get(a.pupil.id) ?? 999) - (ranks.get(b.pupil.id) ?? 999) || a.pupil.last_name.localeCompare(b.pupil.last_name));
  return {
    klass,
    className: klass.arm ? `${klass.name} ${klass.arm}` : klass.name,
    term,
    assess,
    subjects,
    rows: rowsOut,
    release: (await releaseOf(classId, termId)),
    settings: (await getSettings()),
  };
}
