import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportDocument } from "@/components/report-sheet";
import { PrintButton } from "@/components/widgets";
import { requireUser } from "@/lib/auth";
import { resultMessage } from "@/lib/format";
import { buildReport } from "@/lib/report";
import { gateTerm, getPupil } from "@/lib/repo";

export default async function ParentReportPage({ params }: { params: Promise<{ id: string; termId: string }> }) {
  const user = await requireUser("parent");
  const { id, termId } = await params;
  const pupil = getPupil(Number(id));
  if (!pupil || pupil.parent_id !== user.id) notFound();
  const gate = gateTerm(pupil.id, Number(termId));
  if (gate !== "ready") {
    return (
      <div>
        <Link href={`/parent/children/${id}/results`} className="text-sm font-semibold text-moss">Back to results</Link>
        <p className="mt-4 max-w-xl text-sm leading-6">{resultMessage(gate, "parent")}</p>
      </div>
    );
  }
  const sheet = buildReport(pupil.id, Number(termId));
  if (!sheet) notFound();
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/parent/children/${id}/results`} className="text-sm font-semibold text-moss">Back to results</Link>
        <PrintButton label="Print report" />
      </div>
      <ReportDocument sheet={sheet} />
    </div>
  );
}
