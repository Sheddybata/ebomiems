import type { Assessment, Scale } from "./types";

export function assessmentOf(track: string): Assessment {
  if (track === "creche" || track === "nursery") return { kind: "qualitative" };
  if (track === "primary") return { kind: "numeric", scale: "primary", caMax: 40, examMax: 60 };
  return { kind: "numeric", scale: "waec", caMax: 30, examMax: 70 };
}

export function feeTrack(track: string): string {
  if (track.startsWith("sss")) return "sss";
  return track;
}

export function gradeScore(scale: Scale, total: number): { grade: string; remark: string } {
  if (scale === "primary") {
    if (total >= 70) return { grade: "A", remark: "Excellent" };
    if (total >= 60) return { grade: "B", remark: "Very Good" };
    if (total >= 50) return { grade: "C", remark: "Good" };
    if (total >= 45) return { grade: "D", remark: "Fair" };
    if (total >= 40) return { grade: "E", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  }
  if (total >= 75) return { grade: "A1", remark: "Excellent" };
  if (total >= 70) return { grade: "B2", remark: "Very Good" };
  if (total >= 65) return { grade: "B3", remark: "Good" };
  if (total >= 60) return { grade: "C4", remark: "Credit" };
  if (total >= 55) return { grade: "C5", remark: "Credit" };
  if (total >= 50) return { grade: "C6", remark: "Credit" };
  if (total >= 45) return { grade: "D7", remark: "Pass" };
  if (total >= 40) return { grade: "E8", remark: "Pass" };
  return { grade: "F9", remark: "Fail" };
}

export const PRIMARY_SCALE = [
  ["A", "70–100", "Excellent"],
  ["B", "60–69", "Very Good"],
  ["C", "50–59", "Good"],
  ["D", "45–49", "Fair"],
  ["E", "40–44", "Pass"],
  ["F", "0–39", "Fail"],
];

export const WAEC_SCALE = [
  ["A1", "75–100", "Excellent"],
  ["B2", "70–74", "Very Good"],
  ["B3", "65–69", "Good"],
  ["C4", "60–64", "Credit"],
  ["C5", "55–59", "Credit"],
  ["C6", "50–54", "Credit"],
  ["D7", "45–49", "Pass"],
  ["E8", "40–44", "Pass"],
  ["F9", "0–39", "Fail"],
];

export const QUALITATIVE = [
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very Good" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "needs_improvement", label: "Needs Improvement" },
] as const;

export function qualitativeLabel(value: string | null | undefined): string {
  return QUALITATIVE.find((item) => item.value === value)?.label ?? "—";
}

export const AFFECTIVE = [
  "Punctuality",
  "Neatness",
  "Politeness",
  "Honesty",
  "Attentiveness",
  "Perseverance",
  "Relationship with others",
];

export const PSYCHOMOTOR = [
  "Handwriting",
  "Verbal fluency",
  "Games and sports",
  "Handling of tools",
  "Drawing and painting",
  "Musical skills",
];

export const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

export function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

export function rankBy(rows: { id: number; score: number }[]): Map<number, number> {
  const sorted = [...rows].sort((a, b) => b.score - a.score || a.id - b.id);
  const map = new Map<number, number>();
  let lastScore = Number.POSITIVE_INFINITY;
  let lastPos = 0;
  sorted.forEach((row, index) => {
    const pos = row.score === lastScore ? lastPos : index + 1;
    lastScore = row.score;
    lastPos = pos;
    map.set(row.id, pos);
  });
  return map;
}

export function percent(done: number, total: number): number {
  if (total <= 0) return 100;
  return Math.round((done / total) * 100);
}

export const COMMENT_BANK = {
  early: [
    "A cheerful child who joins activities willingly. Keep the stories and play going at home.",
    "Settling well. Please keep the same routines for sleep, reading and sharing.",
    "Needs a little more encouragement with instructions and playing with others.",
  ],
  high: [
    "An excellent term. Keep up this standard.",
    "A hardworking learner who takes part well in class. Well done.",
    "Very good effort across the subjects. Maintain it.",
  ],
  mid: [
    "A fair result. You are capable of more if you stay consistent.",
    "Satisfactory work. Give more time to practice at home.",
    "Steady progress. Please do not relax next term.",
  ],
  low: [
    "This result is below expectation. Closer supervision at home will help.",
    "More effort is needed in classwork and assignments.",
    "A weak term. Please see the form teacher so we can plan support.",
  ],
};

export function commentBand(kind: "qualitative" | "numeric", projected: number | null): string[] {
  if (kind === "qualitative") return COMMENT_BANK.early;
  if (projected == null) return [...COMMENT_BANK.mid, ...COMMENT_BANK.high, ...COMMENT_BANK.low];
  if (projected >= 70) return COMMENT_BANK.high;
  if (projected >= 50) return COMMENT_BANK.mid;
  return COMMENT_BANK.low;
}

export function principalRemarkFor(average: number): string {
  if (average >= 75) return "Excellent performance. Keep it up.";
  if (average >= 65) return "A very good result. Maintain the standard.";
  if (average >= 55) return "A good result. You can still do better.";
  if (average >= 50) return "A fair result. More effort is required.";
  if (average >= 40) return "A weak result. Sit up next term.";
  return "This result is below expectation. Please see the form teacher.";
}

export function splitTotal(total: number, caMax: number, examMax: number): { ca: number; exam: number } {
  let ca = Math.round((total * caMax) / 100);
  ca = Math.max(0, Math.min(caMax, ca));
  let exam = total - ca;
  if (exam < 0) exam = 0;
  if (exam > examMax) {
    exam = examMax;
    ca = Math.max(0, Math.min(caMax, total - exam));
  }
  return { ca, exam };
}
