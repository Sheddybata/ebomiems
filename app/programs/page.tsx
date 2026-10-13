import { DoorPage } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";

const PROGRAMS = [
  { title: "Games and sports", body: "Physical and Health Education is on the Primary and Junior Secondary timetable. Games and sports are also rated on every child’s report, from Creche through SSS." },
  { title: "Art and music", body: "Cultural and Creative Arts runs in Primary and Junior Secondary. Drawing, painting and musical skills are part of the psychomotor report at every stage." },
  { title: "Languages", body: "English is taught throughout. Early years add handwriting and verbal reasoning. Junior Secondary includes Use of English Literature." },
  { title: "Civic life", body: "Civic Education is a subject from Primary into Senior Secondary. Junior Secondary also takes Social / Citizenship. It sits under the school motto: Education for development." },
  { title: "Computing", body: "Computer Studies is taught in Primary. Senior Secondary Science takes Digital Technology. Commercial takes Data Processing." },
  { title: "Science practicals", body: "Junior and Senior Secondary bills include a laboratory levy, because science is taught as practical work. Senior Secondary then divides into Science, Arts and Commercial." },
];

export default function ProgramsPage() {
  return (
    <PublicFrame>
      <DoorPage kicker="Programs" title="What sits beside the classroom" lede="These are the programs already on the timetable and the report. The school has not published a separate list of clubs, so this page does not invent one.">
        <div className="grid gap-4 md:grid-cols-2">
          {PROGRAMS.map((program) => (
            <article key={program.title} className="rounded-lg border border-line bg-card p-5">
              <h2 className="font-serif text-2xl text-moss">{program.title}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{program.body}</p>
            </article>
          ))}
        </div>
      </DoorPage>
    </PublicFrame>
  );
}
