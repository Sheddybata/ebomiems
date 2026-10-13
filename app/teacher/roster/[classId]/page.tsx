import { notFound } from "next/navigation";
import { Badge } from "@/components/ui";
import { ClassBar } from "@/components/teacher-class";
import { requireUser } from "@/lib/auth";
import { classLabel, formatPhone, personName, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { currentTerm, formRoster, getClass, teacherOwns } from "@/lib/repo";

export default async function RosterPage({ params }: { params: Promise<{ classId: string }> }) {
  const user = await requireUser("teacher");
  const { classId } = await params;
  const id = Number(classId);
  if (!teacherOwns(user.id, id, true)) notFound();
  const klass = getClass(id);
  if (!klass) notFound();
  const term = currentTerm();
  const rows = formRoster(id);
  return (
    <div>
      <ClassBar classId={id} label={classLabel(klass.name, klass.arm)} term={termTitle(term.name, term.session_name)} isForm current="roster" />
      <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
        {rows.map((pupil) => (
          <li key={pupil.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-medium">
                {personName(pupil)} {pupil.isNew ? <Badge>New</Badge> : null}
              </p>
              <p className="text-sm text-muted">{formatPhone(pupil.parent_phone)}</p>
              <p className={`text-xs ${pupil.balance_kobo > 0 ? "text-clay" : "text-leaf"}`}>{pupil.balance_kobo > 0 ? `Owing ${formatNaira(pupil.balance_kobo)}` : "Cleared"}</p>
            </div>
            <Badge tone={pupil.hasComment ? "leaf" : "clay"}>{pupil.hasComment ? "In" : "Missing"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
