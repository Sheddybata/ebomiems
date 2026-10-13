const ones = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];

const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function under1000(n: number): string {
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? "-" + ones[n % 10] : "");
  const rest = n % 100;
  return ones[Math.floor(n / 100)] + " hundred" + (rest ? " and " + under1000(rest) : "");
}

function integerWords(n: number): string {
  if (n === 0) return "zero";
  const parts: string[] = [];
  const million = Math.floor(n / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (million) parts.push(under1000(million) + " million");
  if (thousand) parts.push(under1000(thousand) + " thousand");
  if (rest) parts.push(under1000(rest));
  return parts.join(" ");
}

export function formatNaira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const abs = Math.abs(Math.round(kobo));
  const naira = Math.floor(abs / 100);
  const rem = abs % 100;
  return `${sign}₦${naira.toLocaleString("en-NG")}.${String(rem).padStart(2, "0")}`;
}

export function nairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[,₦\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [naira, kobo = ""] = cleaned.split(".");
  const value = Number(naira) * 100 + Number((kobo + "00").slice(0, 2));
  if (!Number.isSafeInteger(value)) return null;
  return value;
}

export function nairaWords(kobo: number): string {
  const abs = Math.abs(Math.round(kobo));
  const naira = Math.floor(abs / 100);
  const rem = abs % 100;
  const sign = kobo < 0 ? "minus " : "";
  const body = `${sign}${integerWords(naira)} naira${rem ? ` and ${rem} kobo` : " only"}`;
  return body.charAt(0).toUpperCase() + body.slice(1);
}
