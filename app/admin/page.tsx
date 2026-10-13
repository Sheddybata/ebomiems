import Link from "next/link";
import { Badge, PageTitle, Panel, Stat } from "@/components/ui";
import { classLabel, isRecentAdmission, personName, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { bursarOverview, commandCentre, countNewEnquiries } from "@/lib/repo";

export default function CommandPage() {
  const data = commandCentre();
  const money = bursarOverview();
  const methods = Object.fromEntries(money.byMethod.map((row) => [row.method, row.value]));
  const waiting = countNewEnquiries();
  return (
    <div>
      <PageTitle title="Command centre" lede={`${termTitle(data.term.name, data.term.session_name)}. Expected is what was already owed on resumption, plus bills raised this term. Collected is money posted since ${money.term.starts_on}. Outstanding is the live ledger.`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Expected" value={formatNaira(money.expected)} hint={`Brought forward ${formatNaira(money.opening)} · billed ${formatNaira(money.billed)}`} />
        <Stat label="Collected" value={formatNaira(money.collected)} hint={`${(money.rate * 100).toFixed(1)}% of expected`} />
        <Stat label="Outstanding" value={formatNaira(money.outstanding)} />
        <Stat label="Proofs waiting" value={String(money.pending)} hint="Not on the ledger yet" />
      </div>
      <div className="mt-3 h-2 rounded-full bg-line">
        <div className="h-2 rounded-full bg-leaf" style={{ width: `${Math.min(100, Math.round(money.rate * 100))}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        Cash {formatNaira(methods.cash || 0)} · POS {formatNaira(methods.pos || 0)} · Transfer {formatNaira(methods.transfer || 0)}
        {" · "}
        <Link className="font-semibold text-moss" href="/bursar">Open bursary</Link>
      </p>
      {waiting > 0 ? (
        <p className="mt-4 text-sm">
          <Link className="font-semibold text-moss" href="/admin/enquiries">{waiting} new {waiting === 1 ? "request" : "requests"} at the front door</Link>
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Debtors" action={<Link className="text-sm font-semibold text-moss" href="/bursar/debtors">All</Link>}>
          <p className="font-serif text-2xl tabular-nums">{formatNaira(data.debtorTotal)}</p>
          <p className="text-sm text-muted">{data.debtorCount} accounts still open on the ledger.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {data.debtors.map((pupil) => (
              <li key={pupil.id} className="flex justify-between gap-3">
                <Link href={`/admin/students/${pupil.id}`} className="font-semibold text-moss">{personName(pupil)}</Link>
                <span className="tabular-nums">{formatNaira(pupil.balance_kobo)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Markbooks" action={<Link className="text-sm font-semibold text-moss" href="/admin/results">Results</Link>}>
          {data.openCa.length === 0 ? <p className="text-sm text-muted">Continuous assessment is complete in every class that has learners.</p> : null}
          <ul className="space-y-2 text-sm">
            {data.openCa.map((row) => (
              <li key={row.klass.id} className="flex items-center justify-between gap-2">
                <span>{classLabel(row.klass.name, row.klass.arm)}</span>
                <Badge tone="clay">{row.progress.caPct}% CA</Badge>
              </li>
            ))}
          </ul>
          {data.waitingExam.length > 0 ? <p className="mt-3 text-sm text-muted">{data.waitingExam.length} class{data.waitingExam.length === 1 ? "" : "es"} have assessment in, and examinations still open.</p> : null}
        </Panel>
        <Panel title="New this term">
          {data.admissions.length === 0 ? <p className="text-sm text-muted">No admissions since resumption.</p> : null}
          <ul className="space-y-2 text-sm">
            {data.admissions.map((pupil) => (
              <li key={pupil.id}>
                <Link href={`/admin/students/${pupil.id}`} className="font-semibold text-moss">{personName(pupil)}</Link>
                <span className="text-muted"> · {pupil.admission_no}</span>
                {isRecentAdmission(pupil.admitted_on) ? <Badge>New</Badge> : null}
                <p className="text-muted">{classLabel(pupil.class_name, pupil.class_arm)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <div className="mt-4">
        <Panel title="Recent receipts">
          <ul className="divide-y divide-line text-sm">
            {data.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{payment.first_name} {payment.last_name} · {payment.method}</span>
                <Link href={`/receipts/${payment.id}`} className="font-semibold text-moss">{payment.receipt_no} · {formatNaira(payment.amount_kobo)}</Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
