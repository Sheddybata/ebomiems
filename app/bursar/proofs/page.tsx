import Link from "next/link";
import { Banner, PageTitle } from "@/components/ui";
import { approveProof, rejectProof } from "@/lib/actions";
import { classLabel, formatDay, formatPhone } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { listProofs } from "@/lib/repo";

export default async function ProofsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const pending = listProofs("pending");
  const decided = [...listProofs("approved").slice(0, 6), ...listProofs("rejected").slice(0, 6)];
  return (
    <div>
      <PageTitle title="Transfer proofs" lede="A proof is a request. Approving it posts a receipt on the ledger. Rejecting it leaves the balance unchanged." />
      <Banner error={query.error} ok={query.ok} />
      {pending.length === 0 ? <p className="text-sm text-muted">Nothing is waiting.</p> : null}
      <div className="space-y-4">
        {pending.map((proof) => (
          <article key={proof.id} className="rounded-lg border border-line bg-card p-4 text-sm">
            <p className="font-serif text-xl text-moss">{proof.first_name} {proof.last_name}</p>
            <p>{proof.admission_no} · {classLabel(proof.class_name, proof.class_arm)} · parent {formatPhone(proof.parent_phone)}</p>
            <p className="mt-1">Claims {formatNaira(proof.amount_kobo)} on {formatDay(proof.paid_on)} · {proof.bank_name || "Bank not stated"} · ref {proof.reference}</p>
            <p>Ledger balance now {formatNaira(proof.balance_kobo)}</p>
            {proof.note ? <p className="text-muted">{proof.note}</p> : null}
            {proof.file_path ? <p className="mt-1"><Link className="font-semibold text-moss" href={`/files/proofs/${proof.id}`}>Open the uploaded receipt</Link></p> : <p className="text-muted">No file was attached. Match the reference on the bank alert.</p>}
            <div className="mt-3 flex flex-wrap gap-4">
              <form action={approveProof} className="flex gap-2">
                <input type="hidden" name="proofId" value={proof.id} />
                <input name="amount" defaultValue={(proof.amount_kobo / 100).toFixed(2)} className="w-32 rounded-md border border-line px-2 py-1" />
                <button className="rounded-md bg-moss px-3 py-1 text-white">Approve</button>
              </form>
              <form action={rejectProof} className="flex gap-2">
                <input type="hidden" name="proofId" value={proof.id} />
                <input name="reason" placeholder="Why it was rejected" className="rounded-md border border-line px-2 py-1" required />
                <button className="rounded-md border border-clay px-3 py-1 text-clay">Reject</button>
              </form>
            </div>
          </article>
        ))}
      </div>
      {decided.length > 0 ? (
        <ul className="mt-6 space-y-1 text-sm text-muted">
          {decided.map((proof) => <li key={proof.id}>{proof.status}: {proof.first_name} {proof.last_name} · {formatNaira(proof.approved_kobo || proof.amount_kobo)} · {proof.reference}</li>)}
        </ul>
      ) : null}
    </div>
  );
}
