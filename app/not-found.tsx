import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl text-moss">That page is not on the register</h1>
      <p className="mt-2 text-sm text-muted">The link may be old, or the record is not on your account.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-moss underline">
        School home
      </Link>
    </main>
  );
}
