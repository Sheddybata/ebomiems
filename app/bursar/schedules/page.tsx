import { Banner, PageTitle, inputClass } from "@/components/ui";
import { addFeeItem, removeFeeItem, saveFeeItem } from "@/lib/actions";
import { TRACK_LABELS } from "@/lib/format";
import { feeItems } from "@/lib/repo";

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const items = (await feeItems());
  const tracks = ["creche", "nursery", "primary", "jss", "sss"];
  return (
    <div>
      <PageTitle title="Fee schedules" lede="Add, edit or remove a charge for each level. Amounts are what the next bill will use. A bill already posted to the ledger does not change when you edit the schedule." />
      <Banner error={query.error} ok={query.ok} />
      {tracks.map((track) => (
        <section key={track} className="mb-4 rounded-lg border border-line bg-card p-4">
          <h2 className="font-serif text-xl text-moss">{TRACK_LABELS[track]}</h2>
          <div className="mt-3 space-y-2">
            {items.filter((item) => item.track === track).map((item) => (
              <div key={item.id} className="grid gap-2 border-t border-line py-2 md:grid-cols-[1fr_160px_auto_auto_auto] md:items-center">
                <form action={saveFeeItem} className="grid gap-2 md:col-span-4 md:grid-cols-[1fr_160px_auto_auto] md:items-center">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="label" defaultValue={item.label} className={inputClass} />
                  <input name="amount" defaultValue={(item.amount_kobo / 100).toFixed(2)} className={inputClass} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={item.active === 1} /> Active</label>
                  <button className="text-sm font-semibold text-moss">Save</button>
                </form>
                <form action={removeFeeItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button className="text-sm font-semibold text-clay">Remove</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
      <form action={addFeeItem} className="grid max-w-3xl gap-2 rounded-lg border border-line bg-card p-4 md:grid-cols-4">
        <select name="track" className={inputClass}>{tracks.map((track) => <option key={track} value={track}>{TRACK_LABELS[track]}</option>)}</select>
        <input name="label" placeholder="Fee name" className={inputClass} required />
        <input name="amount" placeholder="Amount in naira" className={inputClass} required />
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Add fee</button>
      </form>
    </div>
  );
}
