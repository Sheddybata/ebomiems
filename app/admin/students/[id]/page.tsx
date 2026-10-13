import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { resetParentPassword, resetPin, savePrincipalRemark, updateStudent } from "@/lib/actions";
import { takeFlash } from "@/lib/flash";
import { classLabel, formatDay, formatPhone, formatWhen, isRecentAdmission, personName, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { classForTerm, gateTerm, getPupil, ledgerRows, listClasses, listTerms, studentInvoices } from "@/lib/repo";

export default async function StudentFilePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; ok?: string; term?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const pupil = getPupil(Number(id));
  if (!pupil) notFound();
  const flash = await takeFlash();
  const classes = listClasses();
  const terms = listTerms();
  const termId = Number(query.term || terms.find((term) => term.is_current)?.id);
  const ledger = ledgerRows(pupil.id);
  const invoices = studentInvoices(pupil.id);
  return (
    <div>
      <PageTitle title={personName(pupil)} lede={`${pupil.admission_no} · ${classLabel(pupil.class_name, pupil.class_arm)} · ${pupil.gender}`}>
        {isRecentAdmission(pupil.admitted_on) ? <Badge>New</Badge> : null}
      </PageTitle>
      <Banner error={query.error} ok={query.ok} />
      {flash ? (
        <div className="mb-4 rounded-md bg-gold-soft px-4 py-3 text-sm text-moss">
          <p className="font-semibold">{flash.title}</p>
          <p className="mt-1">{flash.body}</p>
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-lg border border-line bg-card p-4 text-sm leading-6">
          <p>Admitted {formatDay(pupil.admitted_on)}{pupil.dob ? ` · born ${formatDay(pupil.dob)}` : ""}</p>
          <p>Parent {pupil.parent_name}</p>
          <p>{formatPhone(pupil.parent_phone)}{pupil.parent_email ? ` · ${pupil.parent_email}` : ""}</p>
          <p className="mt-2 font-serif text-2xl tabular-nums">{formatNaira(pupil.balance_kobo)}</p>
          <p className="text-muted">{pupil.balance_kobo > 0 ? "Outstanding on the ledger" : pupil.balance_kobo < 0 ? "Advance on the account" : "Account clear"}</p>
          <p className="mt-3">Result PIN <span className="font-mono text-base font-semibold">{pupil.pin}</span></p>
          {pupil.previous_school ? <p className="mt-2">Previous school {pupil.previous_school}{pupil.previous_class ? `, left ${pupil.previous_class}` : ""}{pupil.previous_position ? `, position ${pupil.previous_position}` : ""}{pupil.leaving_reason ? `. ${pupil.leaving_reason}` : ""}</p> : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/admin/students/${pupil.id}/letter`} className="rounded-md border border-line px-3 py-2 text-sm font-semibold">Admission letter</Link>
            <form action={resetPin}><input type="hidden" name="studentId" value={pupil.id} /><button className="rounded-md border border-line px-3 py-2 text-sm font-semibold">Reset PIN</button></form>
            <form action={resetParentPassword}><input type="hidden" name="studentId" value={pupil.id} /><button className="rounded-md border border-line px-3 py-2 text-sm font-semibold">Reset parent password</button></form>
            <Link href={`/bursar/collect?student=${pupil.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Take payment</Link>
          </div>
        </section>
        <form action={updateStudent} className="rounded-lg border border-line bg-card p-4">
          <input type="hidden" name="studentId" value={pupil.id} />
          <label className={labelClass}>Class</label>
          <select name="classId" defaultValue={pupil.class_id} className={inputClass}>
            {classes.map((klass) => <option key={klass.id} value={klass.id}>{classLabel(klass.name, klass.arm)}</option>)}
          </select>
          <label className={`mt-3 ${labelClass}`}>Status</label>
          <select name="status" defaultValue={pupil.status} className={inputClass}>
            <option value="active">Active</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <p className="mt-2 text-xs text-muted">Moving class keeps the admission number. This term’s scores follow the child. Older results stay with the class they were earned in.</p>
          <button className="mt-3 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save file</button>
        </form>
      </div>
      <section className="mt-4 rounded-lg border border-line bg-card p-4">
        <h2 className="font-serif text-xl text-moss">Principal remark</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {terms.map((term) => (
            <Link key={term.id} href={`/admin/students/${pupil.id}?term=${term.id}`} className={`rounded-full px-3 py-1 ${term.id === termId ? "bg-moss text-white" : "bg-paper ring-1 ring-line"}`}>
              {term.name}
            </Link>
          ))}
        </div>
        <form action={savePrincipalRemark} className="mt-3">
          <input type="hidden" name="studentId" value={pupil.id} />
          <input type="hidden" name="termId" value={termId} />
          <RemarkBox studentId={pupil.id} termId={termId} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save remark</button>
            {classForTerm(pupil.id, termId) ? <Link className="text-sm font-semibold text-moss" href={`/admin/students/${pupil.id}/report/${termId}`}>Open sheet · {gateTerm(pupil.id, termId)}</Link> : <span className="text-sm text-muted">No result for this term yet.</span>}
          </div>
        </form>
      </section>
      <section className="mt-4 overflow-x-auto rounded-lg border border-line bg-card">
        <h2 className="border-b border-line px-4 py-3 font-serif text-xl text-moss">Ledger</h2>
        <table className="w-full min-w-[640px] text-left text-sm">
          <tbody>
            {ledger.map((entry) => (
              <tr key={entry.id} className="border-t border-line">
                <td className="px-3 py-2">{formatWhen(entry.created_at)}</td>
                <td>{entry.narration}</td>
                <td className="tabular-nums">{entry.direction === "debit" ? formatNaira(entry.amount_kobo) : ""}</td>
                <td className="tabular-nums text-leaf">{entry.direction === "credit" ? formatNaira(entry.amount_kobo) : ""}</td>
                <td>{entry.receipt_no ? <Link className="font-semibold text-moss" href={`/receipts/${entry.id}`}>{entry.receipt_no}</Link> : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <ul className="border-t border-line px-4 py-3 text-sm">
          {invoices.map((invoice) => (
            <li key={invoice.id}><Link className="font-semibold text-moss" href={`/bursar/invoices/${invoice.id}`}>{invoice.number}</Link> · {termTitle(invoice.term_name, invoice.session_name)} · brought forward {formatNaira(invoice.arrears_kobo)}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

async function RemarkBox({ studentId, termId }: { studentId: number; termId: number }) {
  const { one } = await import("@/lib/db");
  const row = one<{ principal_remark: string }>("SELECT principal_remark FROM remarks WHERE student_id=? AND term_id=?", studentId, termId);
  return <textarea name="remark" defaultValue={row?.principal_remark || ""} rows={3} className={`${inputClass} mt-2`} placeholder="Principal's remark for this term" />;
}
