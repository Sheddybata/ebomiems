import { cookies } from "next/headers";
import { FLASH_COOKIE } from "./session";

export async function setFlash(data: Record<string, string>): Promise<void> {
  const jar = await cookies();
  jar.set(FLASH_COOKIE, JSON.stringify(data), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 180 });
}

export async function takeFlash(): Promise<Record<string, string> | null> {
  const jar = await cookies();
  const raw = jar.get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  jar.delete(FLASH_COOKIE);
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}
