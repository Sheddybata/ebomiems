"use client";

import { useState } from "react";

const MARKS = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
] as const;

export function RegisterMark({
  pupils,
  marks,
}: {
  pupils: { id: number; name: string }[];
  marks: Record<number, string>;
}) {
  const [chosen, setChosen] = useState<Record<number, string>>(marks);
  return (
    <ul>
      {pupils.map((pupil) => {
        const status = chosen[pupil.id] || "";
        const row = status === "absent" ? "bg-clay-soft" : status === "late" ? "bg-gold-soft" : "";
        return (
          <li key={pupil.id} className={`border-t border-line px-3 py-2 ${row}`}>
            <p className="font-medium">{pupil.name}</p>
            <div className="mt-2 grid grid-cols-3 gap-1">
                {MARKS.map((mark) => (
                  <label key={mark.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`status_${pupil.id}`}
                      value={mark.value}
                      checked={status === mark.value}
                      onChange={() => setChosen((current) => ({ ...current, [pupil.id]: mark.value }))}
                      className="peer sr-only"
                    />
                    <span
                      className={`block rounded-full px-2 py-1 text-center text-xs font-semibold ring-1 ring-line peer-checked:text-white ${
                        mark.value === "absent"
                          ? "peer-checked:bg-clay peer-checked:ring-clay"
                          : mark.value === "late"
                            ? "peer-checked:bg-leaf peer-checked:ring-leaf"
                            : "peer-checked:bg-moss peer-checked:ring-moss"
                      }`}
                    >
                      {mark.label}
                    </span>
                  </label>
                ))}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
