import fs from "fs";
import os from "os";
import path from "path";
import { gradeScore, ordinal } from "../lib/grading";
import { balanceOf, termIsClear, type LedgerEntry } from "../lib/fees";

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

async function main(): Promise<void> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ebomi-"));
  process.env.EBOMI_DB = path.join(dir, "school.sqlite");
  const { boot } = await import("../lib/ready");
  boot();
  const repo = await import("../lib/repo");
  const mutate = await import("../lib/mutate");
  const { closeDb } = await import("../lib/db");
  const { OFFICE, SCHOOL } = await import("../lib/office");

  try {
    assert(gradeScore("primary", 70).grade === "A", "70 is A");
    assert(gradeScore("primary", 69).grade === "B", "69 is B");
    assert(gradeScore("waec", 75).grade === "A1", "75 is A1");
    assert(ordinal(1) === "1st" && ordinal(11) === "11th", "ordinals");

    const entries: LedgerEntry[] = [
      { id: 1, term_id: 1, direction: "debit", amount_kobo: 100, created_at: "2026-04-01" },
      { id: 2, term_id: 1, direction: "credit", amount_kobo: 100, created_at: "2026-05-01" },
      { id: 3, term_id: 2, direction: "debit", amount_kobo: 100, created_at: "2026-09-01" },
      { id: 4, term_id: 2, direction: "credit", amount_kobo: 40, created_at: "2026-09-15" },
    ];
    assert(termIsClear(entries, 1), "paid term stays clear");
    assert(!termIsClear(entries, 2), "partial term is not clear");
    assert(balanceOf(entries) === 60, "balance");

    const settings = repo.getSettings();
    assert(settings.email === SCHOOL.email, "school email");
    assert(settings.school_name === SCHOOL.name, "school name");
    const staff = repo.listStaff();
    assert(staff.some((person) => person.email === OFFICE.admin.email), "principal login");
    assert(staff.some((person) => person.email === OFFICE.bursar.email), "bursar login");
    assert(repo.searchPupils("").length === 0, "no demo pupils");
    assert(repo.listClasses().some((klass) => klass.name === "Nursery 3"), "Nursery 3");
    assert(repo.listClasses().some((klass) => klass.name === "Primary 6" && !klass.form_teacher_id), "P6 waits for a teacher");
    assert(repo.currentTerm().name === "First", "First term");
    assert(repo.feeItems().length === 0, "no sample fees");

    mutate.addFeeItem("primary", "Tuition", 1_000_000);
    const primary4 = repo.listClasses().find((klass) => klass.name === "Primary 4")!;
    const enrolled = mutate.enrolStudent({
      firstName: "Ada",
      lastName: "Test",
      otherName: "",
      gender: "Female",
      dob: "2018-01-01",
      classId: primary4.id,
      parentId: null,
      parentName: "Bisi Test",
      parentPhone: "08039990001",
      parentEmail: "bisi.test@mail.com",
      actorId: 1,
      previousSchool: "",
      leavingReason: "",
      previousClass: "",
      previousPosition: "",
    });
    assert(/^EBM\/P4\/\d{3}$/.test(enrolled.admissionNo), enrolled.admissionNo);
    const created = repo.getPupil(enrolled.studentId)!;
    assert(created.balance_kobo === 1_000_000, "bill follows the schedule");
    mutate.recordPayment(created.id, created.balance_kobo, "cash", 1);
    assert(repo.getPupil(created.id)!.balance_kobo === 0, "cleared");

    console.log("All checks passed.");
  } finally {
    closeDb();
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
