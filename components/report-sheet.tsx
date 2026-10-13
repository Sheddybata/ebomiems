import { formatDay } from "@/lib/format";
import { PRIMARY_SCALE, QUALITATIVE, RATING_LABELS, WAEC_SCALE, qualitativeLabel } from "@/lib/grading";
import { formatNaira } from "@/lib/money";
import type { ReportSheet } from "@/lib/report";
import { getSettings } from "@/lib/repo";

export async function ReportDocument({ sheet, banner }: { sheet: ReportSheet; banner?: string }) {
  const settings = (await getSettings());
  const scale = sheet.assess.kind === "numeric" && sheet.assess.scale === "waec" ? WAEC_SCALE : PRIMARY_SCALE;
  return (
    <article className="sheet">
      {banner ? <p className="mb-3 border border-clay px-2 py-1 text-center text-xs font-semibold uppercase tracking-wide text-clay">{banner}</p> : null}
      <header className="text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-3 h-16 w-16 object-contain" />
        <p className="font-serif text-2xl text-moss">{settings.school_name}</p>
        <p className="text-sm italic text-muted">{settings.motto}</p>
        <p className="mt-1 text-xs text-muted">
          {settings.address} · {settings.phone} · {settings.email}
        </p>
        <h1 className="mt-3 font-serif text-lg tracking-wide">{sheet.assess.kind === "qualitative" ? "Early Years Report" : "Terminal Report Sheet"}</h1>
        <p className="text-sm">{sheet.termLabel}</p>
      </header>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <Item label="Learner" value={`${sheet.pupil.first_name} ${sheet.pupil.last_name}`} />
        <Item label="Admission no." value={sheet.pupil.admission_no} />
        <Item label="Class" value={sheet.className} />
        <Item label="Sex" value={sheet.pupil.gender} />
        <Item label="Age" value={sheet.age == null ? "—" : String(sheet.age)} />
        <Item label="Days opened" value={String(sheet.attendance.opened)} />
        <Item label="Days present" value={String(sheet.attendance.present)} />
        <Item label="Days absent" value={String(sheet.attendance.absent)} />
      </dl>
      <table className="marks mt-4">
        <thead>
          <tr>
            <th>Subject</th>
            {sheet.assess.kind === "qualitative" ? <th>Rating</th> : null}
            {sheet.assess.kind === "numeric" ? (
              <>
                <th>CA / {sheet.assess.caMax}</th>
                <th>Exam / {sheet.assess.examMax}</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Remark</th>
                <th>Position</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {sheet.subjects.map((subject) => (
            <tr key={subject.name}>
              <td>{subject.name}</td>
              {sheet.assess.kind === "qualitative" ? <td>{qualitativeLabel(subject.qualitative)}</td> : null}
              {sheet.assess.kind === "numeric" ? (
                <>
                  <td>{subject.ca ?? "—"}</td>
                  <td>{subject.exam ?? "—"}</td>
                  <td>{subject.total ?? "—"}</td>
                  <td>{subject.grade ?? "—"}</td>
                  <td>{subject.remark ?? "—"}</td>
                  <td>{subject.position ?? "—"}</td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {sheet.assess.kind === "numeric" ? (
        <p className="mt-2 text-sm">
          Total {sheet.totalScore ?? "—"} / {sheet.obtainable} · Average {sheet.average == null ? "—" : sheet.average.toFixed(1)} · Position {sheet.position ?? "—"} of {sheet.numberInClass}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">Early years are reported by rating. There is no class position.</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TraitTable title="Affective" rows={sheet.affective} />
        <TraitTable title="Psychomotor" rows={sheet.psychomotor} />
      </div>
      <p className="mt-1 text-xs text-muted">Rating: 5 Excellent, 4 Very Good, 3 Good, 2 Fair, 1 Poor.</p>
      <div className="mt-4 space-y-2 text-sm">
        <p>
          <span className="font-semibold">Form teacher:</span> {sheet.formComment || "—"}
        </p>
        <p>
          <span className="font-semibold">Principal:</span> {sheet.principalRemark || "—"}
        </p>
      </div>
      <div className="mt-6 grid gap-6 text-sm sm:grid-cols-3">
        <Sign label={`Form teacher · ${sheet.formTeacher}`} />
        <Sign label={`Principal · ${sheet.principal}`} />
        <Sign label="Parent / guardian" />
      </div>
      <div className="mt-4 text-xs leading-5 text-muted">
        {sheet.assess.kind === "qualitative" ? (
          <p>Ratings: {QUALITATIVE.map((item) => item.label).join(", ")}.</p>
        ) : (
          <p>
            {sheet.assess.scale === "waec" ? "WAEC scale. " : "Primary scale. "}
            {scale.map((row) => `${row[0]} ${row[1]} ${row[2]}`).join(" · ")}. Continuous assessment is {sheet.assess.caMax}, examination is {sheet.assess.examMax}.
          </p>
        )}
        <p>Next term begins {formatDay(sheet.term.next_begins_on)}. Level fee schedule {formatNaira(sheet.nextFeesKobo)}. The bill itself is on the parent account.</p>
        <p>This sheet is not valid without the school stamp. {RATING_LABELS[5]} work is the top of the affective scale.</p>
      </div>
    </article>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function TraitTable({ title, rows }: { title: string; rows: { trait: string; rating: number | null }[] }) {
  return (
    <table className="marks">
      <thead>
        <tr>
          <th>{title}</th>
          <th>Rating</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.trait}>
            <td>{row.trait}</td>
            <td>{row.rating ? `${row.rating} · ${RATING_LABELS[row.rating]}` : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Sign({ label }: { label: string }) {
  return (
    <div>
      <div className="h-10 border-b border-ink/40" />
      <p className="mt-1 text-xs">{label}</p>
    </div>
  );
}
