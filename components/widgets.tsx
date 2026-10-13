"use client";

import { useState } from "react";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" className="no-print rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white" onClick={() => window.print()}>
      {label}
    </button>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function CommentField({ name, defaultValue, suggestions }: { name: string; defaultValue: string; suggestions: string[] }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((text) => (
          <button key={text} type="button" className="max-w-full rounded-full border border-line bg-paper px-2 py-1 text-left text-xs text-muted" onClick={() => setValue(text)}>
            {text}
          </button>
        ))}
      </div>
      <textarea name={name} value={value} onChange={(event) => setValue(event.target.value)} rows={3} className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm" />
    </div>
  );
}
