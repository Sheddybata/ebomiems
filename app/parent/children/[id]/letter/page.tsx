import Link from "next/link";
import { notFound } from "next/navigation";
import { AdmissionLetter } from "@/components/admission-letter";
import { PrintButton } from "@/components/widgets";
import { requireUser } from "@/lib/auth";
import { classLabel } from "@/lib/format";
import { getPupil, getSettings } from "@/lib/repo";

export default async function ParentLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("parent");
  const { id } = await params;
  const pupil = getPupil(Number(id));
  if (!pupil || pupil.parent_id !== user.id) notFound();
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/parent" className="text-sm font-semibold text-moss">Back to family</Link>
        <PrintButton label="Print letter" />
      </div>
      <AdmissionLetter pupil={pupil} settings={getSettings()} className={classLabel(pupil.class_name, pupil.class_arm)} />
    </div>
  );
}
