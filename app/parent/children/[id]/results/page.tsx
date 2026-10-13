import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { assessmentOf, qualitativeLabel } from "@/lib/grading";
import { classLabel, resultMessage, termTitle } from "@/lib/format";
import { classForTerm, currentTerm, gateTerm, getPupil, listTerms, scoresForClass, subjectsForTrack } from "@/lib/repo";

export default async function ChildResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("parent");
  const { id } = await params;
  const pupil = getPupil(Number(id));
  if (!pupil || pupil.parent_id !== user.id) notFound();
  const term = currentTerm();
  const assess = assessmentOf(pupil.track);
  const subjects = subjectsForTrack(pupil.track);
  const scores = new Map(scoresForClass(pupil.class_id, term.id).filter((score) => score.student_id === pupil.id).map((score) => [score.subject_id, score]));
  const terms = listTerms().filter((item) => classForTerm(pupil.id, item.id));
  return (
    <div>
      <PageTitle title={`${pupil.first_name}'s results`} lede={`${pupil.admission_no} · result PIN ${pupil.pin}. During the term you see continuous assessment. The official sheet appears after the school publishes it, and only if that term’s fees are clear.`} />
      <h2 className="font-serif text-xl text-moss">This term · {termTitle(term.name, term.session_name)}</h2>
      <table className="mt-2 w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-1">Subject</th><th>{assess.kind === "qualitative" ? "Rating" : `CA / ${assess.caMax}`}</th></tr></thead>
        <tbody>
          {subjects.map((subject) => {
            const score = scores.get(subject.id);
            return (
              <tr key={subject.id} className="border-t border-line">
                <td className="py-1">{subject.name}</td>
                <td>{assess.kind === "qualitative" ? qualitativeLabel(score?.qualitative) : score?.ca ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-muted">Examination scores stay with the school until the official report is published.</p>
      <ul className="mt-6 space-y-2 text-sm">
        {terms.map((item) => {
          const gate = gateTerm(pupil.id, item.id);
          return (
            <li key={item.id} className="rounded-lg border border-line bg-card px-3 py-2">
              <span className="font-semibold">{termTitle(item.name, item.session_name)}</span>
              {gate === "ready" ? <Link className="ml-2 font-semibold text-moss" href={`/parent/children/${pupil.id}/report/${item.id}`}>Print official report</Link> : <span className="mt-1 block text-muted">{resultMessage(gate, "parent")}</span>}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">Class now: {classLabel(pupil.class_name, pupil.class_arm)}</p>
    </div>
  );
}
