import { formatDay, personName, todayISO } from "@/lib/format";
import type { Pupil, SettingsRow } from "@/lib/repo";

export function AdmissionLetter({ pupil, settings, className }: { pupil: Pupil; settings: SettingsRow; className: string }) {
  return (
    <article className="sheet mx-auto max-w-3xl">
      <header className="text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-3 h-16 w-16 object-contain" />
        <p className="font-serif text-2xl text-moss">{settings.school_name}</p>
        <p className="text-sm italic">{settings.motto}</p>
        <p className="mt-1 text-xs text-muted">{settings.address} · {settings.phone} · {settings.email}</p>
        <h1 className="mt-4 font-serif text-lg tracking-wide">Admission letter</h1>
      </header>
      <p className="mt-6 text-sm">{formatDay(todayISO())}</p>
      <p className="mt-4 text-sm leading-7">Dear {pupil.parent_name},</p>
      <p className="mt-3 text-sm leading-7">
        This letter confirms that {personName(pupil)} has been admitted into {className} of {settings.school_name}.
        The admission number is {pupil.admission_no}. The result PIN is on the parent account and is not reprinted here.
      </p>
      {pupil.previous_school ? (
        <p className="mt-3 text-sm leading-7">
          Previous school: {pupil.previous_school}
          {pupil.previous_class ? `. Class left: ${pupil.previous_class}` : ""}
          {pupil.previous_position ? `. Position last term: ${pupil.previous_position}` : ""}
          {pupil.leaving_reason ? `. Reason for leaving: ${pupil.leaving_reason}` : ""}.
        </p>
      ) : null}
      <p className="mt-3 text-sm leading-7">Admitted on {formatDay(pupil.admitted_on)}.</p>
      <div className="mt-12 max-w-xs text-sm">
        <div className="h-10 border-b border-ink/40" />
        <p className="mt-2 font-semibold">{settings.principal_name}</p>
        <p>Principal</p>
      </div>
    </article>
  );
}
