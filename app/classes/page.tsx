import { DoorPage } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { classLabel } from "@/lib/format";
import { listClasses } from "@/lib/repo";
import { DIVISIONS } from "@/lib/site";

export default async function ClassesPage() {
  const classes = (await listClasses());
  return (
    <PublicFrame>
      <DoorPage kicker="Classes" title="From Creche to SSS 3" lede="These are the classes on the school register. The admissions office confirms the right class from the child’s date of birth. An application does not place a child.">
        <div className="space-y-10">
          {DIVISIONS.map((division) => {
            const rows = classes.filter((klass) => (division.tracks as readonly string[]).includes(klass.track));
            return (
              <section key={division.id} id={division.id}>
                <h2 className="font-serif text-3xl text-moss">{division.title}</h2>
                <p className="mt-1 text-sm text-muted">{division.line}</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((klass) => (
                    <li key={klass.id} className="rounded-lg border border-line bg-card px-4 py-3">
                      <p className="font-serif text-xl text-moss">{classLabel(klass.name, klass.arm)}</p>
                      {klass.form_teacher_name ? <p className="text-sm text-muted">Form teacher {klass.form_teacher_name}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </DoorPage>
    </PublicFrame>
  );
}
