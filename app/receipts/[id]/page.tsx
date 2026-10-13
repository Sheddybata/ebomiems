import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/widgets";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { formatNaira, nairaWords } from "@/lib/money";
import { getReceipt } from "@/lib/repo";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const receipt = getReceipt(Number(id));
  if (!receipt) notFound();
  const allowed = user.role === "admin" || user.role === "bursar" || (user.role === "parent" && receipt.pupil.parent_id === user.id);
  if (!allowed) notFound();
  const back = user.role === "parent" ? `/parent/children/${receipt.pupil.id}/fees` : "/bursar";
  return (
    <Shell user={user}>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={back} className="text-sm font-semibold text-moss">Back</Link>
        <PrintButton label="Print receipt" />
      </div>
      <article className="sheet mx-auto max-w-xl">
        <header className="text-center">
          <p className="font-serif text-2xl text-moss">{receipt.settings.school_name}</p>
          <p className="text-sm">{receipt.settings.address}</p>
          <h1 className="mt-2 font-serif text-lg">Official receipt</h1>
          <p>{receipt.entry.receipt_no}</p>
        </header>
        <dl className="mt-4 space-y-1 text-sm">
          <Row label="Date" value={formatWhen(receipt.entry.created_at)} />
          <Row label="Received from" value={receipt.pupil.parent_name} />
          <Row label="For" value={`${receipt.pupil.first_name} ${receipt.pupil.last_name} · ${receipt.pupil.admission_no}`} />
          <Row label="Being" value={receipt.entry.narration} />
          <Row label="Method" value={receipt.entry.method ? receipt.entry.method[0].toUpperCase() + receipt.entry.method.slice(1) : "—"} />
          <Row label="Amount" value={formatNaira(receipt.entry.amount_kobo)} />
          <Row label="In words" value={nairaWords(receipt.entry.amount_kobo)} />
          <Row label="Balance after" value={formatNaira(receipt.balanceAfter)} />
        </dl>
        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div><div className="h-8 border-b border-ink/40" /><p className="mt-1 text-xs">Bursar</p></div>
          <div><div className="h-8 border-b border-ink/40" /><p className="mt-1 text-xs">Parent</p></div>
        </div>
      </article>
    </Shell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 border-b border-line py-1"><dt className="text-muted">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>;
}
