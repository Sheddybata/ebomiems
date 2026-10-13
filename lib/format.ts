export function classLabel(name: string, arm: string): string {
  return arm ? `${name} ${arm}` : name;
}

export function personName(person: { first_name: string; other_name?: string | null; last_name: string }): string {
  return [person.first_name, person.other_name, person.last_name].filter(Boolean).join(" ");
}

export function termTitle(name: string, session: string): string {
  return `${name} Term · ${session}`;
}

export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function ageOn(dob: string | null, on: string): number | null {
  if (!dob) return null;
  const born = new Date(dob + "T00:00:00Z");
  const at = new Date(on + "T00:00:00Z");
  if (Number.isNaN(born.getTime()) || Number.isNaN(at.getTime())) return null;
  let age = at.getUTCFullYear() - born.getUTCFullYear();
  const month = at.getUTCMonth() - born.getUTCMonth();
  if (month < 0 || (month === 0 && at.getUTCDate() < born.getUTCDate())) age -= 1;
  return age;
}

export function isRecentAdmission(admittedOn: string, today = todayISO()): boolean {
  const then = new Date(admittedOn + "T00:00:00Z").getTime();
  const now = new Date(today + "T00:00:00Z").getTime();
  const days = (now - then) / 86_400_000;
  return days >= 0 && days <= 14;
}

export function normalizePhone(raw: string): string | null {
  let digits = raw.trim().replace(/[\s()-]/g, "");
  if (digits.startsWith("+234")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("234") && digits.length === 13) digits = "0" + digits.slice(3);
  if (!/^0\d{10}$/.test(digits)) return null;
  return digits;
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
}

export function resultMessage(state: "unpublished" | "held" | "none", audience: "public" | "parent"): string {
  if (state === "held") {
    return audience === "public"
      ? "This result has been published, but the school is holding the official sheet until the fees for that term are cleared."
      : "The official report for this term is published, but it stays held until that term’s fees are cleared. Money paid against a later term does not reopen a term that is still owing, and a new term’s bill does not hide a term that was already paid.";
  }
  if (state === "none") return "There is no result on file for this selection.";
  return "This result has not been published. Parents see continuous assessment during the term. The official sheet appears only after the principal locks, approves and publishes it.";
}

export const TRACK_LABELS: Record<string, string> = {
  creche: "Creche",
  nursery: "Nursery",
  primary: "Primary",
  jss: "Junior Secondary",
  sss: "Senior Secondary",
  sss_science: "SSS Science",
  sss_arts: "SSS Arts",
  sss_commercial: "SSS Commercial",
};

export const SUBJECT_TRACKS = ["creche", "nursery", "primary", "jss", "sss_science", "sss_arts", "sss_commercial"] as const;
