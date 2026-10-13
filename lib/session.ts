import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";

export const SESSION_COOKIE = "ebomi_session";
export const FLASH_COOKIE = "ebomi_flash";
export const CHECK_COOKIE = "ebomi_check";

function secret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const file = path.join(process.cwd(), "data", "secret");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, randomBytes(32).toString("hex"), { mode: 0o600 });
  return fs.readFileSync(file, "utf8");
}

export function mintToken(userId: number, ttlMs = 1000 * 60 * 60 * 24 * 14): string {
  const exp = Date.now() + ttlMs;
  const body = `${userId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readToken(token: string | undefined | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const expected = createHmac("sha256", secret()).update(`${id}.${exp}`).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(exp) < Date.now()) return null;
  const userId = Number(id);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}
