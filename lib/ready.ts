import { migrate } from "./db";
import { seedIfEmpty } from "./seed";

let pending: Promise<void> | null = null;
let seeding = false;

export function isSeeding(): boolean {
  return seeding;
}

export async function boot(): Promise<void> {
  if (!pending) {
    pending = (async () => {
      seeding = true;
      try {
        await migrate();
        await seedIfEmpty();
      } finally {
        seeding = false;
      }
    })().catch((error) => {
      pending = null;
      console.error("EBOMI boot failed", error);
      throw error;
    });
  }
  await pending;
}
