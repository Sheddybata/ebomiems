import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "./db";
import { normalizePhone } from "./format";
import { verifyPassword } from "./password";
import { boot } from "./ready";
import { SESSION_COOKIE, mintToken, readToken } from "./session";
import type { Role, SessionUser } from "./types";

export function homeFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "bursar") return "/bursar";
  if (role === "teacher") return "/teacher";
  return "/parent";
}

export async function getUser(): Promise<SessionUser | null> {
  (await boot());
  const jar = await cookies();
  const id = readToken(jar.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return (await one<SessionUser>("SELECT id, role, name, email, phone FROM users WHERE id=?", id)) ?? null;
}

export async function requireUser(...roles: Role[]): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  const allowed = roles.length === 0 || roles.includes(user.role) || (user.role === "admin" && roles.includes("bursar"));
  if (!allowed) redirect(homeFor(user.role));
  return user;
}

export async function matchLogin(identity: string): Promise<(SessionUser & { password_hash: string }) | undefined> {
  const trimmed = identity.trim();
  if (!trimmed) return undefined;
  if (trimmed.includes("@")) {
    return (await one("SELECT id, role, name, email, phone, password_hash FROM users WHERE lower(email)=?", trimmed.toLowerCase()));
  }
  const phone = normalizePhone(trimmed);
  if (!phone) return undefined;
  return (await one("SELECT id, role, name, email, phone, password_hash FROM users WHERE phone=?", phone));
}

export function passwordMatches(password: string, hash: string): boolean {
  return verifyPassword(password, hash);
}

export async function startSession(userId: number): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, mintToken(userId), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 14 });
}
