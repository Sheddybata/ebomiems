import Link from "next/link";
import { Banner, PageTitle } from "@/components/ui";
import { setRelease } from "@/lib/actions";
import { classLabel, termTitle } from "@/lib/format";
import { currentTerm, listTerms, resultsBoard } from "@/lib/repo";

const NEXT: Record<string, [string, string][]> = {
  open: [["lock", "Lock"]],
  locked: [["unlock", "Unlock"], ["approve", "Approve"]],
  approved: [["return", "Return to teacher"], ["publish", "Publish"]],
  published: [["unpublish", "Unpublish"]],
};

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ term?: string; error?: string; ok?: string }> }) {
  const query = await searchParams;
  const terms = listTerms();
  const termId = Number(query.term || currentTerm().id);
  const term = terms.find((item) => item.id === termId) ?? currentTerm();
  const rows = resultsBoard(term.id);
  return (
    <div>
      <PageTitle title="Results" lede="Only the next legal step is shown. Lock tells the form teacher and freezes scores. Return sends the markbook back to the teacher. Publish tells each parent. A fee hold can still hide a published term until that term’s charges are covered." />
      <Banner error={query.error} ok={query.ok} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {terms.map((item) => (
          <Link key={item.id} href={`/admin/results?term=${item.id}`} className={`rounded-full px-3 py-1 ${item.id === term.id ? "bg-moss text-white" : "bg-card ring-1 ring-line"}`}>
            {termTitle(item.name, item.session_name)}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Class</th>
              <th>Learners</th>
              <th>CA</th>
              <th>Exam</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.klass.id} className="border-t border-line align-top">
                <td className="px-3 py-2">
                  <Link className="font-semibold text-moss" href={`/admin/results/${row.klass.id}?term=${term.id}`}>{classLabel(row.klass.name, row.klass.arm)}</Link>
                </td>
                <td>{row.progress.pupils}</td>
                <td>{row.progress.caPct}%</td>
                <td>{row.progress.examPct == null ? "—" : `${row.progress.examPct}%`}</td>
                <td className="capitalize">{row.release.status}</td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {(NEXT[row.release.status] || []).map(([intent, label]) => (
                      <form key={intent} action={setRelease}>
                        <input type="hidden" name="classId" value={row.klass.id} />
                        <input type="hidden" name="termId" value={term.id} />
                        <input type="hidden" name="intent" value={intent} />
                        <button className="rounded border border-line px-2 py-1 text-xs">{label}</button>
                      </form>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
