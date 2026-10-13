import Link from "next/link";
import { PublicFrame } from "@/components/public-frame";
import { Slideshow } from "@/components/slideshow";
import { formatDay, termTitle } from "@/lib/format";
import { currentTerm, getSettings } from "@/lib/repo";
import { DIVISIONS } from "@/lib/site";

export default async function HomePage() {
  const settings = (await getSettings());
  const term = (await currentTerm());
  return (
    <PublicFrame>
      <section className="bg-moss text-paper">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-28 pt-12 md:grid-cols-2 md:pt-16">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold-soft">Jos, Plateau State · Creche to SSS</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">{settings.school_name}</h1>
            <p className="mt-6 font-serif text-3xl text-gold-soft">{settings.motto}</p>
            <p className="mt-4 max-w-xl text-lg leading-8 text-paper/80">One school on Kashim Ibrahim Street. Children begin in the creche and can stay through Senior Secondary, in Science, Arts or Commercial.</p>
          </div>
          <Slideshow />
        </div>
      </section>
      <section className="mx-auto -mt-16 grid max-w-6xl gap-4 px-4 md:grid-cols-2">
        <article className="rounded-lg border border-line bg-card p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Considering EBOMI</p>
          <h2 className="mt-2 font-serif text-3xl text-moss">Come and see the school</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Ask a question, book a tour, or send an admission request. A request does not reserve a place. The parent login opens only after the school enrols the child.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/apply" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Apply</Link>
            <Link href="/inquire" className="rounded-md border border-line px-4 py-2 text-sm font-semibold">Inquire</Link>
            <Link href="/visit" className="rounded-md border border-line px-4 py-2 text-sm font-semibold">Book a tour</Link>
          </div>
        </article>
        <article className="rounded-lg border border-line bg-moss-deep p-6 text-paper">
          <p className="text-xs uppercase tracking-[0.18em] text-gold-soft">Already with us</p>
          <h2 className="mt-2 font-serif text-3xl">Parents and staff</h2>
          <p className="mt-2 text-sm leading-6 text-paper/75">Learners do not sign in. A parent sees every ward. Teachers, the bursar and admin each open their own desk. Results can also be checked with an admission number and a PIN.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-md bg-gold-soft px-4 py-2 text-sm font-semibold text-moss">Sign in</Link>
            <Link href="/results" className="rounded-md border border-white/30 px-4 py-2 text-sm font-semibold">Check a result</Link>
          </div>
        </article>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="font-serif text-3xl text-moss">Five stages, one school</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DIVISIONS.map((division) => (
            <Link key={division.id} href={`/classes#${division.id}`} className="rounded-lg border border-line bg-card p-4 hover:border-moss">
              <p className="font-serif text-xl text-moss">{division.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted">{division.line}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="font-serif text-3xl text-moss">What the children learn</h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">Creche and Nursery are qualitative. Primary is graded A to F, with continuous assessment out of 40 and the examination out of 60. Junior and Senior Secondary use the WAEC scale, A1 to F9, with assessment out of 30 and the examination out of 70.</p>
            <Link href="/curriculum" className="mt-4 inline-block text-sm font-semibold text-moss">Read the curriculum</Link>
          </div>
          <div className="text-sm leading-7">
            <p className="text-xs uppercase tracking-wide text-gold">This term</p>
            <p className="mt-1 font-serif text-2xl text-moss">{termTitle(term.name, term.session_name)}</p>
            <p className="mt-2 text-muted">Resumed {formatDay(term.starts_on)}</p>
            <p className="text-muted">Closes {formatDay(term.ends_on)}</p>
            <p className="text-muted">Next term begins {formatDay(term.next_begins_on)}</p>
            <p className="mt-4">Principal {settings.principal_name}</p>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl text-moss">The grounds</h2>
          <p className="mt-3 text-sm leading-7 text-muted">{settings.address}. Early years include feeding. Junior and Senior Secondary include laboratory work. The photographs here are of the compound and school days. The sure way to see the rooms is still to visit.</p>
          <Link href="/environment" className="mt-4 inline-block text-sm font-semibold text-moss">The environment</Link>
        </div>
        <div className="rounded-lg bg-moss px-6 py-8 text-paper">
          <h2 className="font-serif text-3xl">Teach at EBOMI</h2>
          <p className="mt-3 text-sm leading-7 text-paper/80">A teaching application is read by the school. It does not open a staff login.</p>
          <Link href="/teach" className="mt-4 inline-block rounded-md bg-gold-soft px-4 py-2 text-sm font-semibold text-moss">Apply to teach</Link>
        </div>
      </section>
    </PublicFrame>
  );
}
