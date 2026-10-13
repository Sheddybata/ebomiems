import { Banner, PageTitle, inputClass } from "@/components/ui";
import { addClass, setFormTeacher } from "@/lib/actions";
import { TRACK_LABELS, classLabel } from "@/lib/format";
import { listClasses, listStaff } from "@/lib/repo";

export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const classes = listClasses();
  const teachers = listStaff().filter((person) => person.role === "teacher");
  return (
    <div>
      <PageTitle title="Classes" lede="Every class from Creche to SSS 3. The form teacher owns the register, roster, comments and ratings." />
      <Banner error={query.error} ok={query.ok} />
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-3 py-2">Class</th><th>Level</th><th>Code</th><th>Learners</th><th>Form teacher</th></tr>
          </thead>
          <tbody>
            {classes.map((klass) => (
              <tr key={klass.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{classLabel(klass.name, klass.arm)}</td>
                <td>{TRACK_LABELS[klass.track] || klass.track}</td>
                <td>{klass.level_code}</td>
                <td>{klass.pupils}</td>
                <td>
                  <form action={setFormTeacher} className="flex gap-2">
                    <input type="hidden" name="classId" value={klass.id} />
                    <select name="teacherId" defaultValue={klass.form_teacher_id ?? ""} className="rounded-md border border-line bg-white px-2 py-1">
                      <option value="">None</option>
                      {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                    </select>
                    <button className="text-sm font-semibold text-moss">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={addClass} className="mt-6 grid max-w-3xl gap-3 rounded-lg border border-line bg-card p-4 md:grid-cols-3">
        <h2 className="font-serif text-xl text-moss md:col-span-3">Add a class</h2>
        <input name="name" placeholder="Class name" className={inputClass} required />
        <input name="arm" placeholder="Arm, e.g. A or Science" className={inputClass} />
        <select name="track" className={inputClass} required>
          {Object.entries(TRACK_LABELS).filter(([key]) => key !== "sss").map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <input name="levelCode" placeholder="Code, e.g. P4" className={inputClass} required />
        <input name="sortOrder" type="number" placeholder="Sort" className={inputClass} />
        <select name="teacherId" className={inputClass}><option value="">Form teacher</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}</select>
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white md:col-span-3">Add class</button>
      </form>
    </div>
  );
}
