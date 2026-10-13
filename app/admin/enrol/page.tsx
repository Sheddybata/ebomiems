import { Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { enrol } from "@/lib/actions";
import { classLabel } from "@/lib/format";
import { getEnquiry, listClasses, listParents } from "@/lib/repo";

export default async function EnrolPage({ searchParams }: { searchParams: Promise<{ error?: string; enquiry?: string }> }) {
  const query = await searchParams;
  const classes = (await listClasses());
  const parents = (await listParents());
  const enquiry = query.enquiry ? (await getEnquiry(Number(query.enquiry))) : undefined;
  const child = (enquiry?.child_name || "").trim().split(/\s+/);
  const firstName = child[0] || "";
  const lastName = child.slice(1).join(" ");
  const classId = classes.find((klass) => classLabel(klass.name, klass.arm) === enquiry?.stage)?.id;
  return (
    <div>
      <PageTitle title="Enrol a learner" lede="This one action creates the child, admission number, result PIN, class place, parent login or link, this term’s bill, an admission letter, and a notice for the bursar, form teacher and parent." />
      <Banner error={query.error} />
      {enquiry?.kind === "apply" ? <p className="mb-4 text-sm text-muted">Filled from the front-door request by {enquiry.name}. Check the class and the parent before you enrol.</p> : null}
      <form action={enrol} className="grid max-w-3xl gap-4 rounded-lg border border-line bg-card p-4 md:grid-cols-2">
        <label className="text-sm"><span className={labelClass}>First name</span><input name="firstName" defaultValue={firstName} className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Last name</span><input name="lastName" defaultValue={lastName} className={inputClass} required /></label>
        <label className="text-sm"><span className={labelClass}>Other name</span><input name="otherName" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Sex</span>
          <select name="gender" className={inputClass} required><option value="">Choose</option><option>Female</option><option>Male</option></select>
        </label>
        <label className="text-sm"><span className={labelClass}>Date of birth</span><input name="dob" type="date" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Class</span>
          <select name="classId" defaultValue={classId ? String(classId) : ""} className={inputClass} required>
            <option value="">Choose</option>
            {classes.map((klass) => <option key={klass.id} value={klass.id}>{classLabel(klass.name, klass.arm)}</option>)}
          </select>
        </label>
        <label className="text-sm md:col-span-2"><span className={labelClass}>Link an existing parent</span>
          <select name="parentId" className={inputClass} defaultValue="">
            <option value="">No — create a parent login below</option>
            {parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name} · {parent.phone || parent.email}</option>)}
          </select>
        </label>
        <label className="text-sm"><span className={labelClass}>New parent name</span><input name="parentName" defaultValue={enquiry?.name || ""} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Parent phone</span><input name="parentPhone" defaultValue={enquiry?.phone || ""} className={inputClass} placeholder="0803…" /></label>
        <label className="text-sm md:col-span-2"><span className={labelClass}>Parent email</span><input name="parentEmail" type="email" defaultValue={enquiry?.email || ""} className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Previous school, if any</span><input name="previousSchool" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Class they left</span><input name="previousClass" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Position last term</span><input name="previousPosition" className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>Reason for leaving</span><input name="leavingReason" className={inputClass} /></label>
        <div className="md:col-span-2">
          <button className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Enrol student</button>
          <p className="mt-2 text-xs text-muted">If you choose an existing parent, the new-parent fields are ignored. A new parent gets a one-time password on the next screen.</p>
        </div>
      </form>
    </div>
  );
}
