import { one, run, rows, withTx } from "./db";
import { balanceOf } from "./fees";
import { classLabel, normalizePhone, termTitle, todayISO } from "./format";
import { AFFECTIVE, PSYCHOMOTOR, QUALITATIVE, assessmentOf } from "./grading";
import { formatNaira } from "./money";
import { hashPassword, temporaryPassword } from "./password";
import { SCHOOL } from "./office";
import * as repo from "./repo";
import { SchoolError } from "./types";

const QUAL = new Set<string>(QUALITATIVE.map((item) => item.value));
const TRAITS = new Set([...AFFECTIVE, ...PSYCHOMOTOR]);

export async function nextCounter(name: string): Promise<number> {
  const row = (await one<{ value: number }>("SELECT value FROM counters WHERE name=?", name));
  const value = (row?.value ?? 0) + 1;
  if (row) (await run("UPDATE counters SET value=? WHERE name=?", value, name));
  else (await run("INSERT INTO counters (name, value) VALUES (?, ?)", name, value));
  return value;
}

export async function bumpCounter(name: string, to: number): Promise<void> {
  const row = (await one<{ value: number }>("SELECT value FROM counters WHERE name=?", name));
  const value = Math.max(row?.value ?? 0, to);
  if (row) (await run("UPDATE counters SET value=? WHERE name=?", value, name));
  else (await run("INSERT INTO counters (name, value) VALUES (?, ?)", name, value));
}

export async function notice(userId: number, title: string, body: string, studentId: number | null, createdAt: string): Promise<void> {
  (await run("INSERT INTO notices (user_id, title, body, student_id, created_at) VALUES (?,?,?,?,?)", userId, title, body, studentId, createdAt));
}

async function uniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const pin = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    if (!(await one("SELECT id FROM students WHERE pin=?", pin))) return pin;
  }
  throw new SchoolError("Could not issue a result PIN. Try again.");
}

export async function issueInvoiceRaw(studentId: number, termId: number, userId: number | null, issuedAt: string) {
  if ((await one("SELECT id FROM invoices WHERE student_id=? AND term_id=?", studentId, termId))) {
    throw new SchoolError("This learner already has a bill for that term.");
  }
  const pupil = (await repo.getPupil(studentId));
  if (!pupil) throw new SchoolError("Learner not found.");
  const items = (await repo.activeFeeItems(pupil.track));
  if (!items.length) throw new SchoolError("There is no fee schedule for this class yet.");
  const arrears = Math.max(0, balanceOf((await repo.ledgerOf(studentId))));
  const number = `INV/${issuedAt.slice(0, 4)}/${String(await nextCounter("invoice")).padStart(4, "0")}`;
  const invoiceId = (await run(
    "INSERT INTO invoices (number, student_id, term_id, arrears_kobo, issued_at, issued_by) VALUES (?,?,?,?,?,?)",
    number,
    studentId,
    termId,
    arrears,
    issuedAt,
    userId,
  )).lastInsertRowid;
  let total = 0;
  for (const [index, item] of items.entries()) {
    (await run("INSERT INTO invoice_lines (invoice_id, label, amount_kobo, sort_order) VALUES (?,?,?,?)", invoiceId, item.label, item.amount_kobo, index + 1));
    (await run(
      "INSERT INTO ledger (student_id, term_id, invoice_id, direction, amount_kobo, narration, created_at, created_by) VALUES (?,?,?,'debit',?,?,?,?)",
      studentId,
      termId,
      invoiceId,
      item.amount_kobo,
      item.label,
      issuedAt,
      userId,
    ));
    total += item.amount_kobo;
  }
  return { invoiceId, number, totalKobo: total, arrearsKobo: arrears };
}

export async function postPaymentRaw(input: {
  studentId: number;
  amountKobo: number;
  method: "cash" | "pos" | "transfer";
  narration: string;
  createdAt: string;
  userId: number | null;
  proofId?: number | null;
  termId?: number | null;
}) {
  if (input.amountKobo <= 0) throw new SchoolError("Enter an amount greater than zero.");
  const receipt = `RCP/${input.createdAt.slice(0, 4)}/${String(await nextCounter("receipt")).padStart(4, "0")}`;
  const ledgerId = (await run(
    `INSERT INTO ledger (student_id, term_id, direction, amount_kobo, method, receipt_no, narration, proof_id, created_at, created_by)
     VALUES (?,?,'credit',?,?,?,?,?,?,?)`,
    input.studentId,
    input.termId ?? null,
    input.amountKobo,
    input.method,
    receipt,
    input.narration,
    input.proofId ?? null,
    input.createdAt,
    input.userId,
  )).lastInsertRowid;
  return { ledgerId, receipt };
}

export async function enrolStudent(input: {
  firstName: string;
  lastName: string;
  otherName: string;
  gender: string;
  dob: string;
  classId: number;
  parentId: number | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  actorId: number;
  previousSchool: string;
  leavingReason: string;
  previousClass: string;
  previousPosition: string;
}) {
  return (await withTx(async () => {
    const klass = (await repo.getClass(input.classId));
    if (!klass) throw new SchoolError("Choose a class.");
    const first = input.firstName.trim();
    const last = input.lastName.trim();
    const other = input.otherName.trim();
    if (first.length < 2 || last.length < 2) throw new SchoolError("Enter the child's first and last name.");
    if (input.gender !== "Female" && input.gender !== "Male") throw new SchoolError("Choose Female or Male.");
    let parentId = input.parentId;
    let parentPassword: string | null = null;
    let parentName = "";
    if (parentId) {
      const parent = (await one<{ role: string; name: string }>("SELECT role, name FROM users WHERE id=?", parentId));
      if (!parent || parent.role !== "parent") throw new SchoolError("Choose an existing parent account.");
      parentName = parent.name;
    } else {
      parentName = input.parentName.trim();
      const phone = normalizePhone(input.parentPhone);
      const email = input.parentEmail.trim().toLowerCase();
      if (parentName.length < 3) throw new SchoolError("Enter the parent's name.");
      if (!phone) throw new SchoolError("Enter a valid Nigerian mobile number, for example 08031234567.");
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SchoolError("That email address does not look right.");
      if ((await one("SELECT id FROM users WHERE phone=?", phone))) {
        throw new SchoolError("A parent with this phone already has an account. Link that account instead of creating a new one.");
      }
      if (email && (await one("SELECT id FROM users WHERE lower(email)=?", email))) {
        throw new SchoolError("A parent with this email already has an account. Link that account instead.");
      }
      parentPassword = temporaryPassword();
      parentId = (await run(
        "INSERT INTO users (role, name, email, phone, password_hash, created_at) VALUES ('parent',?,?,?,?,?)",
        parentName,
        email || null,
        phone,
        hashPassword(parentPassword),
        new Date().toISOString(),
      )).lastInsertRowid;
    }
    const serial = (await nextCounter(`adm_${klass.level_code}`));
    const admission = `EBM/${klass.level_code}/${String(serial).padStart(3, "0")}`;
    const pin = (await uniquePin());
    const studentId = (await run(
      `INSERT INTO students (first_name, last_name, other_name, gender, dob, admission_no, pin, class_id, parent_id, admitted_on, status, previous_school, leaving_reason, previous_class, previous_position)
       VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?,?,?)`,
      first,
      last,
      other,
      input.gender,
      input.dob || null,
      admission,
      pin,
      klass.id,
      parentId,
      todayISO(),
      input.previousSchool.trim() || null,
      input.leavingReason.trim() || null,
      input.previousClass.trim() || null,
      input.previousPosition.trim() || null,
    )).lastInsertRowid;
    const term = (await repo.currentTerm());
    const now = new Date().toISOString();
    const bill = (await issueInvoiceRaw(studentId, term.id, input.actorId, now));
    const name = [first, other, last].filter(Boolean).join(" ");
    const label = classLabel(klass.name, klass.arm);
    const heading = termTitle(term.name, term.session_name);
    for (const bursar of (await rows<{ id: number }>("SELECT id FROM users WHERE role='bursar'"))) {
      (await notice(bursar.id, "New bill", `${name} (${admission}) joined ${label}. ${heading} fees of ${formatNaira(bill.totalKobo)} are on the ledger.`, studentId, now));
    }
    if (klass.form_teacher_id) {
      (await notice(klass.form_teacher_id, "New pupil", `${name} (${admission}) is now on the ${label} register.`, studentId, now));
    }
    (await notice(
      parentId!,
      `Welcome to ${SCHOOL.name}`,
      `${name} has been admitted into ${label}. Admission number ${admission}. Result PIN ${pin}. ${first} does not get a separate login. Use the PIN on the result checker, and sign in here for continuous assessment, fees and attendance. The ${heading} bill is on the fees page. A bank transfer stays a request until the bursar approves it.`,
      studentId,
      now,
    ));
    return { studentId, admissionNo: admission, pin, parentPassword, parentName, classLabel: label, bill };
  }));
}

export async function resetPin(studentId: number): Promise<string> {
  return (await withTx(async () => {
    const pupil = (await repo.getPupil(studentId));
    if (!pupil) throw new SchoolError("Learner not found.");
    const pin = (await uniquePin());
    (await run("UPDATE students SET pin=? WHERE id=?", pin, studentId));
    (await notice(pupil.parent_id, "Result PIN reset", `A new result PIN for ${pupil.first_name} ${pupil.last_name} is ${pin}. The previous PIN no longer works.`, studentId, new Date().toISOString()));
    return pin;
  }));
}

export async function updateStudent(studentId: number, classId: number, status: string): Promise<void> {
  (await withTx(async () => {
    const pupil = (await repo.getPupil(studentId));
    const klass = (await repo.getClass(classId));
    if (!pupil || !klass) throw new SchoolError("Learner or class not found.");
    if (status !== "active" && status !== "withdrawn") throw new SchoolError("Choose a valid status.");
    (await run("UPDATE students SET class_id=?, status=? WHERE id=?", classId, status, studentId));
    (await run("UPDATE scores SET class_id=? WHERE student_id=? AND term_id=?", classId, studentId, (await repo.currentTerm()).id));
  }));
}

export async function savePrincipalRemark(studentId: number, termId: number, text: string): Promise<void> {
  const classId = (await repo.classForTerm(studentId, termId)) ?? (await repo.getPupil(studentId))?.class_id;
  if (!classId) throw new SchoolError("Learner not found.");
  if ((await repo.releaseOf(classId, termId)).status === "published") throw new SchoolError("Unpublish the result before changing the principal's remark.");
  const existing = (await one<{ form_comment: string }>("SELECT form_comment FROM remarks WHERE student_id=? AND term_id=?", studentId, termId));
  (await run(
    `INSERT INTO remarks (student_id, term_id, form_comment, principal_remark) VALUES (?,?,?,?)
     ON CONFLICT(student_id, term_id) DO UPDATE SET principal_remark=excluded.principal_remark`,
    studentId,
    termId,
    existing?.form_comment ?? "",
    text.trim(),
  ));
}

export async function saveSettings(input: {
  schoolName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  reportLock: boolean;
}): Promise<void> {
  if (!input.schoolName.trim() || !input.principalName.trim() || !input.bankName.trim() || !input.accountNumber.trim()) {
    throw new SchoolError("School name, principal, bank and account number are required.");
  }
  (await run(
    `UPDATE settings SET school_name=?, motto=?, address=?, phone=?, email=?, principal_name=?, bank_name=?, account_name=?, account_number=?, report_lock=? WHERE id=1`,
    input.schoolName.trim(),
    input.motto.trim(),
    input.address.trim(),
    input.phone.trim(),
    input.email.trim(),
    input.principalName.trim(),
    input.bankName.trim(),
    input.accountName.trim(),
    input.accountNumber.replace(/\s/g, ""),
    input.reportLock ? 1 : 0,
  ));
}

export async function setFormTeacher(classId: number, teacherId: number | null): Promise<void> {
  (await withTx(async () => {
    const klass = (await repo.getClass(classId));
    if (!klass) throw new SchoolError("Class not found.");
    if (teacherId && !(await one("SELECT id FROM users WHERE id=? AND role='teacher'", teacherId))) throw new SchoolError("Choose a teacher.");
    (await run("UPDATE classes SET form_teacher_id=? WHERE id=?", teacherId, classId));
    (await run("DELETE FROM teacher_classes WHERE class_id=?", classId));
    if (teacherId) {
      (await run("INSERT INTO teacher_classes (user_id, class_id, is_form_teacher) VALUES (?,?,1)", teacherId, classId));
      (await notice(teacherId, "Class assigned", `You are the form teacher of ${classLabel(klass.name, klass.arm)}. The register, markbook, roster and comments are on your desk.`, null, new Date().toISOString()));
    }
  }));
}

export async function addClass(input: { name: string; arm: string; track: string; levelCode: string; sortOrder: number; teacherId: number | null }): Promise<void> {
  const tracks = new Set(["creche", "nursery", "primary", "jss", "sss_science", "sss_arts", "sss_commercial"]);
  if (!tracks.has(input.track)) throw new SchoolError("Choose a level.");
  if (!/^[A-Z0-9]{1,4}$/.test(input.levelCode)) throw new SchoolError("Level code should be short, like P4 or J1.");
  if (input.name.trim().length < 3) throw new SchoolError("Enter the class name.");
  (await withTx(async () => {
    let id: number;
    try {
      id = (await run(
      "INSERT INTO classes (name, arm, track, level_code, sort_order, form_teacher_id) VALUES (?,?,?,?,?,?)",
      input.name.trim(),
      input.arm.trim(),
      input.track,
      input.levelCode,
      input.sortOrder,
      input.teacherId,
    )).lastInsertRowid;
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new SchoolError("A class with that name and arm already exists.");
      throw error;
    }
    if (input.teacherId) {
      (await run("INSERT INTO teacher_classes (user_id, class_id, is_form_teacher) VALUES (?,?,1)", input.teacherId, id));
      (await notice(input.teacherId, "Class assigned", `You are the form teacher of ${classLabel(input.name.trim(), input.arm.trim())}. The register, markbook, roster and comments are on your desk.`, null, new Date().toISOString()));
    }
  }));
}

export async function addSession(name: string): Promise<void> {
  if (!/^\d{4}\/\d{4}$/.test(name.trim())) throw new SchoolError("Use a session name like 2027/2028.");
  (await run("INSERT INTO sessions (name, is_current) VALUES (?,0)", name.trim()));
}

async function termDates(start: string, end: string, label: string): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || start >= end) {
    throw new SchoolError(`${label} needs a start date and a later end date.`);
  }
}

export async function addSessionWithTerms(input: {
  name: string;
  firstStart: string;
  firstEnd: string;
  secondStart: string;
  secondEnd: string;
  thirdStart: string;
  thirdEnd: string;
}): Promise<void> {
  const name = input.name.trim();
  if (!/^\d{4}\/\d{4}$/.test(name)) throw new SchoolError("Use a session name like 2027/2028.");
  (await termDates(input.firstStart, input.firstEnd, "First term"));
  (await termDates(input.secondStart, input.secondEnd, "Second term"));
  (await termDates(input.thirdStart, input.thirdEnd, "Third term"));
  if (input.firstEnd >= input.secondStart) throw new SchoolError("Second term must start after First term ends.");
  if (input.secondEnd >= input.thirdStart) throw new SchoolError("Third term must start after Second term ends.");
  (await withTx(async () => {
    let sessionId: number;
    try {
      sessionId = (await run("INSERT INTO sessions (name, is_current) VALUES (?,0)", name)).lastInsertRowid;
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new SchoolError("That session already exists.");
      throw error;
    }
    const plan = [
      ["First", input.firstStart, input.firstEnd, input.secondStart],
      ["Second", input.secondStart, input.secondEnd, input.thirdStart],
      ["Third", input.thirdStart, input.thirdEnd, null],
    ] as const;
    for (const [termName, start, end, next] of plan) {
      (await run("INSERT INTO terms (session_id, name, starts_on, ends_on, next_begins_on, is_current) VALUES (?,?,?,?,?,0)", sessionId, termName, start, end, next));
    }
    const previous = (await one<{ id: number }>(`
      SELECT t.id FROM terms t
      WHERE t.name='Third' AND t.ends_on < ? AND (t.next_begins_on IS NULL OR t.next_begins_on='')
      ORDER BY t.ends_on DESC LIMIT 1
    `, input.firstStart));
    if (previous) (await run("UPDATE terms SET next_begins_on=? WHERE id=?", input.firstStart, previous.id));
  }));
}

export async function addTerm(input: { sessionId: number; name: string; startsOn: string; endsOn: string; nextBegins: string }): Promise<void> {
  if (!["First", "Second", "Third"].includes(input.name)) throw new SchoolError("Choose First, Second or Third term.");
  (await termDates(input.startsOn, input.endsOn, `${input.name} term`));
  if (input.nextBegins) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.nextBegins) || input.nextBegins <= input.endsOn) {
      throw new SchoolError("Next term must begin after this term ends.");
    }
  }
  const session = (await one<{ id: number }>("SELECT id FROM sessions WHERE id=?", input.sessionId));
  if (!session) throw new SchoolError("That session was not found.");
  try {
    (await run(
      "INSERT INTO terms (session_id, name, starts_on, ends_on, next_begins_on, is_current) VALUES (?,?,?,?,?,0)",
      input.sessionId,
      input.name,
      input.startsOn,
      input.endsOn,
      input.nextBegins || null,
    ));
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new SchoolError("That term is already on this session.");
    throw error;
  }
  const previousName = input.name === "Second" ? "First" : input.name === "Third" ? "Second" : null;
  if (previousName) {
    const previous = (await one<{ id: number; next_begins_on: string | null }>(
      "SELECT id, next_begins_on FROM terms WHERE session_id=? AND name=?",
      input.sessionId,
      previousName,
    ));
    if (previous && !previous.next_begins_on) (await run("UPDATE terms SET next_begins_on=? WHERE id=?", input.startsOn, previous.id));
  }
}

export async function setCurrentTerm(termId: number): Promise<void> {
  (await withTx(async () => {
    const term = (await repo.getTerm(termId));
    (await run("UPDATE terms SET is_current=0"));
    (await run("UPDATE sessions SET is_current=0"));
    (await run("UPDATE terms SET is_current=1 WHERE id=?", term.id));
    (await run("UPDATE sessions SET is_current=1 WHERE id=?", term.session_id));
    (await run("UPDATE settings SET current_term_id=?, current_session_id=? WHERE id=1", term.id, term.session_id));
  }));
}

export async function addStaff(input: { name: string; email: string; phone: string; role: string; password: string }): Promise<void> {
  if (input.role !== "teacher" && input.role !== "bursar") throw new SchoolError("Choose teacher or bursar.");
  if (input.name.trim().length < 3) throw new SchoolError("Enter the staff name.");
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SchoolError("Enter a staff email.");
  if (input.password.length < 8) throw new SchoolError("Use at least 8 characters for the password.");
  const phone = input.phone.trim() ? normalizePhone(input.phone) : null;
  if (input.phone.trim() && !phone) throw new SchoolError("That phone number is not valid.");
  try {
    (await run(
      "INSERT INTO users (role, name, email, phone, password_hash, created_at) VALUES (?,?,?,?,?,?)",
      input.role,
      input.name.trim(),
      email,
      phone,
      hashPassword(input.password),
      new Date().toISOString(),
    ));
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new SchoolError("That email or phone is already on a staff account.");
    throw error;
  }
}

export async function saveStaff(input: { id: number; name: string; email: string; phone: string; role: string; password: string }): Promise<void> {
  const person = (await one<{ id: number; role: string }>("SELECT id, role FROM users WHERE id=?", input.id));
  if (!person || (person.role !== "teacher" && person.role !== "bursar")) throw new SchoolError("That staff account was not found.");
  if (input.role !== "teacher" && input.role !== "bursar") throw new SchoolError("Choose teacher or bursar.");
  if (input.name.trim().length < 3) throw new SchoolError("Enter the staff name.");
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SchoolError("Enter a staff email.");
  const phone = input.phone.trim() ? normalizePhone(input.phone) : null;
  if (input.phone.trim() && !phone) throw new SchoolError("That phone number is not valid.");
  if (input.password && input.password.length < 8) throw new SchoolError("Use at least 8 characters for the password.");
  if (person.role === "bursar" && input.role !== "bursar") {
    const bursars = (await one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role='bursar'"))?.c ?? 0;
    if (bursars <= 1) throw new SchoolError("Keep at least one bursar.");
  }
  (await withTx(async () => {
    try {
      (await run("UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?", input.name.trim(), email, phone, input.role, person.id));
    } catch (error) {
      if (String(error).includes("UNIQUE")) throw new SchoolError("That email or phone is already on a staff account.");
      throw error;
    }
    if (input.password) (await run("UPDATE users SET password_hash=? WHERE id=?", hashPassword(input.password), person.id));
    if (input.role !== "teacher") {
      (await run("UPDATE classes SET form_teacher_id=NULL WHERE form_teacher_id=?", person.id));
      (await run("DELETE FROM teacher_classes WHERE user_id=?", person.id));
    }
  }));
}

export async function removeStaff(id: number, actorId: number): Promise<void> {
  if (id === actorId) throw new SchoolError("You cannot remove the account you are signed in with.");
  const person = (await one<{ id: number; role: string; name: string }>("SELECT id, role, name FROM users WHERE id=?", id));
  if (!person || (person.role !== "teacher" && person.role !== "bursar")) throw new SchoolError("Only a teacher or bursar can be removed here.");
  if (person.role === "bursar") {
    const bursars = (await one<{ c: number }>("SELECT COUNT(*) AS c FROM users WHERE role='bursar'"))?.c ?? 0;
    if (bursars <= 1) throw new SchoolError("Keep at least one bursar.");
  }
  (await withTx(async () => {
    (await run("UPDATE classes SET form_teacher_id=NULL WHERE form_teacher_id=?", person.id));
    (await run("DELETE FROM teacher_classes WHERE user_id=?", person.id));
    (await run("DELETE FROM notices WHERE user_id=?", person.id));
    (await run("UPDATE ledger SET created_by=NULL WHERE created_by=?", person.id));
    (await run("UPDATE invoices SET issued_by=NULL WHERE issued_by=?", person.id));
    (await run("UPDATE proofs SET reviewed_by=NULL WHERE reviewed_by=?", person.id));
    (await run("UPDATE result_releases SET updated_by=NULL WHERE updated_by=?", person.id));
    (await run("DELETE FROM users WHERE id=?", person.id));
  }));
}

const RELEASE_FLOW: Record<string, { from: string[]; to: "open" | "locked" | "approved" | "published" }> = {
  lock: { from: ["open"], to: "locked" },
  unlock: { from: ["locked"], to: "open" },
  approve: { from: ["locked"], to: "approved" },
  return: { from: ["approved"], to: "open" },
  publish: { from: ["approved"], to: "published" },
  unpublish: { from: ["published"], to: "approved" },
};

export async function setRelease(classId: number, termId: number, intent: string, userId: number): Promise<void> {
  const step = RELEASE_FLOW[intent];
  if (!step) throw new SchoolError("That action is not available.");
  const current = (await repo.releaseOf(classId, termId));
  if (!step.from.includes(current.status)) throw new SchoolError("The result is not in the right state for that action.");
  if (intent === "approve" || intent === "publish") {
    const progress = (await repo.classProgress(classId, termId));
    if (progress.pupils === 0) throw new SchoolError("There are no learners on this broadsheet.");
    if (progress.missing > 0 || progress.examMissing > 0) {
      throw new SchoolError(`The markbook still has ${progress.missing} assessment gap${progress.missing === 1 ? "" : "s"} and ${progress.examMissing} examination gap${progress.examMissing === 1 ? "" : "s"}.`);
    }
  }
  const klass = (await repo.getClass(classId));
  if (!klass) throw new SchoolError("Class not found.");
  const teacherName = intent === "publish" ? klass.form_teacher_name : null;
  const principalName = intent === "publish" ? (await repo.getSettings()).principal_name : null;
  const term = (await repo.getTerm(termId));
  const heading = termTitle(term.name, term.session_name);
  const label = classLabel(klass.name, klass.arm);
  const now = new Date().toISOString();
  if ((intent === "lock" || intent === "unlock" || intent === "return") && klass.form_teacher_id) {
    const body = intent === "lock"
      ? `The ${label} markbook for ${heading} is locked. Scores and comments stay as they are until it is opened again.`
      : intent === "unlock"
        ? `The ${label} markbook for ${heading} is open again.`
        : `The ${label} result for ${heading} was returned. You can edit scores and comments again.`;
    (await notice(klass.form_teacher_id, intent === "return" ? "Result returned" : intent === "lock" ? "Markbook locked" : "Markbook opened", body, null, now));
  }
  if (intent === "publish" || intent === "unpublish") {
    const title = intent === "publish" ? "Official report published" : "Official report withdrawn";
    const body = intent === "publish"
      ? `The official report for ${label}, ${heading}, is published. It prints when that term’s fees are clear.`
      : `The official report for ${label}, ${heading}, has been taken down.`;
    for (const pupil of (await repo.pupilsForTerm(classId, termId))) (await notice(pupil.parent_id, title, body, pupil.id, now));
  }
  (await run(
    `INSERT INTO result_releases (class_id, term_id, status, form_teacher_name, principal_name, updated_at, updated_by)
     VALUES (?,?,?,?,?,?,?)
     ON CONFLICT(class_id, term_id) DO UPDATE SET
       status=excluded.status,
       updated_at=excluded.updated_at,
       updated_by=excluded.updated_by,
       form_teacher_name=COALESCE(excluded.form_teacher_name, result_releases.form_teacher_name),
       principal_name=COALESCE(excluded.principal_name, result_releases.principal_name)`,
    classId,
    termId,
    step.to,
    teacherName,
    principalName,
    new Date().toISOString(),
    userId,
  ));
}

export async function saveScores(
  classId: number,
  termId: number,
  subjectId: number,
  entries: { studentId: number; ca: number | null; exam: number | null; qualitative: string | null }[],
): Promise<void> {
  const book = (await repo.markbook(classId, termId, subjectId));
  if (book.release.status !== "open") throw new SchoolError("This markbook is locked.");
  const allowed = new Set(book.rows.map((row) => row.pupil.id));
  (await withTx(async () => {
    for (const entry of entries) {
      if (!allowed.has(entry.studentId)) throw new SchoolError("A score was submitted for a learner who is not on this class list.");
      if (book.assess.kind === "numeric") {
        if (entry.ca != null && (!Number.isInteger(entry.ca) || entry.ca < 0 || entry.ca > book.assess.caMax)) {
          throw new SchoolError(`Continuous assessment must be a whole number from 0 to ${book.assess.caMax}.`);
        }
        if (entry.exam != null && (!Number.isInteger(entry.exam) || entry.exam < 0 || entry.exam > book.assess.examMax)) {
          throw new SchoolError(`The examination must be a whole number from 0 to ${book.assess.examMax}.`);
        }
      } else if (entry.qualitative && !QUAL.has(entry.qualitative)) {
        throw new SchoolError("Choose a rating from the early-years scale.");
      }
      (await run(
        `INSERT INTO scores (student_id, class_id, subject_id, term_id, ca, exam, qualitative, updated_at)
         VALUES (?,?,?,?,?,?,?,?)
         ON CONFLICT(student_id, subject_id, term_id) DO UPDATE SET
           class_id=excluded.class_id, ca=excluded.ca, exam=excluded.exam, qualitative=excluded.qualitative, updated_at=excluded.updated_at`,
        entry.studentId,
        classId,
        subjectId,
        termId,
        book.assess.kind === "numeric" ? entry.ca : null,
        book.assess.kind === "numeric" ? entry.exam : null,
        book.assess.kind === "qualitative" ? entry.qualitative : null,
        new Date().toISOString(),
      ));
    }
  }));
}

export async function saveFormReport(
  classId: number,
  studentId: number,
  comment: string,
  ratings: { trait: string; domain: "affective" | "psychomotor"; rating: number | null }[],
): Promise<void> {
  const term = (await repo.currentTerm());
  if ((await repo.releaseOf(classId, term.id)).status !== "open") throw new SchoolError("This report is locked.");
  if (!(await repo.activeRoster(classId)).some((pupil) => pupil.id === studentId)) throw new SchoolError("That learner is not on this form list.");
  (await withTx(async () => {
    const existing = (await one<{ principal_remark: string }>("SELECT principal_remark FROM remarks WHERE student_id=? AND term_id=?", studentId, term.id));
    (await run(
      `INSERT INTO remarks (student_id, term_id, form_comment, principal_remark) VALUES (?,?,?,?)
       ON CONFLICT(student_id, term_id) DO UPDATE SET form_comment=excluded.form_comment`,
      studentId,
      term.id,
      comment.trim(),
      existing?.principal_remark ?? "",
    ));
    for (const rating of ratings) {
      if (!TRAITS.has(rating.trait)) continue;
      if (!rating.rating) {
        (await run("DELETE FROM trait_ratings WHERE student_id=? AND term_id=? AND trait=?", studentId, term.id, rating.trait));
        continue;
      }
      if (rating.rating < 1 || rating.rating > 5) throw new SchoolError("Ratings are from 1 to 5.");
      (await run(
        `INSERT INTO trait_ratings (student_id, term_id, trait, domain, rating) VALUES (?,?,?,?,?)
         ON CONFLICT(student_id, term_id, trait) DO UPDATE SET rating=excluded.rating, domain=excluded.domain`,
        studentId,
        term.id,
        rating.trait,
        rating.domain,
        rating.rating,
      ));
    }
  }));
}

export async function saveRegister(classId: number, day: string, marks: { studentId: number; status: string }[]): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new SchoolError("Choose a valid date.");
  const term = (await repo.currentTerm());
  if ((await repo.releaseOf(classId, term.id)).status === "published") throw new SchoolError("This term is published, so the register is frozen.");
  const allowed = new Set((await repo.activeRoster(classId)).map((pupil) => pupil.id));
  (await withTx(async () => {
    let dayId = (await one<{ id: number }>("SELECT id FROM attendance_days WHERE class_id=? AND term_id=? AND day=?", classId, term.id, day))?.id;
    if (!dayId) dayId = (await run("INSERT INTO attendance_days (class_id, term_id, day) VALUES (?,?,?)", classId, term.id, day)).lastInsertRowid;
    for (const mark of marks) {
      if (!allowed.has(mark.studentId)) continue;
      if (!mark.status) {
        (await run("DELETE FROM attendance_marks WHERE day_id=? AND student_id=?", dayId, mark.studentId));
        continue;
      }
      if (!["present", "absent", "late"].includes(mark.status)) throw new SchoolError("Attendance must be present, absent or late.");
      (await run(
        `INSERT INTO attendance_marks (day_id, student_id, status) VALUES (?,?,?)
         ON CONFLICT(day_id, student_id) DO UPDATE SET status=excluded.status`,
        dayId,
        mark.studentId,
        mark.status,
      ));
    }
  }));
}

export async function issueClassInvoices(classId: number, userId: number): Promise<{ issued: number; skipped: number }> {
  return (await withTx(async () => {
    const term = (await repo.currentTerm());
    let issued = 0;
    let skipped = 0;
    for (const pupil of (await repo.activeRoster(classId))) {
      if ((await one("SELECT id FROM invoices WHERE student_id=? AND term_id=?", pupil.id, term.id))) {
        skipped += 1;
        continue;
      }
      (await issueInvoiceRaw(pupil.id, term.id, userId, new Date().toISOString()));
      issued += 1;
    }
    return { issued, skipped };
  }));
}

export async function addCharge(studentId: number, label: string, amountKobo: number, userId: number): Promise<void> {
  if (label.trim().length < 2) throw new SchoolError("Name the charge.");
  if (amountKobo <= 0) throw new SchoolError("Enter an amount greater than zero.");
  (await withTx(async () => {
    const pupil = (await repo.getPupil(studentId));
    if (!pupil) throw new SchoolError("Learner not found.");
    const term = (await repo.currentTerm());
    const now = new Date().toISOString();
    let invoiceId = (await one<{ id: number }>("SELECT id FROM invoices WHERE student_id=? AND term_id=?", studentId, term.id))?.id;
    if (!invoiceId) {
      const arrears = Math.max(0, balanceOf((await repo.ledgerOf(studentId))));
      const number = `INV/${now.slice(0, 4)}/${String(await nextCounter("invoice")).padStart(4, "0")}`;
      invoiceId = (await run(
        "INSERT INTO invoices (number, student_id, term_id, arrears_kobo, issued_at, issued_by) VALUES (?,?,?,?,?,?)",
        number,
        studentId,
        term.id,
        arrears,
        now,
        userId,
      )).lastInsertRowid;
    }
    const sort = ((await one<{ value: number }>("SELECT COALESCE(MAX(sort_order),0) AS value FROM invoice_lines WHERE invoice_id=?", invoiceId))?.value ?? 0) + 1;
    (await run("INSERT INTO invoice_lines (invoice_id, label, amount_kobo, sort_order) VALUES (?,?,?,?)", invoiceId, label.trim(), amountKobo, sort));
    (await run(
      "INSERT INTO ledger (student_id, term_id, invoice_id, direction, amount_kobo, narration, created_at, created_by) VALUES (?,?,?,'debit',?,?,?,?)",
      studentId,
      term.id,
      invoiceId,
      amountKobo,
      label.trim(),
      now,
      userId,
    ));
  }));
}

export async function recordPayment(studentId: number, amountKobo: number, method: "cash" | "pos" | "transfer", userId: number) {
  if (!["cash", "pos", "transfer"].includes(method)) throw new SchoolError("Choose cash, POS or a confirmed transfer.");
  const narration = method === "cash" ? "Cash at the bursary" : method === "pos" ? "POS at the bursary" : "Bank transfer confirmed at the bursary";
  return (await withTx(async () => (await postPaymentRaw({ studentId, amountKobo, method, narration, createdAt: new Date().toISOString(), userId, termId: (await repo.currentTerm()).id }))));
}

export async function createProof(input: { studentId: number; amountKobo: number; bankName: string; reference: string; paidOn: string; note: string }): Promise<number> {
  if (input.amountKobo <= 0) throw new SchoolError("Enter the amount transferred.");
  if (input.reference.trim().length < 3) throw new SchoolError("Enter the transfer reference from your bank.");
  if (!input.paidOn) throw new SchoolError("Enter the date you paid.");
  const id = (await run(
    `INSERT INTO proofs (student_id, amount_kobo, bank_name, reference, paid_on, note, status, created_at)
     VALUES (?,?,?,?,?,?,'pending',?)`,
    input.studentId,
    input.amountKobo,
    input.bankName.trim() || null,
    input.reference.trim(),
    input.paidOn,
    input.note.trim() || null,
    new Date().toISOString(),
  )).lastInsertRowid;
  const pupil = (await repo.getPupil(input.studentId));
  const now = new Date().toISOString();
  for (const bursar of (await rows<{ id: number }>("SELECT id FROM users WHERE role='bursar'"))) {
    (await notice(bursar.id, "Payment proof to clear", `${pupil?.first_name ?? "A learner"} ${pupil?.last_name ?? ""} uploaded a transfer of ${formatNaira(input.amountKobo)}, reference ${input.reference.trim()}. It is not on the ledger until you approve it.`, input.studentId, now));
  }
  return id;
}

export async function setProofFile(id: number, filePath: string, contentType: string): Promise<void> {
  (await run("UPDATE proofs SET file_path=?, content_type=? WHERE id=?", filePath, contentType, id));
}

export async function approveProof(proofId: number, approvedKobo: number, userId: number) {
  return (await withTx(async () => {
    const proof = (await one<{ id: number; student_id: number; status: string; reference: string }>("SELECT id, student_id, status, reference FROM proofs WHERE id=?", proofId));
    if (!proof || proof.status !== "pending") throw new SchoolError("This proof has already been reviewed.");
    if (approvedKobo <= 0) throw new SchoolError("Enter the amount that actually arrived.");
    const posted = (await postPaymentRaw({
      studentId: proof.student_id,
      amountKobo: approvedKobo,
      method: "transfer",
      narration: `Bank transfer ${proof.reference}`,
      createdAt: new Date().toISOString(),
      userId,
      proofId: proof.id,
      termId: (await repo.currentTerm()).id,
    }));
    const now = new Date().toISOString();
    (await run(
      "UPDATE proofs SET status='approved', approved_kobo=?, reviewed_by=?, reviewed_at=?, ledger_id=? WHERE id=?",
      approvedKobo,
      userId,
      now,
      posted.ledgerId,
      proof.id,
    ));
    const pupil = (await repo.getPupil(proof.student_id));
    if (pupil) {
      (await notice(pupil.parent_id, "Payment confirmed", `The bursar confirmed ${formatNaira(approvedKobo)} for ${pupil.first_name}. Receipt ${posted.receipt}.`, pupil.id, now));
    }
    return posted;
  }));
}

export async function rejectProof(proofId: number, reason: string, userId: number): Promise<void> {
  if (reason.trim().length < 3) throw new SchoolError("Say why the proof was rejected.");
  (await withTx(async () => {
    const proof = (await one<{ id: number; student_id: number; status: string }>("SELECT id, student_id, status FROM proofs WHERE id=?", proofId));
    if (!proof || proof.status !== "pending") throw new SchoolError("This proof has already been reviewed.");
    const now = new Date().toISOString();
    (await run("UPDATE proofs SET status='rejected', rejection_reason=?, reviewed_by=?, reviewed_at=? WHERE id=?", reason.trim(), userId, now, proof.id));
    const pupil = (await repo.getPupil(proof.student_id));
    if (pupil) (await notice(pupil.parent_id, "Payment proof rejected", `The bursar could not confirm the transfer for ${pupil.first_name}. ${reason.trim()}`, pupil.id, now));
  }));
}

export async function saveFeeItem(id: number, label: string, amountKobo: number, active: boolean): Promise<void> {
  if (label.trim().length < 2) throw new SchoolError("Name the fee.");
  if (amountKobo <= 0) throw new SchoolError("Enter an amount greater than zero.");
  (await run("UPDATE fee_items SET label=?, amount_kobo=?, active=? WHERE id=?", label.trim(), amountKobo, active ? 1 : 0, id));
}

export async function addFeeItem(track: string, label: string, amountKobo: number): Promise<void> {
  const tracks = new Set(["creche", "nursery", "primary", "jss", "sss"]);
  if (!tracks.has(track)) throw new SchoolError("Choose a level for this fee.");
  if (label.trim().length < 2 || amountKobo <= 0) throw new SchoolError("Enter a name and an amount.");
  const sort = ((await one<{ value: number }>("SELECT COALESCE(MAX(sort_order),0) AS value FROM fee_items WHERE track=?", track))?.value ?? 0) + 1;
  (await run("INSERT INTO fee_items (track, label, amount_kobo, sort_order, active) VALUES (?,?,?,?,1)", track, label.trim(), amountKobo, sort));
}

export async function removeFeeItem(id: number): Promise<void> {
  const item = (await one<{ id: number; label: string }>("SELECT id, label FROM fee_items WHERE id=?", id));
  if (!item) throw new SchoolError("That fee is not on the schedule.");
  (await run("DELETE FROM fee_items WHERE id=?", id));
}

const SUBJECT_TRACKS = new Set(["creche", "nursery", "primary", "jss", "sss_science", "sss_arts", "sss_commercial"]);

function subjectFields(name: string, shortName: string): { name: string; shortName: string } {
  const trimmed = name.trim();
  const code = shortName.trim().toUpperCase();
  if (trimmed.length < 2) throw new SchoolError("Name the subject.");
  if (code.length < 2 || code.length > 8) throw new SchoolError("Use a short code of 2 to 8 letters, for example ENG.");
  return { name: trimmed, shortName: code };
}

export async function saveSubject(id: number, name: string, shortName: string, sortOrder: number): Promise<void> {
  const subject = (await one<{ id: number }>("SELECT id FROM subjects WHERE id=?", id));
  if (!subject) throw new SchoolError("That subject was not found.");
  const fields = subjectFields(name, shortName);
  if (!Number.isInteger(sortOrder) || sortOrder < 1) throw new SchoolError("Enter a sort order.");
  try {
    (await run("UPDATE subjects SET name=?, short_name=?, sort_order=? WHERE id=?", fields.name, fields.shortName, sortOrder, id));
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new SchoolError("That subject is already on this level.");
    throw error;
  }
}

export async function addSubject(track: string, name: string, shortName: string): Promise<void> {
  if (!SUBJECT_TRACKS.has(track)) throw new SchoolError("Choose a level for this subject.");
  const fields = subjectFields(name, shortName);
  const sort = ((await one<{ value: number }>("SELECT COALESCE(MAX(sort_order),0) AS value FROM subjects WHERE track=?", track))?.value ?? 0) + 1;
  try {
    (await run("INSERT INTO subjects (name, short_name, track, sort_order) VALUES (?,?,?,?)", fields.name, fields.shortName, track, sort));
  } catch (error) {
    if (String(error).includes("UNIQUE")) throw new SchoolError("That subject is already on this level.");
    throw error;
  }
}

export async function removeSubject(id: number): Promise<void> {
  const subject = (await one<{ id: number; name: string }>("SELECT id, name FROM subjects WHERE id=?", id));
  if (!subject) throw new SchoolError("That subject was not found.");
  (await withTx(async () => {
    (await run("DELETE FROM scores WHERE subject_id=?", subject.id));
    (await run("DELETE FROM subjects WHERE id=?", subject.id));
  }));
}

export async function saveTermDates(termId: number, startsOn: string, endsOn: string, nextBegins: string): Promise<void> {
  (await repo.getTerm(termId));
  (await termDates(startsOn, endsOn, "Term"));
  if (nextBegins) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextBegins) || nextBegins <= endsOn) {
      throw new SchoolError("Next term must begin after this term ends.");
    }
  }
  (await run("UPDATE terms SET starts_on=?, ends_on=?, next_begins_on=? WHERE id=?", startsOn, endsOn, nextBegins || null, termId));
}

export async function setPassword(userId: number, password: string): Promise<void> {
  if (password.length < 8) throw new SchoolError("Use at least 8 characters.");
  (await run("UPDATE users SET password_hash=? WHERE id=?", hashPassword(password), userId));
}

export async function resetParentPassword(studentId: number): Promise<{ password: string; parentName: string }> {
  const pupil = (await repo.getPupil(studentId));
  if (!pupil) throw new SchoolError("Learner not found.");
  const password = temporaryPassword();
  (await setPassword(pupil.parent_id, password));
  return { password, parentName: pupil.parent_name };
}

export async function submitEnquiry(input: {
  kind: "apply" | "inquire" | "tour" | "teach";
  name: string;
  email: string;
  phone: string;
  childName: string;
  childDob: string;
  stage: string;
  previousSchool: string;
  visitOn: string;
  subject: string;
  note: string;
}): Promise<void> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  if (name.length < 3) throw new SchoolError("Enter your full name.");
  if (!phone) throw new SchoolError("Enter a Nigerian mobile number, for example 08035550101.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new SchoolError("That email address does not look right.");
  if (input.kind === "apply" && !input.childName.trim()) throw new SchoolError("Enter the child's name.");
  if (input.kind === "apply" && !/^\d{4}-\d{2}-\d{2}$/.test(input.childDob)) throw new SchoolError("Enter the child's date of birth.");
  if ((input.kind === "apply" || input.kind === "inquire" || input.kind === "tour") && !input.stage.trim()) throw new SchoolError("Choose the class you have in mind.");
  if (input.kind === "tour" && !/^\d{4}-\d{2}-\d{2}$/.test(input.visitOn)) throw new SchoolError("Choose a preferred day for the visit.");
  if (input.kind === "teach" && input.subject.trim().length < 2) throw new SchoolError("Say what you would teach.");
  if (input.kind === "inquire" && input.note.trim().length < 8) throw new SchoolError("Write your question.");
  if (input.kind === "teach" && input.note.trim().length < 8) throw new SchoolError("Say where you have taught.");
  const now = new Date().toISOString();
  (await withTx(async () => {
    (await run(
      `INSERT INTO enquiries (kind, name, email, phone, child_name, child_dob, stage, previous_school, visit_on, subject, note, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'new',?)`,
      input.kind,
      name,
      email || null,
      phone,
      input.childName.trim() || null,
      input.childDob || null,
      input.stage.trim() || null,
      input.previousSchool.trim() || null,
      input.visitOn || null,
      input.subject.trim() || null,
      input.note.trim(),
      now,
    ));
    const title = input.kind === "apply" ? "Admission request" : input.kind === "tour" ? "Tour request" : input.kind === "teach" ? "Teaching application" : "Enquiry";
    const who = input.childName.trim() ? `${name} for ${input.childName.trim()}` : name;
    const admins = (await rows<{ id: number }>("SELECT id FROM users WHERE role='admin'"));
    for (const admin of admins) (await notice(admin.id, title, `${who} · ${phone}${input.stage ? ` · ${input.stage}` : ""}. Open the front door to read it.`, null, now));
  }));
}

export async function setEnquiryStatus(id: number, status: "new" | "seen"): Promise<void> {
  if (status !== "new" && status !== "seen") throw new SchoolError("Choose a status.");
  const changed = (await run("UPDATE enquiries SET status=? WHERE id=?", status, id)).changes;
  if (!changed) throw new SchoolError("That request was not found.");
}

export async function markNoticesRead(userId: number): Promise<void> {
  (await run("UPDATE notices SET read_at=? WHERE user_id=? AND read_at IS NULL", new Date().toISOString(), userId));
}

export function assertAssessment(track: string) {
  return assessmentOf(track);
}
