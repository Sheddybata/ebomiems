import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";

const extra = [
  { href: "/bursar/schedules", label: "Schedules" },
  { href: "/bursar/invoices", label: "Invoices" },
  { href: "/bursar/proofs", label: "Proofs" },
  { href: "/bursar/collect", label: "Collect" },
  { href: "/bursar/debtors", label: "Debtors" },
];

export default async function BursarLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("bursar");
  return (
    <Shell user={user} extra={user.role === "admin" ? extra : undefined}>
      {children}
    </Shell>
  );
}
