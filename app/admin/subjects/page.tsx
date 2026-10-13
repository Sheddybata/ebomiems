import { Banner, PageTitle, inputClass } from "@/components/ui";
import { addSubject, removeSubject, saveSubject } from "@/lib/actions";
import { SUBJECT_TRACKS, TRACK_LABELS } from "@/lib/format";
import { listSubjects } from "@/lib/repo";

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const subjects = listSubjects();
  return (
    <div>
      <PageTitle title="Subjects" lede="These names appear on the public curriculum, teacher markbooks and report sheets. Change Primary here when the school sends the real list. Removing a subject deletes marks already entered for it." />
      <Banner error={query.error} ok={query.ok} />
      {SUBJECT_TRACKS.map((track) => (
        <section key={track} className="mb-4 rounded-lg border border-line bg-card p-4">
          <h2 className="font-serif text-xl text-moss">{TRACK_LABELS[track]}</h2>
          <div className="mt-3 space-y-2">
            {subjects.filter((subject) => subject.track === track).map((subject) => (
              <div key={subject.id} className="grid gap-2 border-t border-line py-2 md:grid-cols-[1fr_120px_88px_auto_auto] md:items-center">
                <form action={saveSubject} className="grid gap-2 md:col-span-4 md:grid-cols-[1fr_120px_88px_auto] md:items-center">
                  <input type="hidden" name="id" value={subject.id} />
                  <input name="name" defaultValue={subject.name} className={inputClass} required />
                  <input name="shortName" defaultValue={subject.short_name} className={inputClass} required />
                  <input name="sortOrder" type="number" defaultValue={subject.sort_order} className={inputClass} required />
                  <button className="text-sm font-semibold text-moss">Save</button>
                </form>
                <form action={removeSubject}>
                  <input type="hidden" name="id" value={subject.id} />
                  <button className="text-sm font-semibold text-clay">Remove</button>
                </form>
              </div>
            ))}
          </div>
        </section>
      ))}
      <form action={addSubject} className="grid max-w-3xl gap-2 rounded-lg border border-line bg-card p-4 md:grid-cols-4">
        <select name="track" className={inputClass} defaultValue="primary">
          {SUBJECT_TRACKS.map((track) => <option key={track} value={track}>{TRACK_LABELS[track]}</option>)}
        </select>
        <input name="name" placeholder="Subject name" className={inputClass} required />
        <input name="shortName" placeholder="Code, e.g. ENG" className={inputClass} required />
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Add subject</button>
      </form>
    </div>
  );
}
