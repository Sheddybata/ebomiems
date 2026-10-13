import Link from "next/link";
import { Badge, Banner, PageTitle, inputClass } from "@/components/ui";
import { classLabel, isRecentAdmission, personName } from "@/lib/format";
import { formatNaira } from "@/lib/money";
import { listClasses, searchPupils } from "@/lib/repo";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; class?: string; fees?: string; error?: string }> }) {
  const query = await searchParams;
  const classes = listClasses();
  const classId = Number(query.class || 0);
  const fees = query.fees === "owing" || query.fees === "clear" ? query.fees : "";
  let pupils = searchPupils(query.q || "");
  if (classId) pupils = pupils.filter((pupil) => pupil.class_id === classId);
  if (fees === "owing") pupils = pupils.filter((pupil) => pupil.balance_kobo > 0);
  if (fees === "clear") pupils = pupils.filter((pupil) => pupil.balance_kobo <= 0);
  return (
    <div>
      <PageTitle title="Student register" lede="Search by name, admission number, parent or phone. Filter by class, or by whether the ledger is clear.">
        <Link href="/admin/enrol" className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Enrol</Link>
      </PageTitle>
      <Banner error={query.error} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={query.q} placeholder="Name or admission number" className={`${inputClass} max-w-md`} />
        <select name="class" defaultValue={query.class || ""} className={`${inputClass} max-w-xs`}>
          <option value="">All classes</option>
          {classes.map((klass) => <option key={klass.id} value={klass.id}>{classLabel(klass.name, klass.arm)}</option>)}
        </select>
        <select name="fees" defaultValue={fees} className={`${inputClass} max-w-[10rem]`}>
          <option value="">Any fees</option>
          <option value="owing">Owing</option>
          <option value="clear">Cleared</option>
        </select>
        <button className="rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold">Show</button>
      </form>
      <p className="mb-2 text-sm text-muted">{pupils.length} learner{pupils.length === 1 ? "" : "s"}</p>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Learner</th>
              <th>Admission</th>
              <th>Class</th>
              <th>Parent</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {pupils.map((pupil) => (
              <tr key={pupil.id} className="border-t border-line">
                <td className="px-3 py-2">
                  <Link href={`/admin/students/${pupil.id}`} className="font-semibold text-moss">{personName(pupil)}</Link>
                  {isRecentAdmission(pupil.admitted_on) ? <span className="ml-2"><Badge>New</Badge></span> : null}
                </td>
                <td className="py-2">{pupil.admission_no}</td>
                <td>{classLabel(pupil.class_name, pupil.class_arm)}</td>
                <td>{pupil.parent_name}</td>
                <td className={`tabular-nums ${pupil.balance_kobo > 0 ? "text-clay" : "text-leaf"}`}>{formatNaira(pupil.balance_kobo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pupils.length === 0 ? <p className="mt-3 text-sm text-muted">No learner matches that search.</p> : null}
    </div>
  );
}
