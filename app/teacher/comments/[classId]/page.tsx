import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Banner } from "@/components/ui";
import { CommentField } from "@/components/widgets";
import { ClassBar } from "@/components/teacher-class";
import { saveFormReport } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { AFFECTIVE, PSYCHOMOTOR, RATING_LABELS, commentBand } from "@/lib/grading";
import { classLabel, personName, termTitle } from "@/lib/format";
import { commentSheet, getClass, teacherOwns } from "@/lib/repo";

export default async function CommentsPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ student?: string; error?: string; ok?: string }> }) {
  const user = await requireUser("teacher");
  const { classId } = await params;
  const query = await searchParams;
  const id = Number(classId);
  if (!teacherOwns(user.id, id, true)) notFound();
  const klass = getClass(id);
  if (!klass) notFound();
  const sheet = commentSheet(id);
  const locked = sheet.release.status !== "open";
  const requested = Number(query.student);
  const open = sheet.pupils.find((row) => row.pupil.id === requested) ?? sheet.pupils.find((row) => !row.remark?.form_comment?.trim()) ?? sheet.pupils[0];
  return (
    <div>
      <ClassBar classId={id} label={classLabel(klass.name, klass.arm)} term={termTitle(sheet.term.name, sheet.term.session_name)} isForm current="comments" />
      <Banner error={query.error} ok={query.ok} />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <ul className="overflow-hidden rounded-lg border border-line bg-card">
          {sheet.pupils.map((row) => {
            const ready = Boolean(row.remark?.form_comment?.trim());
            const selected = row.pupil.id === open?.pupil.id;
            return (
              <li key={row.pupil.id} className={selected ? "bg-moss text-white" : "border-t border-line"}>
                <Link href={`/teacher/comments/${classId}?student=${row.pupil.id}`} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{personName(row.pupil)}</span>
                  {selected ? <span className="text-xs font-semibold">{ready ? "In" : "Missing"}</span> : <Badge tone={ready ? "leaf" : "clay"}>{ready ? "In" : "Missing"}</Badge>}
                </Link>
              </li>
            );
          })}
        </ul>
        {open ? <CommentCard classId={classId} row={open} kind={sheet.assess.kind} locked={locked} /> : null}
      </div>
    </div>
  );
}

function CommentCard({
  classId,
  row,
  kind,
  locked,
}: {
  classId: string;
  row: { pupil: { id: number; first_name: string; last_name: string; other_name?: string | null }; remark: { form_comment: string } | undefined; traits: { trait: string; rating: number }[]; projected: number | null };
  kind: "qualitative" | "numeric";
  locked: boolean;
}) {
  const trait = new Map(row.traits.map((item) => [item.trait, item.rating]));
  return (
    <form action={saveFormReport} className="rounded-lg border border-line bg-card p-4">
      <input type="hidden" name="classId" value={classId} />
      <input type="hidden" name="studentId" value={row.pupil.id} />
      <h2 className="font-serif text-xl text-moss">{personName(row.pupil)}</h2>
      <div className="mt-2">
        <CommentField name="comment" defaultValue={row.remark?.form_comment || ""} suggestions={commentBand(kind, row.projected)} />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Ratings title="Affective" names={AFFECTIVE} prefix={`aff_${row.pupil.id}`} values={trait} disabled={locked} />
        <Ratings title="Psychomotor" names={PSYCHOMOTOR} prefix={`psy_${row.pupil.id}`} values={trait} disabled={locked} />
      </div>
      {locked ? <p className="mt-2 text-sm text-clay">Locked.</p> : <button className="mt-3 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save {row.pupil.first_name}</button>}
    </form>
  );
}

function Ratings({ title, names, prefix, values, disabled }: { title: string; names: string[]; prefix: string; values: Map<string, number>; disabled: boolean }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {names.map((name) => (
        <label key={name} className="mt-1 grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
          <span className="min-w-0">{name}</span>
          <select name={`${prefix}_${name}`} defaultValue={values.get(name) || ""} disabled={disabled} className="rounded-md border border-line bg-white px-2 py-1">
            <option value="">—</option>
            {RATING_LABELS.slice(1).map((label, index) => <option key={label} value={index + 1}>{index + 1} · {label}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}
