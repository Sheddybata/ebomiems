import { AsyncLocalStorage } from "node:async_hooks";
import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

const insideBoot = new AsyncLocalStorage<boolean>();
let pending: Promise<void> | null = null;

export function isSeeding(): boolean {
  return insideBoot.getStore() === true;
}

export async function boot(): Promise<void> {
  if (!pending) {
    pending = insideBoot
      .run(true, async () => {
        await migrate();
        await seedIfEmpty();
      })
      .catch((error) => {
        pending = null;
        console.error("EBOMI boot failed", error);
        throw error;
      });
  }
  await pending;
}
