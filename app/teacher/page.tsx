import Link from "next/link";
import { Badge, PageTitle, btnClass } from "@/components/ui";
import { classLabel, personName, termTitle } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { teacherDesk } from "@/lib/repo";

export default async function TeacherPage() {
  const user = await requireUser("teacher");
  const desk = teacherDesk(user.id);
  return (
    <div>
      <PageTitle title="My desk" lede={`${termTitle(desk.term.name, desk.term.session_name)}. New names appear here as soon as admin enrols them into your class.`} />
      <div className="grid gap-4">
        {desk.classes.map((row) => (
          <section key={row.klass.id} className="rounded-lg border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-2xl text-moss">{classLabel(row.klass.name, row.klass.arm)}</h2>
              {row.isForm ? <Badge>Form class</Badge> : null}
              {row.progress.todayRegister === "due" ? <Badge tone="clay">Register open</Badge> : null}
              {row.progress.todayRegister === "marked" ? <Badge tone="leaf">Register marked</Badge> : null}
            </div>
            <p className="mt-1 text-sm text-muted">
              {row.progress.kind === "qualitative" ? `Ratings ${row.progress.caPct}%` : `Continuous assessment ${row.progress.caPct}%`}
              {row.progress.examPct != null ? ` · examinations ${row.progress.examPct}%` : ""} · {row.progress.pupils} learners
            </p>
            {row.progress.missing > 0 ? <p className="text-sm text-clay">{row.progress.missing} {row.progress.kind === "qualitative" ? "rating" : "continuous assessment"}{row.progress.missing === 1 ? "" : "s"} still missing. Open the markbook for the names.</p> : null}
            {row.newcomers.length > 0 ? (
              <ul className="mt-2 text-sm">
                {row.newcomers.map((pupil) => <li key={pupil.id}><Badge>New</Badge> {personName(pupil)} · {pupil.admission_no}</li>)}
              </ul>
            ) : null}
            <ClassActions classId={row.klass.id} isForm={row.isForm} registerDue={row.progress.todayRegister === "due"} scoresMissing={row.progress.missing > 0} />
          </section>
        ))}
      </div>
      {desk.notices.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-serif text-xl text-moss">Notices</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {desk.notices.map((notice) => <li key={notice.id}><span className="font-semibold">{notice.title}.</span> {notice.body}</li>)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ClassActions({ classId, isForm, registerDue, scoresMissing }: { classId: number; isForm: boolean; registerDue: boolean; scoresMissing: boolean }) {
  const register = `/teacher/register/${classId}`;
  const markbook = `/teacher/markbook/${classId}`;
  const primary = registerDue ? { href: register, label: "Register" } : scoresMissing ? { href: markbook, label: "Markbook" } : null;
  const links = [
    { href: register, label: "Register" },
    { href: markbook, label: "Markbook" },
    ...(isForm
      ? [
          { href: `/teacher/roster/${classId}`, label: "Roster" },
          { href: `/teacher/comments/${classId}`, label: "Comments" },
        ]
      : []),
  ].filter((link) => link.href !== primary?.href);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {primary ? (
        <Link href={primary.href} className={btnClass}>
          {primary.label}
        </Link>
      ) : null}
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-semibold text-moss">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
