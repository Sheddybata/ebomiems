import { DoorPage, EnquiryForm, PersonFields, Sent } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { inputClass, labelClass } from "@/components/ui";

export default async function TeachPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  return (
    <PublicFrame>
      <DoorPage kicker="Teach" title="Apply to teach" lede="Tell the school what you would teach and where you have taught. This form does not create a staff login. The school writes back if it wants to meet you.">
        <Sent ok={query.ok} error={query.error} />
        <EnquiryForm kind="teach">
          <PersonFields />
          <label className="text-sm"><span className={labelClass}>What would you teach?</span><input name="subject" required placeholder="Primary English, JSS Basic Science, Creche" className={inputClass} /></label>
          <label className="text-sm"><span className={labelClass}>Where you have taught, and for how long</span><textarea name="note" required rows={5} className={inputClass} /></label>
        </EnquiryForm>
      </DoorPage>
    </PublicFrame>
  );
}
