import { DoorPage, EnquiryForm, PersonFields, Sent, StageField } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { inputClass, labelClass } from "@/components/ui";
import { listClasses } from "@/lib/repo";

export default async function InquirePage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const query = await searchParams;
  return (
    <PublicFrame>
      <DoorPage kicker="Admissions" title="Ask the school" lede="A short question, before you are ready to apply. The school replies to the phone number or email you leave.">
        <Sent ok={query.ok} error={query.error} />
        <EnquiryForm kind="inquire">
          <PersonFields />
          <StageField classes={listClasses()} />
          <label className="text-sm"><span className={labelClass}>Your question</span><textarea name="note" required rows={5} className={inputClass} /></label>
        </EnquiryForm>
      </DoorPage>
    </PublicFrame>
  );
}
