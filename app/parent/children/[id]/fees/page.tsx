import Link from "next/link";
import { notFound } from "next/navigation";
import { Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { CopyButton } from "@/components/widgets";
import { submitProof } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatDay, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { getPupil, getSettings, ledgerRows, studentInvoices, studentProofs } from "@/lib/repo";

export default async function FeesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser("parent");
  const { id } = await params;
  const query = await searchParams;
  const pupil = (await getPupil(Number(id)));
  if (!pupil || pupil.parent_id !== user.id) notFound();
  const settings = (await getSettings());
  const invoices = (await studentInvoices(pupil.id));
  const proofs = (await studentProofs(pupil.id));
  const receipts = (await ledgerRows(pupil.id)).filter((entry) => entry.direction === "credit");
  return (
    <div>
      <PageTitle title={`${pupil.first_name}'s fees`} lede="The balance is the ledger, not a figure someone typed. A transfer you upload stays a request until the bursar approves it." />
      <Banner error={query.error} ok={query.ok} />
      <p className="font-serif text-4xl tabular-nums">{formatNaira(pupil.balance_kobo)}</p>
      <p className="text-sm text-muted">{pupil.balance_kobo > 0 ? "Outstanding" : "Nothing outstanding"}</p>
      <section className="mt-4 rounded-lg border border-line bg-card p-4 text-sm">
        <h2 className="font-serif text-xl text-moss">Pay the school</h2>
        <div className="mt-2 space-y-1">
          <Line label="Bank" value={settings.bank_name} />
          <Line label="Account name" value={settings.account_name} />
          <Line label="Account number" value={settings.account_number} />
          <Line label="Narration" value={pupil.admission_no} />
        </div>
      </section>
      <section className="mt-4 space-y-3">
        {invoices.map((invoice) => (
          <article key={invoice.id} className="rounded-lg border border-line bg-card p-4 text-sm">
            <p className="font-semibold">{invoice.number} · {termTitle(invoice.term_name, invoice.session_name)}</p>
            <p>This term {formatNaira(invoice.lines_kobo)} · arrears brought forward {formatNaira(invoice.arrears_kobo)}</p>
          </article>
        ))}
      </section>
      <form action={submitProof} className="mt-4 grid max-w-xl gap-3 rounded-lg border border-line bg-card p-4">
        <h2 className="font-serif text-xl text-moss">Upload proof of payment</h2>
        <input type="hidden" name="studentId" value={pupil.id} />
        <label className="text-sm"><span className={labelClass}>Amount in naira</span><input name="amount" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Bank you paid from</span><input name="bankName" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Transfer reference</span><input name="reference" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Date paid</span><input name="paidOn" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Note</span><input name="note" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Receipt image or PDF</span><input name="file" type="file" accept="image/*,.pdf" className="text-sm" /></label>
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Send to the bursar</button>
      </form>
      <ul className="mt-4 space-y-2 text-sm">
        {proofs.map((proof) => (
          <li key={proof.id} className="rounded-lg border border-line bg-card px-3 py-2">
            {proof.status} · {formatNaira(proof.approved_kobo || proof.amount_kobo)} · {proof.reference} · {formatDay(proof.paid_on)}
            {proof.rejection_reason ? ` · ${proof.rejection_reason}` : ""}
            {proof.file_path ? <Link className="ml-2 font-semibold text-moss" href={`/files/proofs/${proof.id}`}>File</Link> : null}
          </li>
        ))}
      </ul>
      <h2 className="mt-6 font-serif text-xl text-moss">Receipts</h2>
      <ul className="mt-2 text-sm">
        {receipts.map((entry) => <li key={entry.id}><Link className="font-semibold text-moss" href={`/receipts/${entry.id}`}>{entry.receipt_no}</Link> · {formatNaira(entry.amount_kobo)} · {entry.narration}</li>)}
      </ul>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-3 border-b border-line py-1">
      <span className="text-muted">{label}</span>
      <span className="flex items-center gap-2 font-semibold">{value} <CopyButton text={value} /></span>
    </p>
  );
}
