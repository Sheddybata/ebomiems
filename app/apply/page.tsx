import Link from "next/link";
import { EnquiryForm, DoorPage, PersonFields, Sent, StageField } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { inputClass, labelClass } from "@/components/ui";
import { listClasses } from "@/lib/repo";

export default async function ApplyPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const classes = (await listClasses());
  return (
    <PublicFrame>
      <DoorPage kicker="Admissions" title="Apply for a place" lede="Send the child’s details. The school reads the request and contacts you. It does not reserve a place, and it does not open a parent login. That happens only when admin enrols the child.">
        <Sent ok={query.ok} error={query.error} />
        <EnquiryForm
          kind="apply"
          aside={
            <aside className="text-sm leading-7">
              <h2 className="font-serif text-2xl text-moss">Before you apply</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-muted">
                <li>If you are still looking, <Link className="font-semibold text-moss" href="/inquire">inquire</Link> or <Link className="font-semibold text-moss" href="/visit">book a tour</Link>.</li>
                <li>Send this form. Have the child’s date of birth to hand.</li>
                <li>The school will say if there is a place, and which class fits.</li>
                <li>After an offer, admin enrols the child. That creates the admission number, the result PIN and the parent login.</li>
              </ol>
            </aside>
          }
        >
          <PersonFields />
          <label className="text-sm"><span className={labelClass}>Child’s name</span><input name="childName" required className={inputClass} /></label>
          <label className="text-sm"><span className={labelClass}>Child’s date of birth</span><input name="childDob" type="date" required className={inputClass} /></label>
          <StageField classes={classes} />
          <label className="text-sm"><span className={labelClass}>Current or last school</span><input name="previousSchool" className={inputClass} /></label>
          <label className="text-sm"><span className={labelClass}>Anything the school should know</span><textarea name="note" rows={4} className={inputClass} /></label>
        </EnquiryForm>
      </DoorPage>
    </PublicFrame>
  );
}
