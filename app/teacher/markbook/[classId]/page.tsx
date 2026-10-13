import Link from "next/link";
import { notFound } from "next/navigation";
import { Banner, inputClass } from "@/components/ui";
import { ClassBar } from "@/components/teacher-class";
import { saveScores } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { QUALITATIVE } from "@/lib/grading";
import { classLabel, termTitle } from "@/lib/format";
import { currentTerm, getClass, markbook, scoresForClass, subjectsForTrack, teacherOwns } from "@/lib/repo";

export default async function MarkbookPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ subject?: string; term?: string; error?: string; ok?: string }> }) {
  const user = await requireUser("teacher");
  const { classId } = await params;
  const query = await searchParams;
  const id = Number(classId);
  if (!teacherOwns(user.id, id)) notFound();
  const klass = getClass(id);
  if (!klass) notFound();
  const termId = Number(query.term || currentTerm().id);
  const subjects = subjectsForTrack(klass.track);
  const subjectId = Number(query.subject || subjects[0]?.id);
  let book;
  try {
    book = markbook(id, termId, subjectId);
  } catch {
    notFound();
  }
  const locked = book.release.status !== "open";
  const gaps = book.rows.filter((row) => (book.assess.kind === "numeric" ? row.score?.ca == null : !row.score?.qualitative));
  const stored = scoresForClass(id, termId);
  const byCell = new Map(stored.map((score) => [`${score.student_id}:${score.subject_id}`, score]));
  const openSubjects = new Set<number>();
  for (const subject of book.subjects) {
    const blank = book.rows.some((row) => {
      const cell = byCell.get(`${row.pupil.id}:${subject.id}`);
      return book.assess.kind === "numeric" ? cell?.ca == null : !cell?.qualitative;
    });
    if (blank) openSubjects.add(subject.id);
  }
  return (
    <div>
      <ClassBar classId={id} label={classLabel(book.klass.name, book.klass.arm)} term={termTitle(book.term.name, book.term.session_name)} isForm={teacherOwns(user.id, id, true)} current="markbook" />
      <Banner error={query.error} ok={query.ok} />
      <div className="flex flex-wrap gap-2 text-sm">
        {book.subjects.map((subject) => {
          const selected = subject.id === book.subject.id;
          const unfinished = openSubjects.has(subject.id);
          return (
            <Link
              key={subject.id}
              href={`/teacher/markbook/${classId}?term=${termId}&subject=${subject.id}`}
              className={`rounded-full px-3 py-1 ${selected ? "bg-moss text-white" : unfinished ? "bg-clay-soft text-clay ring-1 ring-clay/40" : "bg-card ring-1 ring-line"}`}
            >
              {subject.name}
            </Link>
          );
        })}
      </div>
      {gaps.length > 0 ? (
        <p className="mt-3 text-sm text-clay">Still open in {book.subject.name}: {gaps.map((row) => `${row.pupil.first_name} ${row.pupil.last_name}`).join(", ")}.</p>
      ) : (
        <p className="mt-3 text-sm text-leaf">Every learner has a score in {book.subject.name}.</p>
      )}
      <form action={saveScores} className="mt-4 rounded-lg border border-line bg-card">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="termId" value={termId} />
        <input type="hidden" name="subjectId" value={book.subject.id} />
        <input type="hidden" name="studentIds" value={book.rows.map((row) => row.pupil.id).join(",")} />
        <ul>
          {book.rows.map((row) => {
            const total = row.score?.ca != null && row.score.exam != null ? row.score.ca + row.score.exam : null;
            const missing = book.assess.kind === "numeric" ? row.score?.ca == null : !row.score?.qualitative;
            return (
              <li key={row.pupil.id} className={`border-t border-line px-3 py-3 ${missing ? "bg-clay-soft/40" : ""}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 font-medium">{row.pupil.last_name} {row.pupil.first_name}</p>
                  {book.assess.kind === "numeric" ? <p className="shrink-0 tabular-nums text-sm text-muted">{total ?? "—"}</p> : null}
                </div>
                <p className="text-xs text-muted">{row.pupil.admission_no}</p>
                {book.assess.kind === "numeric" ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <label className="text-xs text-muted">CA / {book.assess.caMax}<input name={`ca_${row.pupil.id}`} inputMode="numeric" defaultValue={row.score?.ca ?? ""} className={`${inputClass} mt-1 text-base`} disabled={locked} /></label>
                    <label className="text-xs text-muted">Exam / {book.assess.examMax}<input name={`exam_${row.pupil.id}`} inputMode="numeric" defaultValue={row.score?.exam ?? ""} className={`${inputClass} mt-1 text-base`} disabled={locked} /></label>
                  </div>
                ) : (
                  <select name={`q_${row.pupil.id}`} defaultValue={row.score?.qualitative || ""} className={`${inputClass} mt-2 text-base`} disabled={locked}>
                    <option value="">—</option>
                    {QUALITATIVE.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
        {locked ? <p className="sticky bottom-0 border-t border-line bg-card px-3 py-3 text-sm text-clay">This markbook is locked.</p> : <div className="sticky bottom-0 border-t border-line bg-card px-3 py-3"><button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save {book.subject.name}</button></div>}
      </form>
    </div>
  );
}
