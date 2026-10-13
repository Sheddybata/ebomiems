import Link from "next/link";
import { Badge, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { classLabel, personName, resultMessage, termTitle } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { parentDesk } from "@/lib/repo";

export default async function ParentPage() {
  const user = await requireUser("parent");
  const desk = parentDesk(user.id);
  return (
    <div>
      <PageTitle title={`Good day, ${user.name.split(" ")[0]}`} lede="Every ward on this account is here. Learners do not have a separate login. A child admitted in the last two weeks is marked New." />
      {desk.unread > 0 ? <p className="mb-4 text-sm"><Link className="font-semibold text-moss" href="/parent/notices">{desk.unread} unread notice{desk.unread === 1 ? "" : "s"}</Link></p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {desk.children.map((row) => (
          <article key={row.child.id} className="rounded-lg border border-line bg-card p-4">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-moss">{personName(row.child)}</h2>
              {row.isNew ? <Badge>New</Badge> : null}
            </div>
            <p className="text-sm text-muted">{row.child.admission_no} · {classLabel(row.child.class_name, row.child.class_arm)}</p>
            <p className="mt-2 font-serif text-2xl tabular-nums">{formatNaira(row.child.balance_kobo)}</p>
            <p className="text-sm text-muted">{row.child.balance_kobo > 0 ? "Outstanding" : "Fees clear"} · present {row.attendance.present} of {row.attendance.opened} days this term</p>
            <ul className="mt-3 space-y-1 text-sm">
              {row.terms.map((item) => (
                <li key={item.term.id}>
                  {termTitle(item.term.name, item.term.session_name)} · {item.gate === "ready" ? <Link className="font-semibold text-moss" href={`/parent/children/${row.child.id}/report/${item.term.id}`}>Official report</Link> : resultMessage(item.gate, "parent")}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-moss">
              <Link href={`/parent/children/${row.child.id}/letter`}>Admission letter</Link>
              <Link href={`/parent/children/${row.child.id}/results`}>Results</Link>
              <Link href={`/parent/children/${row.child.id}/fees`}>Fees</Link>
              <Link href={`/parent/children/${row.child.id}/attendance`}>Attendance</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
