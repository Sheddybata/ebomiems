"use client";

import { useEffect, useState } from "react";
import { addStaff, removeStaff, saveStaff } from "@/lib/actions";
import { inputClass, labelClass } from "@/components/ui";

export type StaffPerson = { id: number; name: string; email: string; phone: string; role: string; designation: string; classes: string; canChange: boolean; phoneLabel: string };

export function StaffDesk({ people, initialEdit }: { people: StaffPerson[]; initialEdit?: StaffPerson }) {
  const [editing, setEditing] = useState<StaffPerson | null>(initialEdit ?? null);
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-line bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="w-28">Designation</th>
              <th>Class</th>
              <th>Email</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-t border-line">
                <td className="px-3 py-2 font-semibold">{person.name}</td>
                <td>{person.designation}</td>
                <td>{person.classes}</td>
                <td>{person.email}</td>
                <td>{person.phoneLabel}</td>
                <td className="px-3 py-2">
                  {person.canChange ? (
                    <div className="flex flex-wrap gap-3">
                      <button type="button" className="text-sm font-semibold text-moss" onClick={() => setEditing(person)}>
                        Edit
                      </button>
                      <form action={removeStaff}>
                        <input type="hidden" name="id" value={person.id} />
                        <button className="text-sm font-semibold text-clay">Remove</button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-muted">Principal</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? <StaffDialog person={editing} onClose={() => setEditing(null)} /> : null}
    </>
  );
}

function StaffDialog({ person, onClose }: { person: StaffPerson; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-card p-4 shadow-none" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="staff-edit-title">
        <StaffFields person={person} onClose={onClose} />
      </div>
    </div>
  );
}

export function StaffForm() {
  return (
    <div className="mt-6 max-w-xl rounded-lg border border-line bg-card p-4">
      <StaffFields />
    </div>
  );
}

function StaffFields({ person, onClose }: { person?: StaffPerson; onClose?: () => void }) {
  const [password, setPassword] = useState("");
  const editing = Boolean(person);
  const ready = editing ? password.length === 0 || password.length >= 8 : password.length >= 8;
  return (
    <form action={editing ? saveStaff : addStaff} className="grid gap-3">
      {person ? <input type="hidden" name="id" value={person.id} /> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="staff-edit-title" className="font-serif text-xl text-moss">{editing ? `Edit ${person?.name}` : "Add staff"}</h2>
          <p className="mt-1 text-sm text-muted">{editing ? "Leave the password blank to keep the current one." : "Use this for a new teacher or bursar. Add secondary teachers here when the school sends the names, then assign the class under Classes."}</p>
        </div>
        {onClose ? (
          <button type="button" className="text-sm font-semibold text-muted" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
      <label className="text-sm"><span className={labelClass}>Name</span><input name="name" defaultValue={person?.name} className={inputClass} required /></label>
      <label className="text-sm"><span className={labelClass}>Email</span><input name="email" type="email" defaultValue={person?.email} className={inputClass} required /></label>
      <label className="text-sm"><span className={labelClass}>Phone</span><input name="phone" defaultValue={person?.phone} className={inputClass} /></label>
      <label className="text-sm">
        <span className={labelClass}>Desk</span>
        <select name="role" defaultValue={person?.role || "teacher"} className={inputClass}>
          <option value="teacher">Teacher</option>
          <option value="bursar">Bursar</option>
        </select>
      </label>
      <label className="text-sm">
        <span className={labelClass}>{editing ? "New password (optional)" : "Starting password"}</span>
        <input name="password" type="text" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} required={!editing} />
      </label>
      <p className={`text-sm ${ready ? "text-leaf" : "text-clay"}`}>{ready ? (password ? "Password length is fine." : editing ? "The current password will be kept." : "Password length is fine.") : "Use at least 8 characters for the password."}</p>
      <div className="flex flex-wrap gap-2">
        <button disabled={!ready} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{editing ? "Save staff" : "Create account"}</button>
        {onClose ? (
          <button type="button" className="rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={onClose}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
