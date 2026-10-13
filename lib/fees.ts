export type LedgerEntry = {
  id: number;
  term_id: number | null;
  direction: "debit" | "credit";
  amount_kobo: number;
  created_at: string;
};

function byAge(a: LedgerEntry, b: LedgerEntry): number {
  if (a.created_at !== b.created_at) return a.created_at < b.created_at ? -1 : 1;
  return a.id - b.id;
}

export function balanceOf(entries: LedgerEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.direction === "debit" ? entry.amount_kobo : -entry.amount_kobo), 0);
}

export function termCoverage(entries: LedgerEntry[]): Map<number, { charged: number; covered: number }> {
  const debits = entries.filter((entry) => entry.direction === "debit").sort(byAge);
  let pool = entries.filter((entry) => entry.direction === "credit").reduce((sum, entry) => sum + entry.amount_kobo, 0);
  const map = new Map<number, { charged: number; covered: number }>();
  for (const debit of debits) {
    const covered = Math.min(pool, debit.amount_kobo);
    pool -= covered;
    const key = debit.term_id ?? 0;
    const current = map.get(key) ?? { charged: 0, covered: 0 };
    current.charged += debit.amount_kobo;
    current.covered += covered;
    map.set(key, current);
  }
  return map;
}

export function termIsClear(entries: LedgerEntry[], termId: number): boolean {
  const row = termCoverage(entries).get(termId);
  if (!row || row.charged === 0) return true;
  return row.covered >= row.charged;
}
