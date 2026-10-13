import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

let state: "idle" | "busy" | "ready" = "idle";

function isBusy(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "errcode" in error && (error as { errcode?: number }).errcode === 5);
}

export function boot(): void {
  if (state !== "idle") return;
  state = "busy";
  try {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        migrate();
        seedIfEmpty();
        state = "ready";
        return;
      } catch (error) {
        if (!isBusy(error) || attempt === 3) throw error;
      }
    }
  } catch (error) {
    state = "idle";
    throw error;
  }
}
