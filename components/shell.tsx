import { logout } from "@/lib/actions";
import { getSettings } from "@/lib/repo";
import type { SessionUser } from "@/lib/types";
import { Nav } from "./nav";
import { Crest } from "./ui";

export function Shell({ user, extra, children }: { user: SessionUser; extra?: { href: string; label: string }[]; children: React.ReactNode }) {
  const settings = getSettings();
  return (
    <div className="min-h-screen overflow-x-clip">
      <header className="no-print bg-moss text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <Crest size={48} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-base leading-tight">{settings.school_name}</p>
            <p className="truncate text-xs text-gold-soft/90">{settings.motto}</p>
          </div>
          <div className="text-right text-sm">
            <p>{user.name}</p>
            <p className="text-xs uppercase tracking-wide text-gold-soft">{user.role}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 sm:ml-auto sm:w-auto">
            <a href="/" className="text-sm text-gold-soft underline-offset-2 hover:underline">
              School site
            </a>
            <a href="/account/password" className="text-sm text-gold-soft underline-offset-2 hover:underline">
              Password
            </a>
            <form action={logout}>
              <button className="rounded-md border border-white/25 px-3 py-1.5 text-sm">Sign out</button>
            </form>
          </div>
        </div>
        <Nav role={user.role} extra={extra} />
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
