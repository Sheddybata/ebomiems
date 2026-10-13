import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportDocument } from "@/components/report-sheet";
import { PrintButton } from "@/components/widgets";
import { buildReport } from "@/lib/report";
import { gateTerm, releaseOf } from "@/lib/repo";

export default async function StaffReportPage({ params }: { params: Promise<{ id: string; termId: string }> }) {
  const { id, termId } = await params;
  const sheet = (await buildReport(Number(id), Number(termId)));
  if (!sheet) notFound();
  const gate = (await gateTerm(Number(id), Number(termId)));
  const release = (await releaseOf(sheet.classId, Number(termId)));
  const banner = release.status !== "published"
    ? "Working copy — not published"
    : gate === "held"
      ? "Held from the parent — this term’s fees are still open"
      : undefined;
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/admin/students/${id}`} className="text-sm font-semibold text-moss">Back to file</Link>
        <PrintButton label="Print" />
      </div>
      <ReportDocument sheet={sheet} banner={banner} />
    </div>
  );
}
