import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

let state: "idle" | "busy" | "ready" = "idle";

function isBusy(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "errcode" in error && (error as { errcode?: number }).errcode === 5);
}

function pause(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function boot(): void {
  if (state !== "idle") return;
  state = "busy";
  try {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        migrate();
        seedIfEmpty();
        state = "ready";
        return;
      } catch (error) {
        if (!isBusy(error) || attempt === 7) throw error;
        pause(150 * (attempt + 1));
      }
    }
  } catch (error) {
    state = "idle";
    throw error;
  }
}
