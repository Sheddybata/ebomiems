import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/public-frame";
import { Banner, inputClass, labelClass } from "@/components/ui";
import { login } from "@/lib/actions";
import { getUser, homeFor } from "@/lib/auth";
import { classLabel } from "@/lib/format";
import { OFFICE } from "@/lib/office";
import { listClasses, listStaff } from "@/lib/repo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const query = await searchParams;
  const staff = listStaff();
  const byId = new Map(staff.map((person) => [person.id, person]));
  const desks = [
    ["Admin · principal", OFFICE.admin.email, OFFICE.admin.password],
    ["Bursar", OFFICE.bursar.email, OFFICE.bursar.password],
  ];
  const classes = listClasses();
  const seen = new Set<number>();
  const teachers: { className: string; name: string; email: string }[] = [];
  for (const klass of classes) {
    if (!klass.form_teacher_id || seen.has(klass.form_teacher_id)) continue;
    const teacher = byId.get(klass.form_teacher_id);
    if (!teacher?.email) continue;
    seen.add(klass.form_teacher_id);
    const held = classes
      .filter((item) => item.form_teacher_id === teacher.id)
      .map((item) => classLabel(item.name, item.arm))
      .join(", ");
    teachers.push({ className: held, name: teacher.name, email: teacher.email });
  }
  const extra = staff.filter((person) => person.role === "teacher" && person.email && !seen.has(person.id));
  return (
    <PublicFrame paths={false}>
      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-12 md:grid-cols-2">
        <form action={login} className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-serif text-3xl text-moss">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Parents and staff. Use the email or mobile number on the account. Learners do not have a login. A new family applies first; this door opens after the school enrols the child.</p>
          <Banner error={query.error} />
          <label className={`mt-4 ${labelClass}`} htmlFor="identity">Email or phone</label>
          <input id="identity" name="identity" autoComplete="username" className={inputClass} required />
          <label className={`mt-3 ${labelClass}`} htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} required />
          <button className="mt-4 rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Sign in</button>
        </form>
        <aside className="text-sm leading-6">
          <h2 className="font-serif text-2xl text-moss">This school copy</h2>
          <p className="mt-2 text-muted">Every teacher has a separate login. The password for all of them, until you change it, is <span className="font-mono text-xs">{OFFICE.teacher.password}</span>.</p>
          <table className="mt-4 w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th className="py-1">Desk</th>
                <th>Sign in</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {desks.map((row) => (
                <tr key={row[0]} className="border-t border-line align-top">
                  <td className="py-2 pr-2 font-semibold">{row[0]}</td>
                  <td className="py-2 pr-2">{row[1]}</td>
                  <td className="py-2 font-mono text-xs">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 className="mt-6 font-serif text-xl text-moss">Teachers</h3>
          <table className="mt-2 w-full border-collapse text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-muted">
                <th className="py-1">Class</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((row) => (
                <tr key={row.email} className="border-t border-line align-top">
                  <td className="py-2 pr-2">{row.className}</td>
                  <td className="py-2 pr-2 font-semibold">{row.name}</td>
                  <td className="py-2 font-mono text-xs">{row.email}</td>
                </tr>
              ))}
              {extra.map((person) => (
                <tr key={person.id} className="border-t border-line align-top">
                  <td className="py-2 pr-2 text-muted">No class yet</td>
                  <td className="py-2 pr-2 font-semibold">{person.name}</td>
                  <td className="py-2 font-mono text-xs">{person.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </aside>
      </main>
    </PublicFrame>
  );
}
