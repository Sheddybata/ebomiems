import { Banner, inputClass, labelClass } from "@/components/ui";
import { submitEnquiry } from "@/lib/actions";
import { classLabel } from "@/lib/format";

export function DoorPage({ kicker, title, lede, children }: { kicker: string; title: string; lede: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">{kicker}</p>
      <h1 className="mt-2 max-w-3xl font-serif text-5xl leading-tight text-moss">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{lede}</p>
      <div className="mt-10">{children}</div>
    </main>
  );
}

export function PersonFields() {
  return (
    <>
      <label className="text-sm"><span className={labelClass}>Your name</span><input name="name" required className={inputClass} /></label>
      <label className="text-sm"><span className={labelClass}>Email</span><input name="email" type="email" className={inputClass} /></label>
      <label className="text-sm"><span className={labelClass}>Mobile number</span><input name="phone" required inputMode="tel" placeholder="08035550101" className={inputClass} /></label>
    </>
  );
}

export function StageField({ classes }: { classes: { name: string; arm: string }[] }) {
  return (
    <label className="text-sm">
      <span className={labelClass}>Class in mind</span>
      <select name="stage" required className={inputClass} defaultValue="">
        <option value="" disabled>Choose a class</option>
        {classes.map((klass) => {
          const label = classLabel(klass.name, klass.arm);
          return <option key={label} value={label}>{label}</option>;
        })}
      </select>
    </label>
  );
}

export function EnquiryForm({ kind, children, aside }: { kind: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <form action={submitEnquiry} className="grid gap-3 rounded-lg border border-line bg-card p-5">
        <input type="hidden" name="kind" value={kind} />
        <label className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
        {children}
        <button className="mt-2 rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Send to the school</button>
      </form>
      {aside}
    </div>
  );
}

export function Sent({ ok, error }: { ok?: string; error?: string }) {
  return <Banner ok={ok} error={error} />;
}
