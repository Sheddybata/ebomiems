import Link from "next/link";
import { PageTitle, Stat } from "@/components/ui";
import { termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { bursarOverview } from "@/lib/repo";

export default async function BursarPage() {
  const data = (await bursarOverview());
  const methods = Object.fromEntries(data.byMethod.map((row) => [row.method, row.value]));
  return (
    <div>
      <PageTitle title="Bursary" lede={`${termTitle(data.term.name, data.term.session_name)}. Expected is what was already owed on resumption, plus bills raised this term. Collected is money posted since ${data.term.starts_on}. Outstanding is the live ledger: charges minus payments, including arrears.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Expected" value={formatNaira(data.expected)} hint={`Brought forward ${formatNaira(data.opening)} · billed ${formatNaira(data.billed)}`} />
        <Stat label="Collected" value={formatNaira(data.collected)} hint={`${(data.rate * 100).toFixed(1)}% of expected`} />
        <Stat label="Outstanding" value={formatNaira(data.outstanding)} />
        <Stat label="Proofs waiting" value={String(data.pending)} hint="Not on the ledger yet" />
      </div>
      <div className="mt-4 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full bg-leaf" style={{ width: `${Math.min(100, Math.round(data.rate * 100))}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">Cash {formatNaira(methods.cash || 0)} · POS {formatNaira(methods.pos || 0)} · Transfer {formatNaira(methods.transfer || 0)}</p>
      <div className="mt-6 overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-3 py-2">Class</th><th>Families</th><th>Outstanding</th></tr>
          </thead>
          <tbody>
            {data.byClass.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <td className="px-3 py-2">{row.label}</td>
                <td>{row.families}</td>
                <td className="tabular-nums">{formatNaira(row.kobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm"><Link className="font-semibold text-moss" href="/bursar/proofs">Clear transfer proofs</Link></p>
    </div>
  );
}
