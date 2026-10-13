import { notFound } from "next/navigation";
import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDay, todayISO } from "@/lib/format";
import { attendanceHistory, attendanceStats, currentTerm, getPupil } from "@/lib/repo";

export default async function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("parent");
  const { id } = await params;
  const pupil = (await getPupil(Number(id)));
  if (!pupil || pupil.parent_id !== user.id) notFound();
  const term = (await currentTerm());
  const stats = (await attendanceStats(pupil.id, term.id));
  const days = (await attendanceHistory(pupil.id, term.id));
  const today = todayISO();
  const weekday = new Date(today + "T00:00:00Z").getUTCDay();
  const markedToday = days.some((day) => day.day === today);
  return (
    <div>
      <PageTitle title={`${pupil.first_name}'s attendance`} lede={`Present ${stats.present} · absent ${stats.absent} · school days recorded ${stats.opened}.`} />
      {weekday !== 0 && weekday !== 6 && !markedToday ? <p className="mb-3 text-sm text-muted">Today has not been marked yet.</p> : null}
      <ul className="divide-y divide-line rounded-lg border border-line bg-card text-sm">
        {days.map((day) => (
          <li key={day.day} className="flex justify-between px-4 py-2">
            <span>{formatDay(day.day)}</span>
            <span className="capitalize">{day.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
