import { Banner, PageTitle, inputClass, labelClass } from "@/components/ui";
import { Shell } from "@/components/shell";
import { changePassword } from "@/lib/actions";
import { requireUser } from "@/lib/auth";

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  return (
    <Shell user={user}>
      <PageTitle title="Password" lede="This changes the password for the account you are signed in with." />
      <Banner error={query.error} ok={query.ok} />
      <form action={changePassword} className="grid max-w-md gap-3">
        <label className="text-sm"><span className={labelClass}>Current password</span><input name="current" type="password" autoComplete="current-password" required className={inputClass} /></label>
        <label className="text-sm"><span className={labelClass}>New password</span><input name="next" type="password" autoComplete="new-password" required minLength={8} className={inputClass} /></label>
        <button className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white">Change password</button>
      </form>
    </Shell>
  );
}
