import { migrate } from "../lib/db";
import { emptySchool, seedSchool } from "../lib/seed";

migrate();
emptySchool();
seedSchool();
console.log("School copy reset. Demo pupils, bills and enquiries are gone.");
