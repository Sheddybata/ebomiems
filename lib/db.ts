import "./quiet";
import fs from "fs";
import os from "os";
import path from "path";
import { DatabaseSync } from "node:sqlite";

type Sql = string | number | bigint | null;

const globalDb = globalThis as typeof globalThis & { __ebomi?: DatabaseSync };

function dbFile(): string {
  if (process.env.EBOMI_DB) return process.env.EBOMI_DB;
  const ephemeral = process.env.VERCEL === "1" || process.env.NEXT_PHASE === "phase-production-build";
  if (ephemeral) return path.join(os.tmpdir(), `ebomi-${process.pid}.sqlite`);
  return path.join(process.cwd(), "data", "ebomi.sqlite");
}

function sqlite(): DatabaseSync {
  if (globalDb.__ebomi) return globalDb.__ebomi;
  const file = dbFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const database = new DatabaseSync(file, { timeout: 60000 });
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA busy_timeout = 60000");
  globalDb.__ebomi = database;
  return database;
}

export function closeDb(): void {
  globalDb.__ebomi?.close();
  globalDb.__ebomi = undefined;
}

let depth = 0;

export function withTx<T>(fn: () => T): T {
  if (depth > 0) return fn();
  depth += 1;
  sqlite().exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    sqlite().exec("COMMIT");
    depth -= 1;
    return result;
  } catch (error) {
    try {
      sqlite().exec("ROLLBACK");
    } catch {
      /* already closed */
    }
    depth -= 1;
    throw error;
  }
}

export function rows<T>(sql: string, ...params: Sql[]): T[] {
  return sqlite().prepare(sql).all(...params) as T[];
}

export function one<T>(sql: string, ...params: Sql[]): T | undefined {
  return sqlite().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: Sql[]): { lastInsertRowid: number; changes: number } {
  const info = sqlite().prepare(sql).run(...params);
  return { lastInsertRowid: Number(info.lastInsertRowid), changes: Number(info.changes) };
}

export function migrate(): void {
  sqlite().exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('admin','bursar','teacher','parent')),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(lower(email)) WHERE email IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      is_current INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS terms (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      name TEXT NOT NULL CHECK (name IN ('First','Second','Third')),
      starts_on TEXT NOT NULL,
      ends_on TEXT NOT NULL,
      next_begins_on TEXT,
      is_current INTEGER NOT NULL DEFAULT 0,
      UNIQUE(session_id, name)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      school_name TEXT NOT NULL,
      motto TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      principal_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      report_lock INTEGER NOT NULL DEFAULT 1,
      current_session_id INTEGER REFERENCES sessions(id),
      current_term_id INTEGER REFERENCES terms(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      arm TEXT NOT NULL DEFAULT '',
      track TEXT NOT NULL,
      level_code TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      form_teacher_id INTEGER REFERENCES users(id),
      UNIQUE(name, arm)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      track TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      UNIQUE(name, track)
    );

    CREATE TABLE IF NOT EXISTS teacher_classes (
      user_id INTEGER NOT NULL REFERENCES users(id),
      class_id INTEGER NOT NULL REFERENCES classes(id),
      is_form_teacher INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, class_id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      other_name TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL CHECK (gender IN ('Female','Male')),
      dob TEXT,
      admission_no TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      class_id INTEGER NOT NULL REFERENCES classes(id),
      parent_id INTEGER NOT NULL REFERENCES users(id),
      admitted_on TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','withdrawn')),
      previous_school TEXT,
      leaving_reason TEXT,
      previous_class TEXT,
      previous_position TEXT
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      class_id INTEGER NOT NULL REFERENCES classes(id),
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      ca INTEGER,
      exam INTEGER,
      qualitative TEXT,
      updated_at TEXT,
      UNIQUE(student_id, subject_id, term_id)
    );

    CREATE TABLE IF NOT EXISTS result_releases (
      class_id INTEGER NOT NULL REFERENCES classes(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      status TEXT NOT NULL CHECK (status IN ('open','locked','approved','published')),
      form_teacher_name TEXT,
      principal_name TEXT,
      updated_at TEXT,
      updated_by INTEGER REFERENCES users(id),
      PRIMARY KEY (class_id, term_id)
    );

    CREATE TABLE IF NOT EXISTS remarks (
      student_id INTEGER NOT NULL REFERENCES students(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      form_comment TEXT NOT NULL DEFAULT '',
      principal_remark TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (student_id, term_id)
    );

    CREATE TABLE IF NOT EXISTS trait_ratings (
      student_id INTEGER NOT NULL REFERENCES students(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      trait TEXT NOT NULL,
      domain TEXT NOT NULL CHECK (domain IN ('affective','psychomotor')),
      rating INTEGER CHECK (rating BETWEEN 1 AND 5),
      PRIMARY KEY (student_id, term_id, trait)
    );

    CREATE TABLE IF NOT EXISTS attendance_days (
      id INTEGER PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      day TEXT NOT NULL,
      UNIQUE(class_id, term_id, day)
    );

    CREATE TABLE IF NOT EXISTS attendance_marks (
      day_id INTEGER NOT NULL REFERENCES attendance_days(id),
      student_id INTEGER NOT NULL REFERENCES students(id),
      status TEXT NOT NULL CHECK (status IN ('present','absent','late')),
      PRIMARY KEY (day_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS attendance_summaries (
      student_id INTEGER NOT NULL REFERENCES students(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      class_id INTEGER NOT NULL REFERENCES classes(id),
      days_opened INTEGER NOT NULL,
      days_present INTEGER NOT NULL,
      PRIMARY KEY (student_id, term_id)
    );

    CREATE TABLE IF NOT EXISTS fee_items (
      id INTEGER PRIMARY KEY,
      track TEXT NOT NULL,
      label TEXT NOT NULL,
      amount_kobo INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY,
      number TEXT NOT NULL UNIQUE,
      student_id INTEGER NOT NULL REFERENCES students(id),
      term_id INTEGER NOT NULL REFERENCES terms(id),
      arrears_kobo INTEGER NOT NULL DEFAULT 0,
      issued_at TEXT NOT NULL,
      issued_by INTEGER REFERENCES users(id),
      UNIQUE(student_id, term_id)
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      label TEXT NOT NULL,
      amount_kobo INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      term_id INTEGER REFERENCES terms(id),
      invoice_id INTEGER REFERENCES invoices(id),
      direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
      amount_kobo INTEGER NOT NULL CHECK (amount_kobo > 0),
      method TEXT,
      receipt_no TEXT,
      narration TEXT NOT NULL,
      proof_id INTEGER,
      created_at TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS proofs (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id),
      amount_kobo INTEGER NOT NULL,
      approved_kobo INTEGER,
      bank_name TEXT,
      reference TEXT NOT NULL,
      paid_on TEXT NOT NULL,
      note TEXT,
      file_path TEXT,
      content_type TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
      rejection_reason TEXT,
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      ledger_id INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      student_id INTEGER REFERENCES students(id),
      created_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS counters (
      name TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('apply','inquire','tour','teach')),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      child_name TEXT,
      child_dob TEXT,
      stage TEXT,
      previous_school TEXT,
      visit_on TEXT,
      subject TEXT,
      note TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','seen')),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_ledger_student ON ledger(student_id, created_at, id);
    CREATE INDEX IF NOT EXISTS idx_scores_class ON scores(class_id, term_id);
    CREATE INDEX IF NOT EXISTS idx_notices_user ON notices(user_id, id);
    CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id, status);
    CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status, id);
  `);
  for (const [column, type] of [
    ["previous_school", "TEXT"],
    ["leaving_reason", "TEXT"],
    ["previous_class", "TEXT"],
    ["previous_position", "TEXT"],
  ] as const) {
    const present = sqlite().prepare("PRAGMA table_info(students)").all() as { name: string }[];
    if (!present.some((item) => item.name === column)) sqlite().exec(`ALTER TABLE students ADD COLUMN ${column} ${type}`);
  }
}
