import Link from "next/link";
import { logout } from "@/lib/actions";
import { getUser, homeFor } from "@/lib/auth";
import { formatPhone } from "@/lib/format";
import { getSettings } from "@/lib/repo";
import { Crest } from "./ui";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/environment", label: "Environment" },
  { href: "/curriculum", label: "Curriculum" },
  { href: "/classes", label: "Classes" },
  { href: "/programs", label: "Programs" },
  { href: "/teach", label: "Teach" },
];

export async function PublicFrame({ children, paths = true }: { children: React.ReactNode; paths?: boolean }) {
  const user = await getUser();
  const settings = (await getSettings());
  return (
    <div className={`min-h-screen ${paths ? "pb-20" : ""}`}>
      <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-moss text-paper">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Crest />
          <div>
            <Link href="/" className="font-serif text-base leading-tight md:text-lg">{settings.school_name}</Link>
            <p className="text-xs text-gold-soft/90">{settings.motto}</p>
          </div>
          <div className="ml-auto hidden items-center gap-4 text-sm md:flex">
            <Link href="/results">Result checker</Link>
            {user ? (
              <>
                <Link href={homeFor(user.role)} className="font-semibold text-gold-soft">Your desk</Link>
                <form action={logout}><button className="rounded-md border border-white/30 px-3 py-1.5">Sign out</button></form>
              </>
            ) : (
              <Link href="/login" className="rounded-md bg-gold-soft px-3 py-1.5 font-semibold text-moss">Sign in</Link>
            )}
          </div>
          <details className="relative ml-auto md:hidden">
            <summary className="cursor-pointer list-none rounded-md border border-white/30 px-3 py-1.5 text-sm">Menu</summary>
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-md bg-moss-deep p-3 text-sm shadow-none">
              <div className="flex flex-col gap-2">
                {LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
                <Link href="/results">Result checker</Link>
                {user ? <Link href={homeFor(user.role)}>Your desk</Link> : <Link href="/login">Sign in</Link>}
                {user ? <form action={logout}><button className="text-gold-soft">Sign out</button></form> : null}
              </div>
            </div>
          </details>
        </div>
        <nav className="mx-auto hidden max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 pb-3 text-sm text-paper/85 md:flex">
          {LINKS.map((link) => <Link key={link.href} href={link.href} className="hover:text-gold-soft">{link.label}</Link>)}
        </nav>
      </header>
      {children}
      <footer className="border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
          <div>
            <p className="font-serif text-xl text-moss">{settings.school_name}</p>
            <p className="mt-2 text-muted">{settings.address}</p>
            <p className="mt-1">{formatPhone(settings.phone)}</p>
            <p>{settings.email}</p>
          </div>
          <div>
            <p className="font-semibold">Considering EBOMI</p>
            <div className="mt-2 flex flex-col gap-1">
              <Link href="/apply">Apply for admission</Link>
              <Link href="/inquire">Inquire</Link>
              <Link href="/visit">Book a tour</Link>
              <Link href="/teach">Apply to teach</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold">Already with us</p>
            <div className="mt-2 flex flex-col gap-1">
              {user ? <Link href={homeFor(user.role)}>Your desk</Link> : <Link href="/login">Parent and staff sign in</Link>}
              <Link href="/results">Result checker</Link>
            </div>
          </div>
        </div>
      </footer>
      {paths ? (
        <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-gold/40 bg-moss text-paper">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
            <p className="hidden text-xs uppercase tracking-[0.16em] text-gold-soft sm:block">Considering EBOMI</p>
            <div className="ml-auto grid flex-1 grid-cols-3 gap-2 sm:flex sm:flex-none">
              <Link href="/apply" className="rounded-md bg-gold-soft px-3 py-2 text-center text-sm font-semibold text-moss">Apply</Link>
              <Link href="/inquire" className="rounded-md border border-white/30 px-3 py-2 text-center text-sm font-semibold">Inquire</Link>
              <Link href="/visit" className="rounded-md border border-white/30 px-3 py-2 text-center text-sm font-semibold">Book a tour</Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
