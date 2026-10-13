import { DoorPage } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { TRACK_LABELS } from "@/lib/format";
import { PRIMARY_SCALE, WAEC_SCALE } from "@/lib/grading";
import { subjectsForTrack } from "@/lib/repo";
import { DIVISIONS } from "@/lib/site";

export default async function CurriculumPage() {
  const byTrack: Record<string, Awaited<ReturnType<typeof subjectsForTrack>>> = {};
  for (const division of DIVISIONS) {
    for (const track of division.tracks) {
      byTrack[track] = await subjectsForTrack(track);
    }
  }
  return (
    <PublicFrame>
      <DoorPage kicker="Curriculum" title="What is taught, and how it is graded" lede="The same child can move from a qualitative creche report to a WAEC-scale Senior Secondary sheet without changing schools. Positions are given only where the grade is a number.">
        <div className="space-y-10">
          {DIVISIONS.map((division) => (
            <section key={division.id} id={division.id}>
              <h2 className="font-serif text-3xl text-moss">{division.title}</h2>
              <p className="mt-1 text-sm text-muted">{division.line}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {division.tracks.map((track) => (
                  <article key={track} className="rounded-lg border border-line bg-card p-4">
                    <h3 className="font-semibold">{TRACK_LABELS[track] || track}</h3>
                    <ul className="mt-2 columns-1 text-sm leading-7 sm:columns-2">
                      {(byTrack[track] ?? []).map((subject) => <li key={subject.id}>{subject.name}</li>)}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <Scale title="Primary" note="Continuous assessment is 40. The examination is 60." rows={PRIMARY_SCALE} />
          <Scale title="JSS and SSS" note="Continuous assessment is 30. The examination is 70." rows={WAEC_SCALE} />
        </div>
      </DoorPage>
    </PublicFrame>
  );
}

function Scale({ title, note, rows }: { title: string; note: string; rows: string[][] }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-moss">{title}</h2>
      <p className="text-sm text-muted">{note}</p>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1">Grade</th><th>Mark</th><th>Remark</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-t border-line"><td className="py-1 font-semibold">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
