import path from "path";
import { migrate } from "../lib/db";
import { emptySchool, seedSchool } from "../lib/seed";

process.env.EBOMI_DB = process.env.EBOMI_DB || path.join(process.cwd(), "data", "ebomi.sqlite");

async function main(): Promise<void> {
  await migrate();
  await emptySchool();
  await seedSchool();
  console.log("School copy reset. Demo pupils, bills and enquiries are gone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
