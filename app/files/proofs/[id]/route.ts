import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getProof } from "@/lib/repo";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return new NextResponse("Sign in required.", { status: 401 });
  const { id } = await context.params;
  const proof = getProof(Number(id));
  if (!proof?.file_path) return new NextResponse("Not found.", { status: 404 });
  const staff = user.role === "admin" || user.role === "bursar";
  const owner = user.role === "parent" && proof.parent_id === user.id;
  if (!staff && !owner) return new NextResponse("Not found.", { status: 404 });
  const root = path.resolve(process.cwd(), "data", "proofs");
  const abs = path.resolve(process.cwd(), "data", proof.file_path);
  const relative = path.relative(root, abs);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return new NextResponse("Not found.", { status: 404 });
  if (!fs.existsSync(abs)) return new NextResponse("Not found.", { status: 404 });
  const body = fs.readFileSync(abs);
  return new NextResponse(body, {
    headers: {
      "Content-Type": proof.content_type || "application/octet-stream",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
