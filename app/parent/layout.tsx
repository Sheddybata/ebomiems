import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("parent");
  return <Shell user={user}>{children}</Shell>;
}
