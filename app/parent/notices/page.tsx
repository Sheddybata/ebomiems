import { Banner, PageTitle } from "@/components/ui";
import { markNoticesRead } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { noticesFor } from "@/lib/repo";

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const user = await requireUser("parent");
  const query = await searchParams;
  const notices = (await noticesFor(user.id));
  return (
    <div>
      <PageTitle title="Noticeboard" lede="A new child brings a welcome note, with the admission number, result PIN and this term’s bill.">
        <form action={markNoticesRead}><button className="rounded-md border border-line bg-card px-3 py-2 text-sm font-semibold">Mark all read</button></form>
      </PageTitle>
      <Banner ok={query.ok} />
      <div className="space-y-3">
        {notices.map((notice) => (
          <article key={notice.id} className="rounded-lg border border-line bg-card p-4 text-sm leading-6">
            <p className="font-semibold">{notice.title} {!notice.read_at ? <span className="text-gold">· New</span> : null}</p>
            <p className="text-xs text-muted">{formatWhen(notice.created_at)}</p>
            <p className="mt-1">{notice.body}</p>
          </article>
        ))}
        {notices.length === 0 ? <p className="text-sm text-muted">No notices yet.</p> : null}
      </div>
    </div>
  );
}
