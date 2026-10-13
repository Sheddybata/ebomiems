import { balanceOf, termIsClear, type LedgerEntry } from "./fees";
import { assessmentOf, percent } from "./grading";
import { isRecentAdmission, todayISO } from "./format";
import { one, rows, run } from "./db";
import { SchoolError } from "./types";

export type TermRow = {
  id: number;
  session_id: number;
  name: string;
  session_name: string;
  starts_on: string;
  ends_on: string;
  next_begins_on: string | null;
  is_current: number;
};

export type ClassRow = {
  id: number;
  name: string;
  arm: string;
  track: string;
  level_code: string;
  sort_order: number;
  form_teacher_id: number | null;
  form_teacher_name: string | null;
  pupils: number;
};

export type SubjectRow = { id: number; name: string; short_name: string; track: string; sort_order: number };

export type SettingsRow = {
  id: number;
  school_name: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  principal_name: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  report_lock: number;
  current_session_id: number;
  current_term_id: number;
};

export type Pupil = {
  id: number;
  first_name: string;
  last_name: string;
  other_name: string;
  gender: "Female" | "Male";
  dob: string | null;
  admission_no: string;
  pin: string;
  class_id: number;
  parent_id: number;
  admitted_on: string;
  status: string;
  class_name: string;
  class_arm: string;
  track: string;
  level_code: string;
  sort_order: number;
  form_teacher_id: number | null;
  parent_name: string;
  parent_phone: string | null;
  parent_email: string | null;
  balance_kobo: number;
  previous_school: string | null;
  leaving_reason: string | null;
  previous_class: string | null;
  previous_position: string | null;
};

export type ScoreRow = {
  id: number;
  student_id: number;
  class_id: number;
  subject_id: number;
  term_id: number;
  ca: number | null;
  exam: number | null;
  qualitative: string | null;
};

const PUPIL_FROM = `
  SELECT s.id, s.first_name, s.last_name, s.other_name, s.gender, s.dob, s.admission_no, s.pin,
         s.class_id, s.parent_id, s.admitted_on, s.status,
         c.name AS class_name, c.arm AS class_arm, c.track, c.level_code, c.sort_order, c.form_teacher_id,
         s.previous_school, s.leaving_reason, s.previous_class, s.previous_position,
         p.name AS parent_name, p.phone AS parent_phone, p.email AS parent_email,
         COALESCE((SELECT SUM(CASE WHEN l.direction='debit' THEN l.amount_kobo ELSE -l.amount_kobo END)
                   FROM ledger l WHERE l.student_id = s.id), 0) AS balance_kobo
  FROM students s
  JOIN classes c ON c.id = s.class_id
  JOIN users p ON p.id = s.parent_id
`;

export async function getSettings(): Promise<SettingsRow> {
  const settings = (await one<SettingsRow>("SELECT * FROM settings WHERE id=1"));
  if (!settings) throw new SchoolError("School settings are not ready.");
  return settings;
}

export async function listTerms(): Promise<TermRow[]> {
  return (await rows<TermRow>(`
    SELECT t.*, se.name AS session_name
    FROM terms t JOIN sessions se ON se.id = t.session_id
    ORDER BY t.starts_on
  `));
}

export async function getTerm(id: number): Promise<TermRow> {
  const term = (await one<TermRow>(`
    SELECT t.*, se.name AS session_name
    FROM terms t JOIN sessions se ON se.id = t.session_id
    WHERE t.id=?
  `, id));
  if (!term) throw new SchoolError("That term does not exist.");
  return term;
}

export async function reconcileCurrentTerm(): Promise<void> {
  const terms = (await rows<{ id: number; session_id: number; ends_on: string }>("SELECT id, session_id, ends_on FROM terms ORDER BY starts_on, id"));
  if (!terms.length) return;
  const today = todayISO();
  const current = terms.find((term) => today <= term.ends_on) ?? terms[terms.length - 1];
  const settings = (await one<{ current_term_id: number }>("SELECT current_term_id FROM settings WHERE id=1"));
  if (settings?.current_term_id === current.id) return;
  (await run("UPDATE terms SET is_current=0"));
  (await run("UPDATE sessions SET is_current=0"));
  (await run("UPDATE terms SET is_current=1 WHERE id=?", current.id));
  (await run("UPDATE sessions SET is_current=1 WHERE id=?", current.session_id));
  (await run("UPDATE settings SET current_term_id=?, current_session_id=? WHERE id=1", current.id, current.session_id));
}

export async function currentTerm(): Promise<TermRow> {
  (await reconcileCurrentTerm());
  return (await getTerm((await getSettings()).current_term_id));
}

export async function listSessions(): Promise<{ id: number; name: string; is_current: number }[]> {
  return (await rows("SELECT * FROM sessions ORDER BY name"));
}

export async function listClasses(): Promise<ClassRow[]> {
  return (await rows<ClassRow>(`
    SELECT c.*, u.name AS form_teacher_name,
           (SELECT COUNT(*) FROM students s WHERE s.class_id=c.id AND s.status='active') AS pupils
    FROM classes c
    LEFT JOIN users u ON u.id = c.form_teacher_id
    ORDER BY c.sort_order, c.name, c.arm
  `));
}

export async function getClass(id: number): Promise<ClassRow | undefined> {
  return (await listClasses()).find((klass) => klass.id === id);
}

export async function subjectsForTrack(track: string): Promise<SubjectRow[]> {
  return (await rows<SubjectRow>("SELECT * FROM subjects WHERE track=? ORDER BY sort_order, name", track));
}

export async function listSubjects(): Promise<SubjectRow[]> {
  return (await rows<SubjectRow>("SELECT * FROM subjects ORDER BY track, sort_order, id"));
}

export async function getSubject(id: number): Promise<SubjectRow | undefined> {
  return (await one<SubjectRow>("SELECT * FROM subjects WHERE id=?", id));
}

export async function listStaff(): Promise<{ id: number; role: string; name: string; email: string | null; phone: string | null }[]> {
  return (await rows("SELECT id, role, name, email, phone FROM users WHERE role IN ('admin','bursar','teacher') ORDER BY role, name"));
}

export async function listParents(): Promise<{ id: number; name: string; email: string | null; phone: string | null }[]> {
  return (await rows("SELECT id, name, email, phone FROM users WHERE role='parent' ORDER BY name"));
}

export async function getPupil(id: number): Promise<Pupil | undefined> {
  return (await one<Pupil>(`${PUPIL_FROM} WHERE s.id=?`, id));
}

export async function findByAdmissionPin(admission: string, pin: string): Promise<Pupil | undefined> {
  const code = admission.trim().toUpperCase().replace(/\s+/g, "");
  return (await one<Pupil>(`${PUPIL_FROM} WHERE s.admission_no=? AND s.pin=?`, code, pin.trim()));
}

export async function searchPupils(query: string, includeWithdrawn = false): Promise<Pupil[]> {
  const q = query.trim().toLowerCase();
  const status = includeWithdrawn ? "" : "AND s.status='active'";
  if (!q) return (await rows<Pupil>(`${PUPIL_FROM} WHERE 1=1 ${status} ORDER BY c.sort_order, s.last_name, s.first_name`));
  return (await rows<Pupil>(
    `${PUPIL_FROM}
     WHERE 1=1 ${status}
       AND (
         lower(s.first_name || ' ' || s.last_name) LIKE '%' || ? || '%'
         OR lower(s.admission_no) LIKE '%' || ? || '%'
         OR lower(p.name) LIKE '%' || ? || '%'
         OR ifnull(p.phone,'') LIKE '%' || ? || '%'
       )
     ORDER BY c.sort_order, s.last_name, s.first_name`,
    q,
    q,
    q,
    q,
  ));
}

export async function activeRoster(classId: number): Promise<Pupil[]> {
  return (await rows<Pupil>(`${PUPIL_FROM} WHERE s.class_id=? AND s.status='active' ORDER BY s.last_name, s.first_name`, classId));
}

export async function pupilsForTerm(classId: number, termId: number): Promise<Pupil[]> {
  const term = (await getTerm(termId));
  if (term.is_current) return (await activeRoster(classId));
  const ids = (await rows<{ student_id: number }>("SELECT DISTINCT student_id FROM scores WHERE class_id=? AND term_id=?", classId, termId));
  if (!ids.length) return [];
  const pupils = (await Promise.all(ids.map((row) => getPupil(row.student_id)))).filter((pupil): pupil is Pupil => Boolean(pupil));
  return pupils.sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));
}

export type Release = {
  status: "open" | "locked" | "approved" | "published";
  form_teacher_name: string | null;
  principal_name: string | null;
};

export async function releaseOf(classId: number, termId: number): Promise<Release> {
  const row = (await one<Release>("SELECT status, form_teacher_name, principal_name FROM result_releases WHERE class_id=? AND term_id=?", classId, termId));
  return row ?? { status: "open", form_teacher_name: null, principal_name: null };
}

export async function ledgerOf(studentId: number): Promise<LedgerEntry[]> {
  return (await rows<LedgerEntry>("SELECT id, term_id, direction, amount_kobo, created_at FROM ledger WHERE student_id=? ORDER BY created_at, id", studentId));
}

export async function ledgerRows(studentId: number) {
  return (await rows<{
    id: number;
    term_id: number | null;
    direction: "debit" | "credit";
    amount_kobo: number;
    method: string | null;
    receipt_no: string | null;
    narration: string;
    created_at: string;
    proof_id: number | null;
  }>("SELECT id, term_id, direction, amount_kobo, method, receipt_no, narration, created_at, proof_id FROM ledger WHERE student_id=? ORDER BY created_at, id", studentId));
}

export async function classForTerm(studentId: number, termId: number): Promise<number | null> {
  const score = (await one<{ class_id: number }>("SELECT class_id FROM scores WHERE student_id=? AND term_id=? LIMIT 1", studentId, termId));
  if (score) return score.class_id;
  const summary = (await one<{ class_id: number }>("SELECT class_id FROM attendance_summaries WHERE student_id=? AND term_id=?", studentId, termId));
  if (summary) return summary.class_id;
  if ((await getTerm(termId)).is_current) return (await one<{ class_id: number }>("SELECT class_id FROM students WHERE id=?", studentId))?.class_id ?? null;
  return null;
}

export async function gateTerm(studentId: number, termId: number): Promise<"unpublished" | "held" | "ready" | "none"> {
  const classId = (await classForTerm(studentId, termId));
  if (!classId) return "none";
  if ((await releaseOf(classId, termId)).status !== "published") return "unpublished";
  if ((await getSettings()).report_lock && !termIsClear((await ledgerOf(studentId)), termId)) return "held";
  return "ready";
}

export async function classProgress(classId: number, termId: number) {
  const klass = (await getClass(classId));
  if (!klass) throw new SchoolError("Class not found.");
  const assess = assessmentOf(klass.track);
  const subjects = (await subjectsForTrack(klass.track));
  const pupils = (await pupilsForTerm(classId, termId));
  const scoreRows = (await rows<ScoreRow>("SELECT * FROM scores WHERE class_id=? AND term_id=?", classId, termId));
  const map = new Map(scoreRows.map((score) => [`${score.student_id}:${score.subject_id}`, score]));
  let filled = 0;
  let examFilled = 0;
  const total = pupils.length * subjects.length;
  for (const pupil of pupils) {
    for (const subject of subjects) {
      const cell = map.get(`${pupil.id}:${subject.id}`);
      if (assess.kind === "qualitative") {
        if (cell?.qualitative) filled += 1;
      } else {
        if (cell?.ca != null) filled += 1;
        if (cell?.exam != null) examFilled += 1;
      }
    }
  }
  const term = (await getTerm(termId));
  let todayRegister: "marked" | "due" | "none" = "none";
  if (term.is_current && (await activeRoster(classId)).length > 0) {
    const weekday = new Date(todayISO() + "T00:00:00Z").getUTCDay();
    if (weekday !== 0 && weekday !== 6) {
      const day = (await one("SELECT id FROM attendance_days WHERE class_id=? AND term_id=? AND day=?", classId, termId, todayISO()));
      todayRegister = day ? "marked" : "due";
    }
  }
  return {
    pupils: pupils.length,
    newPupils: pupils.filter((pupil) => isRecentAdmission(pupil.admitted_on) && pupil.class_id === classId).length,
    caPct: percent(filled, total),
    examPct: assess.kind === "numeric" ? percent(examFilled, total) : null,
    missing: total - filled,
    examMissing: assess.kind === "numeric" ? total - examFilled : 0,
    todayRegister,
    kind: assess.kind,
  };
}

export async function commandCentre() {
  const term = (await currentTerm());
  const classes = (await listClasses()).filter((klass) => klass.pupils > 0);
  const progress = await Promise.all(classes.map(async (klass) => ({ klass, progress: await classProgress(klass.id, term.id) })));
  const debtors = (await listDebtors());
  return {
    term,
    openCa: progress.filter((row) => row.progress.missing > 0),
    waitingExam: progress.filter((row) => row.progress.missing === 0 && (row.progress.examMissing ?? 0) > 0),
    debtors: debtors.slice(0, 8),
    debtorCount: debtors.length,
    debtorTotal: debtors.reduce((sum, row) => sum + row.balance_kobo, 0),
    admissions: (await rows<Pupil>(`${PUPIL_FROM} WHERE s.status='active' AND s.admitted_on >= ? ORDER BY s.admitted_on DESC, s.last_name`, term.starts_on)),
    payments: (await rows<{ id: number; amount_kobo: number; method: string | null; receipt_no: string | null; created_at: string; first_name: string; last_name: string; admission_no: string }>(`
      SELECT l.id, l.amount_kobo, l.method, l.receipt_no, l.created_at, s.first_name, s.last_name, s.admission_no
      FROM ledger l JOIN students s ON s.id=l.student_id
      WHERE l.direction='credit' ORDER BY l.created_at DESC, l.id DESC LIMIT 6
    `)),
  };
}

export async function resultsBoard(termId: number) {
  return (
    await Promise.all(
      (await listClasses()).map(async (klass) => ({
        klass,
        progress: await classProgress(klass.id, termId),
        release: await releaseOf(klass.id, termId),
      })),
    )
  ).filter((row) => row.progress.pupils > 0 || row.release.status !== "open");
}

export async function scoresForClass(classId: number, termId: number): Promise<ScoreRow[]> {
  return (await rows<ScoreRow>("SELECT * FROM scores WHERE class_id=? AND term_id=?", classId, termId));
}

export async function markbook(classId: number, termId: number, subjectId: number) {
  const klass = (await getClass(classId));
  const subject = (await getSubject(subjectId));
  if (!klass || !subject || subject.track !== klass.track) throw new SchoolError("That subject is not offered in this class.");
  const pupils = (await pupilsForTerm(classId, termId));
  const scores = (await scoresForClass(classId, termId)).filter((score) => score.subject_id === subjectId);
  const byStudent = new Map(scores.map((score) => [score.student_id, score]));
  return {
    klass,
    subject,
    term: (await getTerm(termId)),
    assess: assessmentOf(klass.track),
    release: (await releaseOf(classId, termId)),
    subjects: (await subjectsForTrack(klass.track)),
    rows: pupils.map((pupil) => ({ pupil, score: byStudent.get(pupil.id) })),
  };
}

export async function formRoster(classId: number) {
  const term = (await currentTerm());
  return Promise.all(
    (await activeRoster(classId)).map(async (pupil) => {
      const remark = await one<{ form_comment: string }>("SELECT form_comment FROM remarks WHERE student_id=? AND term_id=?", pupil.id, term.id);
      return { ...pupil, isNew: isRecentAdmission(pupil.admitted_on), hasComment: Boolean(remark?.form_comment?.trim()) };
    }),
  );
}

export async function commentSheet(classId: number) {
  const term = (await currentTerm());
  const klass = (await getClass(classId));
  if (!klass) throw new SchoolError("Class not found.");
  const assess = assessmentOf(klass.track);
  return {
    klass,
    term,
    assess,
    release: (await releaseOf(classId, term.id)),
    pupils: await Promise.all(
      (await activeRoster(classId)).map(async (pupil) => ({
        pupil,
        remark: await one<{ form_comment: string; principal_remark: string }>("SELECT form_comment, principal_remark FROM remarks WHERE student_id=? AND term_id=?", pupil.id, term.id),
        traits: await rows<{ trait: string; domain: string; rating: number }>("SELECT trait, domain, rating FROM trait_ratings WHERE student_id=? AND term_id=?", pupil.id, term.id),
        projected: await projectedAverage(pupil.id, term.id, klass.track),
      })),
    ),
  };
}

async function projectedAverage(studentId: number, termId: number, track: string): Promise<number | null> {
  const assess = assessmentOf(track);
  if (assess.kind !== "numeric") return null;
  const scores = (await rows<ScoreRow>("SELECT * FROM scores WHERE student_id=? AND term_id=? AND ca IS NOT NULL", studentId, termId));
  if (!scores.length) return null;
  const total = scores.reduce((sum, score) => sum + Math.round(((score.ca ?? 0) / assess.caMax) * 100), 0);
  return total / scores.length;
}

export async function teacherDesk(userId: number) {
  const term = (await currentTerm());
  const classes = (await rows<{ class_id: number; is_form_teacher: number }>("SELECT class_id, is_form_teacher FROM teacher_classes WHERE user_id=?", userId));
  return {
    term,
    notices: (await noticesFor(userId)).slice(0, 6),
    classes: await Promise.all(
      classes.map(async (row) => {
        const klass = (await getClass(row.class_id))!;
        const progress = await classProgress(row.class_id, term.id);
        const newcomers = (await activeRoster(row.class_id)).filter((pupil) => isRecentAdmission(pupil.admitted_on));
        return { klass, isForm: row.is_form_teacher === 1, progress, newcomers };
      }),
    ),
  };
}

export async function attendanceStats(studentId: number, termId: number) {
  const marks = (await rows<{ status: string }>(`
    SELECT m.status FROM attendance_marks m
    JOIN attendance_days d ON d.id=m.day_id
    WHERE m.student_id=? AND d.term_id=?
  `, studentId, termId));
  if (marks.length) {
    const present = marks.filter((mark) => mark.status !== "absent").length;
    return { opened: marks.length, present, absent: marks.length - present };
  }
  const summary = (await one<{ days_opened: number; days_present: number }>("SELECT days_opened, days_present FROM attendance_summaries WHERE student_id=? AND term_id=?", studentId, termId));
  if (!summary) return { opened: 0, present: 0, absent: 0 };
  return { opened: summary.days_opened, present: summary.days_present, absent: Math.max(0, summary.days_opened - summary.days_present) };
}

export async function attendanceHistory(studentId: number, termId: number) {
  return (await rows<{ day: string; status: string }>(`
    SELECT d.day, m.status
    FROM attendance_marks m JOIN attendance_days d ON d.id=m.day_id
    WHERE m.student_id=? AND d.term_id=?
    ORDER BY d.day
  `, studentId, termId));
}

export async function registerDay(classId: number, day: string) {
  const term = (await currentTerm());
  const dayRow = (await one<{ id: number }>("SELECT id FROM attendance_days WHERE class_id=? AND term_id=? AND day=?", classId, term.id, day));
  const marks = dayRow
    ? (await rows<{ student_id: number; status: string }>("SELECT student_id, status FROM attendance_marks WHERE day_id=?", dayRow.id))
    : [];
  return {
    term,
    pupils: (await activeRoster(classId)),
    marks: new Map(marks.map((mark) => [mark.student_id, mark.status])),
    recent: (await rows<{ day: string }>("SELECT day FROM attendance_days WHERE class_id=? AND term_id=? ORDER BY day DESC LIMIT 12", classId, term.id)),
  };
}

export async function bursarOverview() {
  const term = (await currentTerm());
  const outstanding = (await one<{ balance: number }>("SELECT COALESCE(SUM(CASE WHEN direction='debit' THEN amount_kobo ELSE -amount_kobo END),0) AS balance FROM ledger"))?.balance ?? 0;
  const collected = (await one<{ value: number }>("SELECT COALESCE(SUM(amount_kobo),0) AS value FROM ledger WHERE direction='credit' AND substr(created_at,1,10) >= ?", term.starts_on))?.value ?? 0;
  const billed = (await one<{ value: number }>("SELECT COALESCE(SUM(amount_kobo),0) AS value FROM ledger WHERE direction='debit' AND term_id=?", term.id))?.value ?? 0;
  const opening = outstanding - billed + collected;
  const expected = opening + billed;
  const byMethod = (await rows<{ method: string; value: number }>(`
    SELECT COALESCE(method, 'other') AS method, COALESCE(SUM(amount_kobo),0) AS value
    FROM ledger WHERE direction='credit' AND substr(created_at,1,10) >= ?
    GROUP BY method
  `, term.starts_on));
  const byClass = new Map<string, { label: string; sort: number; kobo: number; families: number }>();
  for (const debtor of (await listDebtors())) {
    const label = debtor.class_arm ? `${debtor.class_name} ${debtor.class_arm}` : debtor.class_name;
    const current = byClass.get(label) ?? { label, sort: debtor.sort_order, kobo: 0, families: 0 };
    current.kobo += debtor.balance_kobo;
    current.families += 1;
    byClass.set(label, current);
  }
  return {
    term,
    outstanding,
    collected,
    billed,
    opening,
    expected,
    rate: expected > 0 ? collected / expected : 0,
    byMethod,
    byClass: [...byClass.values()].sort((a, b) => a.sort - b.sort),
    pending: (await one<{ c: number }>("SELECT COUNT(*) AS c FROM proofs WHERE status='pending'"))?.c ?? 0,
  };
}

export async function listDebtors(): Promise<Pupil[]> {
  return (await rows<Pupil>(`SELECT * FROM (${PUPIL_FROM}) q WHERE q.status='active' AND q.balance_kobo > 0 ORDER BY q.sort_order, q.balance_kobo DESC`));
}

export async function feeItems() {
  return (await rows<{ id: number; track: string; label: string; amount_kobo: number; sort_order: number; active: number }>("SELECT * FROM fee_items ORDER BY track, sort_order, id"));
}

export async function activeFeeItems(track: string) {
  const feeKey = track.startsWith("sss") ? "sss" : track;
  return (await rows<{ id: number; label: string; amount_kobo: number; sort_order: number }>(
    "SELECT id, label, amount_kobo, sort_order FROM fee_items WHERE track=? AND active=1 ORDER BY sort_order, id",
    feeKey,
  ));
}

export async function scheduleTotal(track: string): Promise<number> {
  return (await activeFeeItems(track)).reduce((sum, item) => sum + item.amount_kobo, 0);
}

export type InvoiceListRow = {
  id: number;
  number: string;
  student_id: number;
  term_id: number;
  arrears_kobo: number;
  issued_at: string;
  first_name: string;
  last_name: string;
  admission_no: string;
  class_name: string;
  class_arm: string;
  term_name: string;
  session_name: string;
  lines_kobo: number;
};

export async function listInvoices(query: string): Promise<InvoiceListRow[]> {
  const q = query.trim().toLowerCase();
  const filter = q
    ? "WHERE lower(s.admission_no) LIKE '%' || ? || '%' OR lower(s.first_name || ' ' || s.last_name) LIKE '%' || ? || '%' OR lower(i.number) LIKE '%' || ? || '%'"
    : "WHERE i.term_id = ?";
  const params = q ? [q, q, q] : [(await currentTerm()).id];
  return (await rows<InvoiceListRow>(`
    SELECT i.id, i.number, i.student_id, i.term_id, i.arrears_kobo, i.issued_at,
           s.first_name, s.last_name, s.admission_no, c.name AS class_name, c.arm AS class_arm,
           t.name AS term_name, se.name AS session_name,
           (SELECT COALESCE(SUM(amount_kobo),0) FROM invoice_lines WHERE invoice_id=i.id) AS lines_kobo
    FROM invoices i
    JOIN students s ON s.id=i.student_id
    JOIN classes c ON c.id=s.class_id
    JOIN terms t ON t.id=i.term_id
    JOIN sessions se ON se.id=t.session_id
    ${filter}
    ORDER BY i.issued_at DESC, i.id DESC
    LIMIT 100
  `, ...params));
}

export async function getInvoice(id: number) {
  const invoice = (await one<InvoiceListRow & { issued_by: number | null }>(`
    SELECT i.*, s.first_name, s.last_name, s.admission_no, s.id AS student_id,
           c.name AS class_name, c.arm AS class_arm,
           t.name AS term_name, se.name AS session_name,
           (SELECT COALESCE(SUM(amount_kobo),0) FROM invoice_lines WHERE invoice_id=i.id) AS lines_kobo
    FROM invoices i
    JOIN students s ON s.id=i.student_id
    JOIN classes c ON c.id=s.class_id
    JOIN terms t ON t.id=i.term_id
    JOIN sessions se ON se.id=t.session_id
    WHERE i.id=?
  `, id));
  if (!invoice) return undefined;
  const lines = (await rows<{ id: number; label: string; amount_kobo: number }>("SELECT id, label, amount_kobo FROM invoice_lines WHERE invoice_id=? ORDER BY sort_order, id", id));
  const pupil = (await getPupil(invoice.student_id));
  return { invoice, lines, pupil, ledger: (await ledgerRows(invoice.student_id)) };
}

export type ProofRow = {
  id: number;
  student_id: number;
  amount_kobo: number;
  approved_kobo: number | null;
  bank_name: string | null;
  reference: string;
  paid_on: string;
  note: string | null;
  file_path: string | null;
  content_type: string | null;
  status: string;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  admission_no: string;
  class_name: string;
  class_arm: string;
  parent_id: number;
  parent_phone: string | null;
  balance_kobo: number;
};

export async function listProofs(status: string): Promise<ProofRow[]> {
  return (await rows<ProofRow>(`
    SELECT pr.*, s.first_name, s.last_name, s.admission_no, s.parent_id,
           c.name AS class_name, c.arm AS class_arm, p.phone AS parent_phone,
           COALESCE((SELECT SUM(CASE WHEN l.direction='debit' THEN l.amount_kobo ELSE -l.amount_kobo END) FROM ledger l WHERE l.student_id=s.id),0) AS balance_kobo
    FROM proofs pr
    JOIN students s ON s.id=pr.student_id
    JOIN classes c ON c.id=s.class_id
    JOIN users p ON p.id=s.parent_id
    WHERE pr.status=?
    ORDER BY pr.created_at DESC, pr.id DESC
  `, status));
}

export async function getProof(id: number): Promise<ProofRow | undefined> {
  return (await one<ProofRow>(`
    SELECT pr.*, s.first_name, s.last_name, s.admission_no, s.parent_id,
           c.name AS class_name, c.arm AS class_arm, p.phone AS parent_phone,
           COALESCE((SELECT SUM(CASE WHEN l.direction='debit' THEN l.amount_kobo ELSE -l.amount_kobo END) FROM ledger l WHERE l.student_id=s.id),0) AS balance_kobo
    FROM proofs pr
    JOIN students s ON s.id=pr.student_id
    JOIN classes c ON c.id=s.class_id
    JOIN users p ON p.id=s.parent_id
    WHERE pr.id=?
  `, id));
}

export async function noticesFor(userId: number) {
  return (await rows<{ id: number; title: string; body: string; student_id: number | null; created_at: string; read_at: string | null }>(
    "SELECT id, title, body, student_id, created_at, read_at FROM notices WHERE user_id=? ORDER BY id DESC",
    userId,
  ));
}

export async function unreadCount(userId: number): Promise<number> {
  return (await one<{ c: number }>("SELECT COUNT(*) AS c FROM notices WHERE user_id=? AND read_at IS NULL", userId))?.c ?? 0;
}

export async function parentDesk(parentId: number) {
  const children = (await rows<Pupil>(`${PUPIL_FROM} WHERE s.parent_id=? AND s.status='active' ORDER BY c.sort_order, s.first_name`, parentId));
  const term = (await currentTerm());
  return {
    term,
    notices: (await noticesFor(parentId)),
    unread: (await unreadCount(parentId)),
    children: await Promise.all(
      children.map(async (child) => {
        const terms = (
          await Promise.all(
            (await listTerms()).map(async (item) => ({
              term: item,
              gate: await gateTerm(child.id, item.id),
              classId: await classForTerm(child.id, item.id),
            })),
          )
        ).filter((item) => item.gate !== "none");
        return {
          child,
          isNew: isRecentAdmission(child.admitted_on),
          terms,
          attendance: await attendanceStats(child.id, term.id),
          currentScores: await rows<ScoreRow>("SELECT * FROM scores WHERE student_id=? AND term_id=?", child.id, term.id),
        };
      }),
    ),
  };
}

export async function getReceipt(ledgerId: number) {
  const entry = (await one<{
    id: number;
    student_id: number;
    amount_kobo: number;
    method: string | null;
    receipt_no: string | null;
    narration: string;
    created_at: string;
    direction: string;
  }>("SELECT * FROM ledger WHERE id=?", ledgerId));
  if (!entry || entry.direction !== "credit") return undefined;
  const pupil = (await getPupil(entry.student_id));
  if (!pupil) return undefined;
  const entries = (await ledgerOf(entry.student_id));
  const index = entries.findIndex((item) => item.id === entry.id);
  return { entry, pupil, balanceAfter: balanceOf(entries.slice(0, index + 1)), settings: (await getSettings()) };
}

export async function studentInvoices(studentId: number): Promise<InvoiceListRow[]> {
  return (await rows<InvoiceListRow>(`
    SELECT i.id, i.number, i.student_id, i.term_id, i.arrears_kobo, i.issued_at,
           s.first_name, s.last_name, s.admission_no, c.name AS class_name, c.arm AS class_arm,
           t.name AS term_name, se.name AS session_name,
           (SELECT COALESCE(SUM(amount_kobo),0) FROM invoice_lines WHERE invoice_id=i.id) AS lines_kobo
    FROM invoices i
    JOIN students s ON s.id=i.student_id
    JOIN classes c ON c.id=s.class_id
    JOIN terms t ON t.id=i.term_id
    JOIN sessions se ON se.id=t.session_id
    WHERE i.student_id=?
    ORDER BY i.issued_at, i.id
  `, studentId));
}

export async function studentProofs(studentId: number) {
  return (await rows<ProofRow>("SELECT pr.*, s.first_name, s.last_name, s.admission_no, s.parent_id, c.name AS class_name, c.arm AS class_arm, p.phone AS parent_phone, 0 AS balance_kobo FROM proofs pr JOIN students s ON s.id=pr.student_id JOIN classes c ON c.id=s.class_id JOIN users p ON p.id=s.parent_id WHERE pr.student_id=? ORDER BY pr.id DESC", studentId));
}

export async function teacherOwns(userId: number, classId: number, formOnly = false): Promise<boolean> {
  const row = (await one<{ is_form_teacher: number }>("SELECT is_form_teacher FROM teacher_classes WHERE user_id=? AND class_id=?", userId, classId));
  if (!row) return false;
  if (formOnly && row.is_form_teacher !== 1) return false;
  return true;
}

export type EnquiryRow = {
  id: number;
  kind: "apply" | "inquire" | "tour" | "teach";
  name: string;
  email: string | null;
  phone: string;
  child_name: string | null;
  child_dob: string | null;
  stage: string | null;
  previous_school: string | null;
  visit_on: string | null;
  subject: string | null;
  note: string;
  status: "new" | "seen";
  created_at: string;
};

export async function getEnquiry(id: number): Promise<EnquiryRow | undefined> {
  return (await one<EnquiryRow>("SELECT * FROM enquiries WHERE id=?", id));
}

export async function listEnquiries(kind?: string): Promise<EnquiryRow[]> {
  if (kind && ["apply", "inquire", "tour", "teach"].includes(kind)) {
    return (await rows<EnquiryRow>("SELECT * FROM enquiries WHERE kind=? ORDER BY status='seen', id DESC", kind));
  }
  return (await rows<EnquiryRow>("SELECT * FROM enquiries ORDER BY status='seen', id DESC"));
}

export async function countNewEnquiries(): Promise<number> {
  return (await one<{ c: number }>("SELECT COUNT(*) AS c FROM enquiries WHERE status='new'"))?.c ?? 0;
}

export async function countUsers(): Promise<number> {
  return (await one<{ c: number }>("SELECT COUNT(*) AS c FROM users"))?.c ?? 0;
}
