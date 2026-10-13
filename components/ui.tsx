import Link from "next/link";

export function Crest({ size = 40 }: { size?: number }) {
  return <img src="/logo.png" alt="" width={size} height={size} className="shrink-0 object-contain" style={{ width: size, height: size }} />;
}

export function PageTitle({ title, lede, children }: { title: string; lede?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-3xl text-moss">{title}</h1>
        {lede ? <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{lede}</p> : null}
      </div>
      {children}
    </div>
  );
}

export function Banner({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p className={`mb-4 rounded-md px-3 py-2 text-sm ${error ? "bg-clay-soft text-clay" : "bg-gold-soft text-moss"}`}>
      {error || ok}
    </p>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-serif text-2xl tabular-nums text-ink">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Panel({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-card">
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-serif text-xl text-moss">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

export const inputClass = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-moss";
export const labelClass = "mb-1 block text-sm font-semibold";
export const btnClass = "inline-flex items-center justify-center rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss-deep";
export const btnGhost = "inline-flex items-center justify-center rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold text-ink hover:bg-gold-soft";
export const btnDanger = "inline-flex items-center justify-center rounded-md border border-clay/30 bg-clay-soft px-3 py-2 text-sm font-semibold text-clay";

export function Badge({ children, tone = "gold" }: { children: React.ReactNode; tone?: "gold" | "clay" | "leaf" }) {
  const toneClass = tone === "clay" ? "bg-clay-soft text-clay" : tone === "leaf" ? "bg-leaf/10 text-leaf" : "bg-gold-soft text-gold";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${toneClass}`}>{children}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-moss underline decoration-gold/60 underline-offset-2">
      {children}
    </Link>
  );
}
