import { cookies } from "next/headers";
import { PublicFrame } from "@/components/public-frame";
import { ReportDocument } from "@/components/report-sheet";
import { PrintButton } from "@/components/widgets";
import { Banner, inputClass, labelClass } from "@/components/ui";
import { checkResult } from "@/lib/actions";
import { classLabel, resultMessage, termTitle } from "@/lib/format";
import { buildReport } from "@/lib/report";
import { findByAdmissionPin, gateTerm, getClass, listTerms } from "@/lib/repo";
import { CHECK_COOKIE } from "@/lib/session";

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ term?: string; error?: string }> }) {
  const query = await searchParams;
  const terms = (await listTerms()).slice().reverse();
  const jar = await cookies();
  let found: Awaited<ReturnType<typeof findByAdmissionPin>>;
  try {
    const saved = JSON.parse(jar.get(CHECK_COOKIE)?.value || "null") as { admission?: string; pin?: string } | null;
    found = saved?.admission && saved.pin ? (await findByAdmissionPin(saved.admission, saved.pin)) : undefined;
  } catch {
    found = undefined;
  }
  const termId = Number(query.term || terms[0]?.id || 0);
  const gate = found ? (await gateTerm(found.id, termId)) : null;
  const sheet = found && gate === "ready" ? (await buildReport(found.id, termId)) : null;
  const klass = found ? (await getClass(found.class_id)) : undefined;
  return (
    <PublicFrame paths={false}>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-serif text-4xl text-moss">Result checker</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Enter the admission number and the result PIN from the school. Unpublished results stay hidden. A published sheet can still be held when that term’s fees are open.</p>
        <form action={checkResult} className="no-print mt-6 grid gap-3 rounded-lg border border-line bg-card p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="block text-sm">
            <span className={labelClass}>Admission number</span>
            <input name="admission" defaultValue={found?.admission_no} placeholder="EBM/P3/015" className={inputClass} required />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>PIN</span>
            <input name="pin" inputMode="numeric" placeholder="132869" className={inputClass} required />
          </label>
          <label className="block text-sm">
            <span className={labelClass}>Term</span>
            <select name="termId" defaultValue={String(termId)} className={inputClass}>
              {terms.map((term) => (
                <option key={term.id} value={term.id}>{termTitle(term.name, term.session_name)}</option>
              ))}
            </select>
          </label>
          <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Check</button>
        </form>
        <Banner error={query.error} />
        {jarHasCheck(jar.get(CHECK_COOKIE)?.value) && !found ? <Banner error="Admission number and PIN do not match." /> : null}
        {found && klass ? (
          <section className="mt-6">
            <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-serif text-2xl">{found.first_name} {found.last_name}</p>
                <p className="text-sm text-muted">{found.admission_no} · now in {classLabel(klass.name, klass.arm)}</p>
              </div>
              {sheet ? <PrintButton label="Print report" /> : null}
            </div>
            <div className="no-print mb-4 flex flex-wrap gap-2 text-sm">
              {terms.map((term) => (
                <a key={term.id} href={`/results?term=${term.id}`} className={`rounded-full px-3 py-1 ${term.id === termId ? "bg-moss text-white" : "bg-card ring-1 ring-line"}`}>
                  {termTitle(term.name, term.session_name)}
                </a>
              ))}
            </div>
            {sheet ? <ReportDocument sheet={sheet} /> : <p className="rounded-lg border border-line bg-card p-4 text-sm leading-6">{resultMessage(gate === "held" || gate === "none" || gate === "unpublished" ? gate : "unpublished", "public")}</p>}
          </section>
        ) : null}
      </main>
    </PublicFrame>
  );
}

function jarHasCheck(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const saved = JSON.parse(value) as { admission?: string };
    return Boolean(saved.admission);
  } catch {
    return false;
  }
}
