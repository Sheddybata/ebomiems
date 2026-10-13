import { Banner, PageTitle, inputClass } from "@/components/ui";
import { recordPayment } from "@/lib/actions";
import { classLabel, personName } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { getPupil, searchPupils } from "@/lib/repo";

export default async function CollectPage({ searchParams }: { searchParams: Promise<{ q?: string; student?: string; error?: string; ok?: string }> }) {
  const query = await searchParams;
  const selected = query.student ? (await getPupil(Number(query.student))) : undefined;
  const matches = query.q ? (await searchPupils(query.q)).slice(0, 12) : [];
  return (
    <div>
      <PageTitle title="Collect at the desk" lede="Cash and POS are receipted immediately. Use confirmed transfer only when you have already seen the credit. An upload from a parent still waits on the proof queue." />
      <Banner error={query.error} ok={query.ok} />
      <form className="mb-4 flex max-w-lg gap-2">
        <input name="q" defaultValue={query.q} placeholder="Name or admission number" className={inputClass} />
        <button className="rounded-md border border-line bg-card px-3 text-sm font-semibold">Find</button>
      </form>
      <ul className="mb-4 text-sm">
        {matches.map((pupil) => (
          <li key={pupil.id}><a className="font-semibold text-moss" href={`/bursar/collect?student=${pupil.id}`}>{personName(pupil)}</a> · {pupil.admission_no} · {formatNaira(pupil.balance_kobo)}</li>
        ))}
      </ul>
      {selected ? (
        <form action={recordPayment} className="max-w-lg rounded-lg border border-line bg-card p-4">
          <input type="hidden" name="studentId" value={selected.id} />
          <p className="font-serif text-2xl">{personName(selected)}</p>
          <p className="text-sm text-muted">{selected.admission_no} · {classLabel(selected.class_name, selected.class_arm)}</p>
          <p className="mt-2 text-sm">Balance {formatNaira(selected.balance_kobo)}</p>
          <label className="mt-3 block text-sm font-semibold">Amount in naira</label>
          <input name="amount" className={`${inputClass} mt-1`} required />
          <label className="mt-3 block text-sm font-semibold">Method</label>
          <select name="method" className={`${inputClass} mt-1`}>
            <option value="cash">Cash</option>
            <option value="pos">POS</option>
            <option value="transfer">Confirmed transfer</option>
          </select>
          <button className="mt-4 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Issue receipt</button>
        </form>
      ) : null}
    </div>
  );
}
