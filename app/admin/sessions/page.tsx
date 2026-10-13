import { Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { addSession, addTerm, saveTermDates } from "@/lib/actions";
import { formatDay, termTitle } from "@/lib/format";
import { listSessions, listTerms } from "@/lib/repo";

const TERM_NAMES = ["First", "Second", "Third"] as const;

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const terms = listTerms();
  const sessions = listSessions();
  const missing = sessions
    .map((session) => {
      const held = terms.filter((term) => term.session_id === session.id).map((term) => term.name);
      return { session, names: TERM_NAMES.filter((name) => !held.includes(name)) };
    })
    .filter((row) => row.names.length > 0);
  return (
    <div>
      <PageTitle title="Sessions and terms" lede="Edit dates on any term already on the calendar, or add Second and Third to this session when the school sends them. The current term is the one whose end date has not passed. First Term 2026/2027 ends 18 December. Next term then begins 9 January 2027." />
      <Banner error={query.error} ok={query.ok} />
      <div className="space-y-3">
        {terms.map((term) => (
          <form key={term.id} action={saveTermDates} className="grid gap-2 rounded-lg border border-line bg-card p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-end">
            <input type="hidden" name="termId" value={term.id} />
            <p className="text-sm font-semibold">{termTitle(term.name, term.session_name)}{term.is_current ? " · current" : ""}</p>
            <label className="text-sm"><span className={labelClass}>Starts</span><input name="startsOn" type="date" defaultValue={term.starts_on} className={inputClass} required /></label>
            <label className="text-sm"><span className={labelClass}>Ends</span><input name="endsOn" type="date" defaultValue={term.ends_on} className={inputClass} required /></label>
            <label className="text-sm"><span className={labelClass}>Next begins</span><input name="nextBegins" type="date" defaultValue={term.next_begins_on ?? ""} className={inputClass} /></label>
            <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save dates</button>
            <p className="text-xs text-muted md:col-span-5">{formatDay(term.starts_on)} – {formatDay(term.ends_on)}{term.next_begins_on ? ` · next ${formatDay(term.next_begins_on)}` : ""}</p>
          </form>
        ))}
      </div>
      {missing.map(({ session, names }) => (
        <form key={session.id} action={addTerm} className="mt-6 grid max-w-xl gap-3 rounded-lg border border-line bg-card p-4">
          <h2 className="font-serif text-xl text-moss">Add a term to {session.name}</h2>
          <p className="text-sm text-muted">This session still needs {names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`}.</p>
          <input type="hidden" name="sessionId" value={session.id} />
          <label className="text-sm">
            <span className={labelClass}>Term</span>
            <select name="name" className={inputClass} required>
              {names.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label className="text-sm"><span className={labelClass}>Starts</span><input name="startsOn" type="date" className={inputClass} required /></label>
          <label className="text-sm"><span className={labelClass}>Ends</span><input name="endsOn" type="date" className={inputClass} required /></label>
          <label className="text-sm"><span className={labelClass}>Next begins</span><input name="nextBegins" type="date" className={inputClass} /></label>
          <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Add term</button>
        </form>
      ))}
      <form action={addSession} className="mt-6 grid max-w-xl gap-3 rounded-lg border border-line bg-card p-4">
        <h2 className="font-serif text-xl text-moss">Add a session</h2>
        <label className="text-sm"><span className={labelClass}>Session</span><input name="name" placeholder="2027/2028" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>First term starts</span><input name="firstStart" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>First term ends</span><input name="firstEnd" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Second term starts</span><input name="secondStart" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Second term ends</span><input name="secondEnd" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Third term starts</span><input name="thirdStart" type="date" className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Third term ends</span><input name="thirdEnd" type="date" className={inputClass} required /></label>
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save session</button>
      </form>
    </div>
  );
}
