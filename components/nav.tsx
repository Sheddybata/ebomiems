"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

const LINKS: Record<Role, { href: string; label: string }[]> = {
  admin: [
    { href: "/admin", label: "Command" },
    { href: "/bursar", label: "Bursary" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/enrol", label: "Enrol" },
    { href: "/admin/results", label: "Results" },
    { href: "/admin/classes", label: "Classes" },
    { href: "/admin/subjects", label: "Subjects" },
    { href: "/admin/sessions", label: "Sessions" },
    { href: "/admin/staff", label: "Staff" },
    { href: "/admin/enquiries", label: "Front door" },
    { href: "/admin/settings", label: "Settings" },
  ],
  bursar: [
    { href: "/bursar", label: "Overview" },
    { href: "/bursar/schedules", label: "Schedules" },
    { href: "/bursar/invoices", label: "Invoices" },
    { href: "/bursar/proofs", label: "Proofs" },
    { href: "/bursar/collect", label: "Collect" },
    { href: "/bursar/debtors", label: "Debtors" },
  ],
  teacher: [{ href: "/teacher", label: "My desk" }],
  parent: [
    { href: "/parent", label: "Family" },
    { href: "/parent/notices", label: "Noticeboard" },
  ],
};

function isActive(pathname: string, href: string, role: Role): boolean {
  if (href === "/admin" || href === "/teacher" || href === "/parent") return pathname === href;
  if (href === "/bursar") {
    if (role === "admin") return pathname === href || pathname.startsWith("/bursar/");
    return pathname === "/bursar";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ role, extra = [] }: { role: Role; extra?: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const links = [...LINKS[role], ...extra];
  return (
    <nav className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-2 py-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm ${isActive(pathname, link.href, role) ? "bg-white/10 text-gold-soft" : "text-paper/80 hover:bg-white/5"}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Tabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="no-print mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-3 py-1 text-sm ${pathname === item.href ? "bg-moss text-white" : "bg-card text-muted ring-1 ring-line"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
