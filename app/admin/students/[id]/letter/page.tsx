import Link from "next/link";
import { notFound } from "next/navigation";
import { AdmissionLetter } from "@/components/admission-letter";
import { PrintButton } from "@/components/widgets";
import { classLabel } from "@/lib/format";
import { getPupil, getSettings } from "@/lib/repo";

export default async function AdminLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pupil = getPupil(Number(id));
  if (!pupil) notFound();
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/admin/students/${pupil.id}`} className="text-sm font-semibold text-moss">Back to file</Link>
        <PrintButton label="Print letter" />
      </div>
      <AdmissionLetter pupil={pupil} settings={getSettings()} className={classLabel(pupil.class_name, pupil.class_arm)} />
    </div>
  );
}
