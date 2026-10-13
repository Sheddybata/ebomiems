import Link from "next/link";
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui";
import { PrintButton } from "@/components/widgets";
import { addCharge } from "@/lib/actions";
import { formatWhen, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { getInvoice, getSettings } from "@/lib/repo";

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = getInvoice(Number(id));
  if (!data?.pupil) notFound();
  const settings = getSettings();
  const due = data.invoice.arrears_kobo + data.invoice.lines_kobo;
  return (
    <div>
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href="/bursar/invoices" className="text-sm font-semibold text-moss">All invoices</Link>
        <PrintButton label="Print bill" />
      </div>
      <Banner error={query.error} ok={query.ok} />
      <article className="sheet">
        <header className="text-center">
          <p className="font-serif text-2xl text-moss">{settings.school_name}</p>
          <p className="text-sm">{settings.address}</p>
          <h1 className="mt-2 font-serif text-lg">Fee bill {data.invoice.number}</h1>
          <p className="text-sm">{termTitle(data.invoice.term_name, data.invoice.session_name)}</p>
        </header>
        <p className="mt-4 text-sm">{data.pupil.first_name} {data.pupil.last_name} · {data.pupil.admission_no} · {data.invoice.class_name} {data.invoice.class_arm}</p>
        <table className="marks mt-3">
          <tbody>
            <tr><td>Arrears brought forward</td><td className="text-right">{formatNaira(data.invoice.arrears_kobo)}</td></tr>
            {data.lines.map((line) => <tr key={line.id}><td>{line.label}</td><td className="text-right">{formatNaira(line.amount_kobo)}</td></tr>)}
            <tr><td className="font-semibold">Amount due at issue</td><td className="text-right font-semibold">{formatNaira(due)}</td></tr>
          </tbody>
        </table>
        <p className="mt-3 text-sm">Live account balance {formatNaira(data.pupil.balance_kobo)}. Pay into {settings.bank_name}, {settings.account_name}, {settings.account_number}. Narration: {data.pupil.admission_no}.</p>
        <h2 className="mt-4 font-semibold">Account movement</h2>
        <ul className="mt-1 text-sm">
          {data.ledger.map((entry) => (
            <li key={entry.id}>{formatWhen(entry.created_at)} · {entry.narration} · {entry.direction === "debit" ? "charge" : "payment"} {formatNaira(entry.amount_kobo)} {entry.receipt_no ? <Link className="no-print text-moss" href={`/receipts/${entry.id}`}>{entry.receipt_no}</Link> : null}</li>
          ))}
        </ul>
      </article>
      <form action={addCharge} className="no-print mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="invoiceId" value={data.invoice.id} />
        <input type="hidden" name="studentId" value={data.pupil.id} />
        <input name="label" placeholder="Extra charge, e.g. excursion" className="rounded-md border border-line px-3 py-2 text-sm" />
        <input name="amount" placeholder="Naira" className="w-32 rounded-md border border-line px-3 py-2 text-sm" />
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Add charge</button>
      </form>
    </div>
  );
}
