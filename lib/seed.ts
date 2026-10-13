import { one, run, withTx } from "./db";
import { OFFICE, SCHOOL } from "./office";
import { hashPassword } from "./password";

const SUBJECTS: Record<string, [string, string][]> = {
  creche: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Social Norms", "SNM"],
    ["Science", "SCI"],
    ["Health Habits", "HEA"],
    ["Colouring", "COL"],
    ["Handwriting", "HW"],
    ["Verbal Reasoning", "VR"],
    ["Quantitative Reasoning", "QR"],
    ["Creative Arts", "ART"],
  ],
  nursery: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Social Norms", "SNM"],
    ["Science", "SCI"],
    ["Health Habits", "HEA"],
    ["Colouring", "COL"],
    ["Handwriting", "HW"],
    ["Verbal Reasoning", "VR"],
    ["Quantitative Reasoning", "QR"],
    ["Creative Arts", "ART"],
  ],
  primary: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Basic Science and Technology", "BST"],
    ["Social Studies", "SOS"],
    ["Civic Education", "CIV"],
    ["Christian Religious Studies", "CRS"],
    ["Yoruba", "YOR"],
    ["Cultural and Creative Arts", "CCA"],
    ["Physical and Health Education", "PHE"],
    ["Computer Studies", "CMP"],
    ["Verbal Reasoning", "VR"],
    ["Quantitative Reasoning", "QR"],
  ],
  jss: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Basic Science", "BSC"],
    ["Basic Technology", "BTE"],
    ["Social Studies", "SOS"],
    ["Civic Education", "CIV"],
    ["Christian Religious Studies", "CRS"],
    ["Business Studies", "BUS"],
    ["History", "HIS"],
    ["Physical and Health Education", "PHE"],
    ["Cultural and Creative Arts", "CCA"],
    ["Livestock", "LIV"],
    ["Social / Citizenship", "CIT"],
    ["Use of English Literature", "UEL"],
    ["Garment Making", "GMT"],
  ],
  sss_science: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Civic Education", "CIV"],
    ["Biology", "BIO"],
    ["Chemistry", "CHM"],
    ["Physics", "PHY"],
    ["Further Mathematics", "FMA"],
    ["Digital Technology", "DGT"],
    ["Technical Drawing", "TD"],
    ["Geography", "GEO"],
    ["Agricultural Science", "AGR"],
  ],
  sss_arts: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Civic Education", "CIV"],
    ["Literature in English", "LIT"],
    ["Government", "GOV"],
    ["Christian Religious Studies", "CRS"],
    ["History", "HIS"],
    ["Marketing", "MKT"],
    ["Food and Nutrition", "FAN"],
  ],
  sss_commercial: [
    ["English Language", "ENG"],
    ["Mathematics", "MTH"],
    ["Civic Education", "CIV"],
    ["Financial Accounting", "ACC"],
    ["Commerce", "COM"],
    ["Economics", "ECO"],
    ["Government", "GOV"],
    ["Marketing", "MKT"],
    ["Data Processing", "DAT"],
  ],
};

export function seedIfEmpty(): void {
  if (one("SELECT id FROM settings WHERE id=1")) return;
  seedSchool();
}

export function seedSchool(): void {
  withTx(() => {
    const now = new Date().toISOString();
    const teacherPassword = hashPassword(OFFICE.teacher.password);
    const addUser = (role: string, name: string, email: string, phone: string | null, password: string) =>
      run("INSERT INTO users (role, name, email, phone, password_hash, created_at) VALUES (?,?,?,?,?,?)", role, name, email, phone, password, now).lastInsertRowid;

    addUser("admin", OFFICE.admin.name, OFFICE.admin.email, "08035550100", hashPassword(OFFICE.admin.password));
    addUser("bursar", OFFICE.bursar.name, OFFICE.bursar.email, null, hashPassword(OFFICE.bursar.password));

    const teachers: Record<string, number> = {
      blessing: addUser("teacher", "Blessing Ekeoma", "blessing.ekeoma@ebomischool.org", "08035550110", teacherPassword),
      chika: addUser("teacher", "Chika Akwudolu", "chika.akwudolu@ebomischool.org", "08035550111", teacherPassword),
      favour: addUser("teacher", "Favour Elijah", "favour.elijah@ebomischool.org", "08035550112", teacherPassword),
      mary: addUser("teacher", "Mary Ejeh", "mary.ejeh@ebomischool.org", "08035550113", teacherPassword),
      celina: addUser("teacher", "Celina Udemara", "celina.udemara@ebomischool.org", "08035550114", teacherPassword),
      anna: addUser("teacher", "Anna Abiola", "anna.abiola@ebomischool.org", "08035550115", teacherPassword),
      chinyere: addUser("teacher", OFFICE.teacher.name, OFFICE.teacher.email, "08035550103", teacherPassword),
      emmanuel: addUser("teacher", "Emmanuel Adakole", "emmanuel.adakole@ebomischool.org", "08035550116", teacherPassword),
      chinwe: addUser("teacher", "Chinwe Kanu", "chinwe.kanu@ebomischool.org", "08035550117", teacherPassword),
      loveline: addUser("teacher", "Njoku Loveline", "loveline.njoku@ebomischool.org", "08035550118", teacherPassword),
    };

    const session = run("INSERT INTO sessions (name, is_current) VALUES ('2026/2027', 1)").lastInsertRowid;
    const term = run(
      "INSERT INTO terms (session_id, name, starts_on, ends_on, next_begins_on, is_current) VALUES (?, 'First', '2026-09-14', '2026-12-18', '2027-01-09', 1)",
      session,
    ).lastInsertRowid;

    run(
      `INSERT INTO settings (id, school_name, motto, address, phone, email, principal_name, bank_name, account_name, account_number, report_lock, current_session_id, current_term_id)
       VALUES (1, ?, ?, ?, '08035550100', ?, ?, '', ?, '', 1, ?, ?)`,
      SCHOOL.name,
      SCHOOL.motto,
      SCHOOL.address,
      SCHOOL.email,
      OFFICE.admin.name,
      SCHOOL.accountName,
      session,
      term,
    );

    const classPlan: [string, string, string, string, number, string][] = [
      ["Creche", "", "creche", "CR", 10, "blessing"],
      ["Nursery 1", "", "nursery", "N1", 20, "chika"],
      ["Nursery 2", "", "nursery", "N2", 30, "favour"],
      ["Nursery 3", "", "nursery", "N3", 35, "mary"],
      ["Primary 1", "", "primary", "P1", 40, "celina"],
      ["Primary 2", "", "primary", "P2", 50, "anna"],
      ["Primary 3", "", "primary", "P3", 60, "chinyere"],
      ["Primary 4", "", "primary", "P4", 70, "emmanuel"],
      ["Primary 5", "", "primary", "P5", 80, "chinwe"],
      ["Primary 6", "", "primary", "P6", 90, ""],
      ["JSS 1", "", "jss", "J1", 100, ""],
      ["JSS 2", "", "jss", "J2", 110, ""],
      ["JSS 3", "", "jss", "J3", 120, ""],
      ["SSS 1", "Science", "sss_science", "S1", 130, ""],
      ["SSS 1", "Arts", "sss_arts", "S1A", 140, ""],
      ["SSS 2", "Science", "sss_science", "S2", 150, ""],
      ["SSS 2", "Arts", "sss_arts", "S2A", 160, ""],
      ["SSS 2", "Commercial", "sss_commercial", "S2C", 170, ""],
      ["SSS 3", "Science", "sss_science", "S3", 180, ""],
    ];
    for (const [name, arm, track, code, sort, teacher] of classPlan) {
      const teacherId = teacher ? teachers[teacher] : null;
      const id = run(
        "INSERT INTO classes (name, arm, track, level_code, sort_order, form_teacher_id) VALUES (?,?,?,?,?,?)",
        name,
        arm,
        track,
        code,
        sort,
        teacherId,
      ).lastInsertRowid;
      if (teacherId) run("INSERT INTO teacher_classes (user_id, class_id, is_form_teacher) VALUES (?,?,1)", teacherId, id);
    }

    for (const [track, list] of Object.entries(SUBJECTS)) {
      list.forEach(([name, shortName], index) => {
        run("INSERT INTO subjects (name, short_name, track, sort_order) VALUES (?,?,?,?)", name, shortName, track, index + 1);
      });
    }
  });
}

export function emptySchool(): void {
  run("PRAGMA foreign_keys = OFF");
  try {
  withTx(() => {
    const tables = [
      "attendance_marks",
      "attendance_days",
      "attendance_summaries",
      "scores",
      "remarks",
      "trait_ratings",
      "result_releases",
      "invoice_lines",
      "ledger",
      "proofs",
      "invoices",
      "notices",
      "enquiries",
      "students",
      "teacher_classes",
      "fee_items",
      "subjects",
      "classes",
      "terms",
      "sessions",
      "counters",
      "users",
      "settings",
    ];
    for (const table of tables) run(`DELETE FROM ${table}`);
  });
  } finally {
    run("PRAGMA foreign_keys = ON");
  }
}
