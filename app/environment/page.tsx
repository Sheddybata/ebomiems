import Link from "next/link";
import { DoorPage } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { Slideshow } from "@/components/slideshow";
import { getSettings } from "@/lib/repo";

export default function EnvironmentPage() {
  const settings = getSettings();
  return (
    <PublicFrame>
      <DoorPage kicker="Environment" title="A school you can walk through" lede={`${settings.address}. The rooms follow the child: care at the start, classrooms through Primary, and laboratory work in Junior and Senior Secondary.`}>
        <Slideshow className="mb-10" />
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-serif text-2xl text-moss">Early years</h2>
            <p className="mt-2 text-sm leading-7 text-muted">Creche and Nursery include feeding. The day is habits, play, phonics and number, in rooms sized for small children.</p>
          </article>
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-serif text-2xl text-moss">Primary</h2>
            <p className="mt-2 text-sm leading-7 text-muted">Primary 1 to Primary 6. English, Mathematics, Basic Science, creative arts and physical education share the same compound.</p>
          </article>
          <article className="rounded-lg border border-line bg-card p-5">
            <h2 className="font-serif text-2xl text-moss">Secondary</h2>
            <p className="mt-2 text-sm leading-7 text-muted">JSS and SSS include a laboratory levy, because science is taught as practical work as well as a paper. SSS divides into Science, Arts and Commercial.</p>
          </article>
        </div>
        <p className="mt-8 max-w-2xl text-sm leading-7 text-muted">These photographs are of the compound and of school days: assembly, Nursery and Primary classes, and a civic day. Classroom interiors can still be judged best by walking the grounds.</p>
        <Link href="/visit" className="mt-4 inline-block rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Book a tour</Link>
      </DoorPage>
    </PublicFrame>
  );
}
