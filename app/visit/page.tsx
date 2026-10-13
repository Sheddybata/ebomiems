import { DoorPage, EnquiryForm, PersonFields, Sent, StageField } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { inputClass, labelClass } from "@/components/ui";
import { getSettings, listClasses } from "@/lib/repo";

export default async function VisitPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  const settings = getSettings();
  return (
    <PublicFrame>
      <DoorPage kicker="Admissions" title="Book a tour" lede={`Ask for a day at ${settings.address}. The school confirms the time. A tour is not an application.`}>
        <Sent ok={query.ok} error={query.error} />
        <EnquiryForm kind="tour">
          <PersonFields />
          <label className="text-sm"><span className={labelClass}>Child’s name</span><input name="childName" className={inputClass} /></label>
          <StageField classes={listClasses()} />
          <label className="text-sm"><span className={labelClass}>Preferred day</span><input name="visitOn" type="date" required className={inputClass} /></label>
          <label className="text-sm"><span className={labelClass}>Note</span><textarea name="note" rows={3} className={inputClass} /></label>
        </EnquiryForm>
      </DoorPage>
    </PublicFrame>
  );
}
