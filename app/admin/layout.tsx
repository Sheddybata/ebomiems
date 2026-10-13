import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return <Shell user={user}>{children}</Shell>;
}
