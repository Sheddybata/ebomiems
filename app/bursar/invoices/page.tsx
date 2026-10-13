import Link from "next/link";
import { Banner, PageTitle, inputClass } from "@/components/ui";
import { issueClassInvoices } from "@/lib/actions";
import { classLabel, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { listClasses, listInvoices } from "@/lib/repo";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; ok?: string }> }) {
  const query = await searchParams;
  const invoices = listInvoices(query.q || "");
  const classes = listClasses().filter((klass) => klass.pupils > 0);
  return (
    <div>
      <PageTitle title="Invoices" lede="Issuing a class bill posts each active learner who does not already have one. Arrears are shown on the bill and stay on the ledger; they are not charged twice." />
      <Banner error={query.error} ok={query.ok} />
      <div className="mb-4 flex flex-wrap gap-3">
        <form className="flex gap-2">
          <input name="q" defaultValue={query.q} placeholder="Name, admission no. or invoice" className={inputClass} />
          <button className="rounded-md border border-line bg-card px-3 text-sm font-semibold">Search</button>
        </form>
        <form action={issueClassInvoices} className="flex gap-2">
          <select name="classId" className={inputClass}>{classes.map((klass) => <option key={klass.id} value={klass.id}>{classLabel(klass.name, klass.arm)}</option>)}</select>
          <button className="rounded-md bg-moss px-3 text-sm font-semibold text-white">Issue bills</button>
        </form>
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-3 py-2">Invoice</th><th>Learner</th><th>Term</th><th>This term</th><th>Brought forward</th></tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-line">
                <td className="px-3 py-2"><Link className="font-semibold text-moss" href={`/bursar/invoices/${invoice.id}`}>{invoice.number}</Link></td>
                <td>{invoice.first_name} {invoice.last_name}<br /><span className="text-muted">{invoice.admission_no} · {classLabel(invoice.class_name, invoice.class_arm)}</span></td>
                <td>{termTitle(invoice.term_name, invoice.session_name)}</td>
                <td className="tabular-nums">{formatNaira(invoice.lines_kobo)}</td>
                <td className="tabular-nums">{formatNaira(invoice.arrears_kobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
