import Link from "next/link";
import { Badge, Banner, PageTitle } from "@/components/ui";
import { setEnquiryStatus } from "@/lib/actions";
import { formatDay, formatPhone, formatWhen } from "@/lib/format";
import { listEnquiries } from "@/lib/repo";

const KINDS = [
  { id: "", label: "All" },
  { id: "apply", label: "Admission" },
  { id: "inquire", label: "Questions" },
  { id: "tour", label: "Tours" },
  { id: "teach", label: "Teaching" },
];

const TITLES: Record<string, string> = { apply: "Admission", inquire: "Question", tour: "Tour", teach: "Teaching" };

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<{ kind?: string; error?: string; ok?: string }> }) {
  const query = await searchParams;
  const rows = listEnquiries(query.kind);
  return (
    <div>
      <PageTitle title="Front door" lede="People considering the school. An admission request is not an enrolment. A teaching application is not a staff login." />
      <Banner error={query.error} ok={query.ok} />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {KINDS.map((kind) => (
          <Link key={kind.label} href={kind.id ? `/admin/enquiries?kind=${kind.id}` : "/admin/enquiries"} className={`rounded-full px-3 py-1 ${query.kind === kind.id || (!query.kind && !kind.id) ? "bg-moss text-white" : "bg-card ring-1 ring-line"}`}>
            {kind.label}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="rounded-lg border border-line bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl text-moss">{row.name}</h2>
              <Badge tone={row.status === "new" ? "clay" : "leaf"}>{row.status === "new" ? "New" : "Seen"}</Badge>
              <span className="text-muted">{TITLES[row.kind]}</span>
            </div>
            <p className="mt-1 text-muted">{formatWhen(row.created_at)} · {formatPhone(row.phone)}{row.email ? ` · ${row.email}` : ""}</p>
            <dl className="mt-2 space-y-1">
              {row.child_name ? <Line label="Child" value={row.child_name} /> : null}
              {row.child_dob ? <Line label="Born" value={formatDay(row.child_dob)} /> : null}
              {row.stage ? <Line label="Class" value={row.stage} /> : null}
              {row.previous_school ? <Line label="Last school" value={row.previous_school} /> : null}
              {row.visit_on ? <Line label="Preferred day" value={formatDay(row.visit_on)} /> : null}
              {row.subject ? <Line label="Would teach" value={row.subject} /> : null}
            </dl>
            {row.note ? <p className="mt-2 leading-6">{row.note}</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
            {row.kind === "apply" ? <Link href={`/admin/enrol?enquiry=${row.id}`} className="rounded-md bg-moss px-3 py-1.5 text-sm font-semibold text-white">Enrol this child</Link> : null}
            <form action={setEnquiryStatus}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="status" value={row.status === "new" ? "seen" : "new"} />
              <button className="rounded-md border border-line px-3 py-1.5 text-sm font-semibold">{row.status === "new" ? "Mark seen" : "Mark new"}</button>
            </form>
            </div>
          </article>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted">Nothing in this list yet.</p> : null}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-2"><dt className="text-muted">{label}</dt><dd>{value}</dd></div>;
}
