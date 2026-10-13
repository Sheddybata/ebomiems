import { DoorPage } from "@/components/front-door";
import { PublicFrame } from "@/components/public-frame";
import { formatPhone } from "@/lib/format";
import { getSettings } from "@/lib/repo";

export default async function AboutPage() {
  const settings = (await getSettings());
  return (
    <PublicFrame>
      <DoorPage kicker="About" title={settings.school_name} lede="One school in Jos, from the creche room to Senior Secondary. Parents and staff already in the school sign in. Families who are still looking apply, inquire, or book a tour.">
        <h2 className="font-serif text-4xl text-moss">{settings.motto}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">The school teaches so a child can grow. Creche and Nursery are qualitative. Primary is graded A to F. Junior and Senior Secondary use the WAEC scale, A1 to F9. Civic education runs from Primary, and the report also records character: punctuality, honesty, neatness, and how a child treats other people.</p>
        <dl className="mt-12 max-w-xl space-y-2 text-sm">
          <Row label="Principal" value={settings.principal_name} />
          <Row label="Address" value={settings.address} />
          <Row label="Phone" value={formatPhone(settings.phone)} />
          <Row label="Email" value={settings.email} />
        </dl>
      </DoorPage>
    </PublicFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-line py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
