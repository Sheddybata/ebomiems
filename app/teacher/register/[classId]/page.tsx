import Link from "next/link";
import { notFound } from "next/navigation";
import { Banner } from "@/components/ui";
import { RegisterMark } from "@/components/register-mark";
import { ClassBar } from "@/components/teacher-class";
import { saveRegister } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { classLabel, formatDay, termTitle, todayISO } from "@/lib/format";
import { currentTerm, getClass, registerDay, teacherOwns } from "@/lib/repo";

export default async function RegisterPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ day?: string; error?: string; ok?: string }> }) {
  const user = await requireUser("teacher");
  const { classId } = await params;
  const query = await searchParams;
  const id = Number(classId);
  if (!(await teacherOwns(user.id, id))) notFound();
  const klass = (await getClass(id));
  if (!klass) notFound();
  const day = query.day || todayISO();
  const register = (await registerDay(id, day));
  const term = (await currentTerm());
  const shift = (days: number) => {
    const date = new Date(day + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  return (
    <div>
      <ClassBar classId={id} label={classLabel(klass.name, klass.arm)} term={termTitle(term.name, term.session_name)} isForm={(await teacherOwns(user.id, id, true))} current="register" />
      <h1 className="font-serif text-3xl text-moss">{formatDay(day)}</h1>
      <Banner error={query.error} ok={query.ok} />
      <div className="mt-2 flex gap-3 text-sm font-semibold text-moss">
        <Link href={`/teacher/register/${classId}?day=${shift(-1)}`}>Previous day</Link>
        <Link href={`/teacher/register/${classId}?day=${todayISO()}`}>Today</Link>
        <Link href={`/teacher/register/${classId}?day=${shift(1)}`}>Next day</Link>
      </div>
      <form action={saveRegister} className="mt-4 rounded-lg border border-line bg-card">
        <input type="hidden" name="classId" value={classId} />
        <input type="hidden" name="day" value={day} />
        <input type="hidden" name="studentIds" value={register.pupils.map((pupil) => pupil.id).join(",")} />
        <RegisterMark
          pupils={register.pupils.map((pupil) => ({ id: pupil.id, name: `${pupil.last_name} ${pupil.first_name}` }))}
          marks={Object.fromEntries(register.marks)}
        />
        <div className="sticky bottom-0 flex gap-2 border-t border-line bg-card px-3 py-3">
          <button name="intent" value="save" className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Save register</button>
          <button name="intent" value="all-present" className="rounded-md border border-line px-3 py-2 text-sm font-semibold">Mark all present</button>
        </div>
      </form>
    </div>
  );
}
