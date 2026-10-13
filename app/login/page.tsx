import { redirect } from "next/navigation";
import { PublicFrame } from "@/components/public-frame";
import { Banner, inputClass, labelClass } from "@/components/ui";
import { login } from "@/lib/actions";
import { getUser, homeFor } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await getUser();
  if (user) redirect(homeFor(user.role));
  const query = await searchParams;
  return (
    <PublicFrame paths={false}>
      <main className="mx-auto max-w-md px-4 py-12">
        <form action={login} className="rounded-lg border border-line bg-card p-6">
          <h1 className="font-serif text-3xl text-moss">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Parents and staff. Use the email or mobile number on the account. Learners do not have a login. A new family applies first; this door opens after the school enrols the child.</p>
          <Banner error={query.error} />
          <label className={`mt-4 ${labelClass}`} htmlFor="identity">Email or phone</label>
          <input id="identity" name="identity" autoComplete="username" className={inputClass} required />
          <label className={`mt-3 ${labelClass}`} htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} required />
          <button className="mt-4 rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white">Sign in</button>
        </form>
      </main>
    </PublicFrame>
  );
}
