import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/widgets";
import { qualitativeLabel } from "@/lib/grading";
import { buildBroadsheet } from "@/lib/report";
import { currentTerm } from "@/lib/repo";

export default async function BroadsheetPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ term?: string }> }) {
  const { classId } = await params;
  const query = await searchParams;
  const termId = Number(query.term || currentTerm().id);
  const board = buildBroadsheet(Number(classId), termId);
  if (!board) notFound();
  const numeric = board.assess.kind === "numeric";
  return (
    <div>
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/admin/results?term=${termId}`} className="text-sm font-semibold text-moss">Back to results</Link>
          <h1 className="font-serif text-3xl text-moss">{board.className}</h1>
          <p className="text-sm text-muted">{board.term.name} Term · {board.term.session_name} · {board.release.status}</p>
        </div>
        <PrintButton label="Print broadsheet" />
      </div>
      {board.release.status !== "published" ? <p className="mb-3 border border-clay px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-clay">Working broadsheet — not published</p> : null}
      <div className="broadsheet overflow-x-auto rounded-lg border border-line bg-white p-3">
        <p className="text-center font-serif text-xl">{board.settings.school_name}</p>
        <p className="text-center text-sm">{board.className} · {board.term.name} Term {board.term.session_name}</p>
        <table className="marks mt-3">
          <thead>
            <tr>
              <th>Learner</th>
              <th>Admission</th>
              {board.subjects.map((subject) => <th key={subject.id}>{subject.short_name}</th>)}
              {numeric ? <th>Total</th> : null}
              {numeric ? <th>Avg</th> : null}
              {numeric ? <th>Pos</th> : null}
            </tr>
          </thead>
          <tbody>
            {board.rows.map((row) => (
              <tr key={row.pupil.id}>
                <td>{row.pupil.last_name} {row.pupil.first_name}</td>
                <td>{row.pupil.admission_no}</td>
                {row.cells.map((cell) => <td key={cell.shortName}>{numeric ? cell.grade ?? "—" : qualitativeLabel(cell.qualitative).slice(0, 1)}</td>)}
                {numeric ? <td>{row.total ?? "—"}</td> : null}
                {numeric ? <td>{row.average == null ? "—" : row.average.toFixed(1)}</td> : null}
                {numeric ? <td>{row.position ?? "—"}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
