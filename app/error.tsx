"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <h1 className="font-serif text-3xl text-moss">This page did not load</h1>
      <p className="mt-2 text-sm text-muted">Go back and try the action again. If it keeps failing, the office can reload the school home.</p>
      <button className="mt-4 rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
