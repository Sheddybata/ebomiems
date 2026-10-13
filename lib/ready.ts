import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

let pending: Promise<void> | null = null;

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "errcode" in error && (error as { errcode?: number }).errcode === 5) {
    return true;
  }
  const code = error && typeof error === "object" && "code" in error ? String((error as { code?: string }).code) : "";
  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "57014", "57P01", "53300"].includes(code)) {
    return true;
  }
  const message = String(error);
  return /timeout|terminat|too many clients|connection.*refused|server closed/i.test(message);
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start(): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await migrate();
      await seedIfEmpty();
      return;
    } catch (error) {
      if (!isRetryable(error) || attempt === 7) throw error;
      await pause(150 * (attempt + 1));
    }
  }
}

export async function boot(): Promise<void> {
  if (!pending) {
    pending = start().catch((error) => {
      pending = null;
      console.error("EBOMI boot failed", error);
      throw error;
    });
  }
  await pending;
}
