import { Banner, PageTitle } from "@/components/ui";
import { StaffDesk, StaffForm } from "@/components/staff-form";
import { classLabel, formatPhone } from "@/lib/format";
import { OFFICE } from "@/lib/office";
import { listClasses, listStaff } from "@/lib/repo";

const ROLE: Record<string, string> = { admin: "Admin", bursar: "Bursar", teacher: "Teacher" };

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string; edit?: string }> }) {
  const query = await searchParams;
  const staff = (await listStaff());
  const classes = (await listClasses());
  const people = staff.map((person) => {
    const held = classes.filter((klass) => klass.form_teacher_id === person.id).map((klass) => classLabel(klass.name, klass.arm));
    return {
      id: person.id,
      name: person.name,
      email: person.email ?? "",
      phone: person.phone ?? "",
      phoneLabel: formatPhone(person.phone),
      role: person.role,
      designation: ROLE[person.role] || person.role,
      classes: held.join(", ") || "—",
      canChange: person.role === "teacher" || person.role === "bursar",
    };
  });
  const editing = people.find((person) => String(person.id) === query.edit);
  return (
    <div>
      <PageTitle title="Staff" lede={`Edit the bursar or a teacher from this list. Creche through Primary 5 and the head teacher are already here. Add a secondary teacher when the name arrives, then put them on a class. New teachers start with the password ${OFFICE.teacher.password} unless you set another.`} />
      <Banner error={query.error} ok={query.ok} />
      <StaffDesk people={people} initialEdit={query.error ? editing : undefined} />
      <StaffForm />
    </div>
  );
}
