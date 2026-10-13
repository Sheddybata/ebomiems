import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { teacherDesk } from "@/lib/repo";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("teacher");
  const desk = teacherDesk(user.id);
  const row = desk.classes.find((item) => item.isForm) ?? desk.classes[0];
  const extra = row
    ? [
        { href: `/teacher/register/${row.klass.id}`, label: "Register" },
        { href: `/teacher/markbook/${row.klass.id}`, label: "Markbook" },
        ...(row.isForm
          ? [
              { href: `/teacher/roster/${row.klass.id}`, label: "Roster" },
              { href: `/teacher/comments/${row.klass.id}`, label: "Comments" },
            ]
          : []),
      ]
    : [];
  return (
    <Shell user={user} extra={extra}>
      {children}
    </Shell>
  );
}
