import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

let pending: Promise<void> | null = null;

function isBusy(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "errcode" in error && (error as { errcode?: number }).errcode === 5);
}

function pause(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function start(): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      await migrate();
      await seedIfEmpty();
      return;
    } catch (error) {
      if (!isBusy(error) || attempt === 7) throw error;
      pause(150 * (attempt + 1));
    }
  }
}

export async function boot(): Promise<void> {
  if (!pending) {
    pending = start().catch((error) => {
      pending = null;
      throw error;
    });
  }
  await pending;
}
