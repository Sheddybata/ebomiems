"use server";

import fs from "fs";
import path from "path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { homeFor, matchLogin, passwordMatches, requireUser, startSession } from "./auth";
import { setFlash } from "./flash";
import { nairaToKobo } from "./money";
import * as mutate from "./mutate";
import { CHECK_COOKIE, SESSION_COOKIE } from "./session";
import { SchoolError } from "./types";
import { normalizePhone } from "./format";
import { getPupil, teacherOwns } from "./repo";
import { AFFECTIVE, PSYCHOMOTOR } from "./grading";

function bounce(target: string, error: unknown): never {
  if (!(error instanceof SchoolError)) throw error;
  const join = target.includes("?") ? "&" : "?";
  redirect(`${target}${join}error=${encodeURIComponent(error.message)}`);
}

function whole(value: FormDataEntryValue | null, label: string): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) throw new SchoolError(`${label} must be a whole number.`);
  return Number(text);
}

function money(value: FormDataEntryValue | null): number {
  const kobo = nairaToKobo(String(value ?? ""));
  if (kobo == null) throw new SchoolError("Enter an amount in naira, for example 20000.");
  return kobo;
}

function sniff(buf: Buffer): string | null {
  if (buf.subarray(0, 3).toString("hex") === "ffd8ff") return "image/jpeg";
  if (buf.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  return null;
}

export async function login(formData: FormData) {
  const identity = String(formData.get("identity") || "");
  const password = String(formData.get("password") || "");
  const user = matchLogin(identity);
  if (!user || !passwordMatches(password, user.password_hash)) {
    redirect("/login?error=" + encodeURIComponent("That email, phone or password is not correct."));
  }
  await startSession(user.id);
  redirect(homeFor(user.role));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}

export async function checkResult(formData: FormData) {
  const admission = String(formData.get("admission") || "");
  const pin = String(formData.get("pin") || "");
  const termId = String(formData.get("termId") || "");
  const jar = await cookies();
  jar.set(CHECK_COOKIE, JSON.stringify({ admission, pin }), { httpOnly: true, sameSite: "lax", path: "/results", maxAge: 60 * 30 });
  redirect(termId ? `/results?term=${encodeURIComponent(termId)}` : "/results");
}

export async function changePassword(formData: FormData) {
  const user = await requireUser();
  const back = "/account/password";
  try {
    const current = String(formData.get("current") || "");
    const next = String(formData.get("next") || "");
    const account = matchLogin(user.email || user.phone || "");
    if (!account || !passwordMatches(current, account.password_hash)) throw new SchoolError("The current password is not correct.");
    mutate.setPassword(user.id, next);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "?ok=" + encodeURIComponent("Password changed."));
}

export async function enrol(formData: FormData) {
  const user = await requireUser("admin");
  const back = "/admin/enrol";
  try {
    const parentRaw = String(formData.get("parentId") || "");
    const result = mutate.enrolStudent({
      firstName: String(formData.get("firstName") || ""),
      lastName: String(formData.get("lastName") || ""),
      otherName: String(formData.get("otherName") || ""),
      gender: String(formData.get("gender") || ""),
      dob: String(formData.get("dob") || ""),
      classId: Number(formData.get("classId")),
      parentId: parentRaw ? Number(parentRaw) : null,
      parentName: String(formData.get("parentName") || ""),
      parentPhone: String(formData.get("parentPhone") || ""),
      parentEmail: String(formData.get("parentEmail") || ""),
      actorId: user.id,
      previousSchool: String(formData.get("previousSchool") || ""),
      leavingReason: String(formData.get("leavingReason") || ""),
      previousClass: String(formData.get("previousClass") || ""),
      previousPosition: String(formData.get("previousPosition") || ""),
    });
    await setFlash({
      title: `${result.classLabel} · ${result.admissionNo}`,
      body: `Result PIN ${result.pin}. ${result.parentPassword ? `New parent password for ${result.parentName}: ${result.parentPassword}.` : `Linked to ${result.parentName}.`} Bill ${result.bill.number}.`,
    });
    redirect(`/admin/students/${result.studentId}`);
  } catch (error) {
    bounce(back, error);
  }
}

export async function resetPin(formData: FormData) {
  await requireUser("admin");
  const studentId = Number(formData.get("studentId"));
  try {
    const pin = mutate.resetPin(studentId);
    await setFlash({ title: "PIN reset", body: `The new result PIN is ${pin}. The parent notice has it too.` });
  } catch (error) {
    bounce(`/admin/students/${studentId}`, error);
  }
  redirect(`/admin/students/${studentId}`);
}

export async function resetParentPassword(formData: FormData) {
  await requireUser("admin");
  const studentId = Number(formData.get("studentId"));
  try {
    const result = mutate.resetParentPassword(studentId);
    await setFlash({ title: "Parent password reset", body: `${result.parentName} can sign in with ${result.password}. Tell them in person. It is not stored again.` });
  } catch (error) {
    bounce(`/admin/students/${studentId}`, error);
  }
  redirect(`/admin/students/${studentId}`);
}

export async function updateStudent(formData: FormData) {
  await requireUser("admin");
  const studentId = Number(formData.get("studentId"));
  try {
    mutate.updateStudent(studentId, Number(formData.get("classId")), String(formData.get("status") || ""));
  } catch (error) {
    bounce(`/admin/students/${studentId}`, error);
  }
  redirect(`/admin/students/${studentId}?ok=` + encodeURIComponent("Student file updated."));
}

export async function savePrincipalRemark(formData: FormData) {
  await requireUser("admin");
  const studentId = Number(formData.get("studentId"));
  const termId = Number(formData.get("termId"));
  try {
    mutate.savePrincipalRemark(studentId, termId, String(formData.get("remark") || ""));
  } catch (error) {
    bounce(`/admin/students/${studentId}?term=${termId}`, error);
  }
  redirect(`/admin/students/${studentId}?term=${termId}&ok=` + encodeURIComponent("Principal remark saved."));
}

export async function saveSettings(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.saveSettings({
      schoolName: String(formData.get("schoolName") || ""),
      motto: String(formData.get("motto") || ""),
      address: String(formData.get("address") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      principalName: String(formData.get("principalName") || ""),
      bankName: String(formData.get("bankName") || ""),
      accountName: String(formData.get("accountName") || ""),
      accountNumber: String(formData.get("accountNumber") || ""),
      reportLock: formData.get("reportLock") === "on",
    });
  } catch (error) {
    bounce("/admin/settings", error);
  }
  redirect("/admin/settings?ok=" + encodeURIComponent("School settings saved."));
}

export async function setFormTeacher(formData: FormData) {
  await requireUser("admin");
  const classId = Number(formData.get("classId"));
  const teacher = String(formData.get("teacherId") || "");
  try {
    mutate.setFormTeacher(classId, teacher ? Number(teacher) : null);
  } catch (error) {
    bounce("/admin/classes", error);
  }
  redirect("/admin/classes?ok=" + encodeURIComponent("Form teacher updated."));
}

export async function addClass(formData: FormData) {
  await requireUser("admin");
  const teacher = String(formData.get("teacherId") || "");
  try {
    mutate.addClass({
      name: String(formData.get("name") || ""),
      arm: String(formData.get("arm") || ""),
      track: String(formData.get("track") || ""),
      levelCode: String(formData.get("levelCode") || "").toUpperCase(),
      sortOrder: Number(formData.get("sortOrder") || 200),
      teacherId: teacher ? Number(teacher) : null,
    });
  } catch (error) {
    bounce("/admin/classes", error);
  }
  redirect("/admin/classes?ok=" + encodeURIComponent("Class added."));
}

export async function addSession(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.addSessionWithTerms({
      name: String(formData.get("name") || ""),
      firstStart: String(formData.get("firstStart") || ""),
      firstEnd: String(formData.get("firstEnd") || ""),
      secondStart: String(formData.get("secondStart") || ""),
      secondEnd: String(formData.get("secondEnd") || ""),
      thirdStart: String(formData.get("thirdStart") || ""),
      thirdEnd: String(formData.get("thirdEnd") || ""),
    });
  } catch (error) {
    bounce("/admin/sessions", error);
  }
  redirect("/admin/sessions?ok=" + encodeURIComponent("Session added with First, Second and Third term. The current term follows the dates."));
}

export async function addTerm(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.addTerm({
      sessionId: Number(formData.get("sessionId")),
      name: String(formData.get("name") || ""),
      startsOn: String(formData.get("startsOn") || ""),
      endsOn: String(formData.get("endsOn") || ""),
      nextBegins: String(formData.get("nextBegins") || ""),
    });
  } catch (error) {
    bounce("/admin/sessions", error);
  }
  redirect("/admin/sessions?ok=" + encodeURIComponent("Term added. The current term follows the calendar dates."));
}

export async function setCurrentTerm(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.setCurrentTerm(Number(formData.get("termId")));
  } catch (error) {
    bounce("/admin/sessions", error);
  }
  redirect("/admin/sessions?ok=" + encodeURIComponent("Current term updated. Ask the bursar to issue bills if this term has none."));
}

export async function addStaff(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.addStaff({
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role") || ""),
      password: String(formData.get("password") || ""),
    });
  } catch (error) {
    bounce("/admin/staff", error);
  }
  redirect("/admin/staff?ok=" + encodeURIComponent("Staff account created."));
}

export async function saveStaff(formData: FormData) {
  await requireUser("admin");
  const id = Number(formData.get("id"));
  try {
    mutate.saveStaff({
      id,
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      role: String(formData.get("role") || ""),
      password: String(formData.get("password") || ""),
    });
  } catch (error) {
    bounce(`/admin/staff?edit=${id}`, error);
  }
  redirect("/admin/staff?ok=" + encodeURIComponent("Staff account saved."));
}

export async function removeStaff(formData: FormData) {
  const user = await requireUser("admin");
  try {
    mutate.removeStaff(Number(formData.get("id")), user.id);
  } catch (error) {
    bounce("/admin/staff", error);
  }
  redirect("/admin/staff?ok=" + encodeURIComponent("Staff account removed. Any class they held is now without a form teacher."));
}

export async function setRelease(formData: FormData) {
  const user = await requireUser("admin");
  const classId = Number(formData.get("classId"));
  const termId = Number(formData.get("termId"));
  const back = `/admin/results?term=${termId}`;
  try {
    mutate.setRelease(classId, termId, String(formData.get("intent") || ""), user.id);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "&ok=" + encodeURIComponent("Result status updated."));
}

export async function saveScores(formData: FormData) {
  const user = await requireUser("teacher");
  const classId = Number(formData.get("classId"));
  const termId = Number(formData.get("termId"));
  const subjectId = Number(formData.get("subjectId"));
  const back = `/teacher/markbook/${classId}?term=${termId}&subject=${subjectId}`;
  try {
    if (!teacherOwns(user.id, classId)) throw new SchoolError("This class is not on your desk.");
    const ids = String(formData.get("studentIds") || "").split(",").filter(Boolean).map(Number);
    mutate.saveScores(
      classId,
      termId,
      subjectId,
      ids.map((studentId) => ({
        studentId,
        ca: whole(formData.get(`ca_${studentId}`), "Continuous assessment"),
        exam: whole(formData.get(`exam_${studentId}`), "Examination"),
        qualitative: String(formData.get(`q_${studentId}`) || "") || null,
      })),
    );
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "&ok=" + encodeURIComponent("Markbook saved."));
}

export async function saveFormReport(formData: FormData) {
  const user = await requireUser("teacher");
  const classId = Number(formData.get("classId"));
  const studentId = Number(formData.get("studentId"));
  const back = `/teacher/comments/${classId}?student=${studentId}`;
  try {
    if (!teacherOwns(user.id, classId, true)) throw new SchoolError("Only the form teacher records comments and ratings.");
    const ratings = [
      ...AFFECTIVE.map((trait) => ({ trait, domain: "affective" as const, rating: whole(formData.get(`aff_${studentId}_${trait}`), trait) })),
      ...PSYCHOMOTOR.map((trait) => ({ trait, domain: "psychomotor" as const, rating: whole(formData.get(`psy_${studentId}_${trait}`), trait) })),
    ];
    mutate.saveFormReport(classId, studentId, String(formData.get("comment") || ""), ratings);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "&ok=" + encodeURIComponent("Form report saved."));
}

export async function saveRegister(formData: FormData) {
  const user = await requireUser("teacher");
  const classId = Number(formData.get("classId"));
  const day = String(formData.get("day") || "");
  const back = `/teacher/register/${classId}?day=${day}`;
  try {
    if (!teacherOwns(user.id, classId)) throw new SchoolError("This class is not on your desk.");
    const ids = String(formData.get("studentIds") || "").split(",").filter(Boolean).map(Number);
    const intent = String(formData.get("intent") || "save");
    const marks = ids.map((studentId) => ({
      studentId,
      status: intent === "all-present" ? "present" : String(formData.get(`status_${studentId}`) || ""),
    }));
    mutate.saveRegister(classId, day, marks);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "&ok=" + encodeURIComponent("Register saved."));
}

export async function issueClassInvoices(formData: FormData) {
  const user = await requireUser("bursar");
  const back = "/bursar/invoices";
  try {
    const result = mutate.issueClassInvoices(Number(formData.get("classId")), user.id);
    redirect(back + "?ok=" + encodeURIComponent(`${result.issued} bill${result.issued === 1 ? "" : "s"} issued. ${result.skipped} already had one.`));
  } catch (error) {
    bounce(back, error);
  }
}

export async function addCharge(formData: FormData) {
  const user = await requireUser("bursar");
  const invoiceId = String(formData.get("invoiceId") || "");
  const studentId = Number(formData.get("studentId"));
  const back = invoiceId ? `/bursar/invoices/${invoiceId}` : `/bursar/collect?student=${studentId}`;
  try {
    mutate.addCharge(studentId, String(formData.get("label") || ""), money(formData.get("amount")), user.id);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + (back.includes("?") ? "&" : "?") + "ok=" + encodeURIComponent("Charge posted to the ledger."));
}

export async function recordPayment(formData: FormData) {
  const user = await requireUser("bursar");
  const studentId = Number(formData.get("studentId"));
  const back = `/bursar/collect?student=${studentId}`;
  try {
    const method = String(formData.get("method") || "") as "cash" | "pos" | "transfer";
    const posted = mutate.recordPayment(studentId, money(formData.get("amount")), method, user.id);
    redirect(`/receipts/${posted.ledgerId}`);
  } catch (error) {
    bounce(back, error);
  }
}

export async function submitProof(formData: FormData) {
  const user = await requireUser("parent");
  const studentId = Number(formData.get("studentId"));
  const back = `/parent/children/${studentId}/fees`;
  try {
    const pupil = getPupil(studentId);
    if (!pupil || pupil.parent_id !== user.id) throw new SchoolError("That child is not on this account.");
    const file = formData.get("file");
    let payload: { buf: Buffer; type: string } | null = null;
    if (file instanceof File && file.size > 0) {
      if (file.size > 2_500_000) throw new SchoolError("The proof must be under 2.5 MB.");
      const buf = Buffer.from(await file.arrayBuffer());
      const type = sniff(buf);
      if (!type) throw new SchoolError("Upload a JPG, PNG, WEBP or PDF of the transfer receipt.");
      payload = { buf, type };
    }
    const id = mutate.createProof({
      studentId,
      amountKobo: money(formData.get("amount")),
      bankName: String(formData.get("bankName") || ""),
      reference: String(formData.get("reference") || ""),
      paidOn: String(formData.get("paidOn") || ""),
      note: String(formData.get("note") || ""),
    });
    if (payload) {
      const ext = payload.type === "application/pdf" ? "pdf" : payload.type === "image/png" ? "png" : payload.type === "image/webp" ? "webp" : "jpg";
      const rel = `proofs/${id}.${ext}`;
      const abs = path.join(process.cwd(), "data", rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, payload.buf);
      mutate.setProofFile(id, rel, payload.type);
    }
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "?ok=" + encodeURIComponent("Proof sent. It is a request until the bursar approves it, and it is not yet on the ledger."));
}

export async function approveProof(formData: FormData) {
  const user = await requireUser("bursar");
  const proofId = Number(formData.get("proofId"));
  try {
    const posted = mutate.approveProof(proofId, money(formData.get("amount")), user.id);
    redirect(`/receipts/${posted.ledgerId}`);
  } catch (error) {
    bounce("/bursar/proofs", error);
  }
}

export async function rejectProof(formData: FormData) {
  const user = await requireUser("bursar");
  try {
    mutate.rejectProof(Number(formData.get("proofId")), String(formData.get("reason") || ""), user.id);
  } catch (error) {
    bounce("/bursar/proofs", error);
  }
  redirect("/bursar/proofs?ok=" + encodeURIComponent("Proof rejected. The parent has been told."));
}

export async function saveFeeItem(formData: FormData) {
  await requireUser("bursar");
  try {
    mutate.saveFeeItem(Number(formData.get("id")), String(formData.get("label") || ""), money(formData.get("amount")), formData.get("active") === "on");
  } catch (error) {
    bounce("/bursar/schedules", error);
  }
  redirect("/bursar/schedules?ok=" + encodeURIComponent("Schedule saved. Bills already on the ledger are unchanged."));
}

export async function addFeeItem(formData: FormData) {
  await requireUser("bursar");
  try {
    mutate.addFeeItem(String(formData.get("track") || ""), String(formData.get("label") || ""), money(formData.get("amount")));
  } catch (error) {
    bounce("/bursar/schedules", error);
  }
  redirect("/bursar/schedules?ok=" + encodeURIComponent("Fee added to the schedule."));
}

export async function removeFeeItem(formData: FormData) {
  await requireUser("bursar");
  try {
    mutate.removeFeeItem(Number(formData.get("id")));
  } catch (error) {
    bounce("/bursar/schedules", error);
  }
  redirect("/bursar/schedules?ok=" + encodeURIComponent("Fee removed. Bills already on the ledger are unchanged."));
}

export async function saveSubject(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.saveSubject(
      Number(formData.get("id")),
      String(formData.get("name") || ""),
      String(formData.get("shortName") || ""),
      Number(formData.get("sortOrder") || 0),
    );
  } catch (error) {
    bounce("/admin/subjects", error);
  }
  redirect("/admin/subjects?ok=" + encodeURIComponent("Subject saved. The public curriculum and teacher markbooks use this list."));
}

export async function addSubject(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.addSubject(String(formData.get("track") || ""), String(formData.get("name") || ""), String(formData.get("shortName") || ""));
  } catch (error) {
    bounce("/admin/subjects", error);
  }
  redirect("/admin/subjects?ok=" + encodeURIComponent("Subject added."));
}

export async function removeSubject(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.removeSubject(Number(formData.get("id")));
  } catch (error) {
    bounce("/admin/subjects", error);
  }
  redirect("/admin/subjects?ok=" + encodeURIComponent("Subject removed. Marks already entered for it were deleted."));
}

export async function saveTermDates(formData: FormData) {
  await requireUser("admin");
  try {
    mutate.saveTermDates(
      Number(formData.get("termId")),
      String(formData.get("startsOn") || ""),
      String(formData.get("endsOn") || ""),
      String(formData.get("nextBegins") || ""),
    );
  } catch (error) {
    bounce("/admin/sessions", error);
  }
  redirect("/admin/sessions?ok=" + encodeURIComponent("Term dates saved. The current term follows these dates."));
}

const ENQUIRY_BACK: Record<string, string> = { apply: "/apply", inquire: "/inquire", tour: "/visit", teach: "/teach" };
const ENQUIRY_OK: Record<string, string> = {
  apply: "Received. This is a request, not a place. The school will contact you. A parent login opens only after admin enrols the child.",
  inquire: "Received. The school will reply.",
  tour: "Received. The school will confirm a day.",
  teach: "Received. The school will read your application. It does not create a staff login.",
};

export async function submitEnquiry(formData: FormData) {
  const kind = String(formData.get("kind") || "");
  const back = ENQUIRY_BACK[kind] || "/";
  try {
    if (String(formData.get("company") || "").trim()) redirect(back + "?ok=" + encodeURIComponent(ENQUIRY_OK[kind] || "Received."));
    if (!ENQUIRY_OK[kind]) throw new SchoolError("That form is not open.");
    const phone = normalizePhone(String(formData.get("phone") || ""));
    if (!phone) throw new SchoolError("Enter a Nigerian mobile number, for example 08035550101.");
    mutate.submitEnquiry({
      kind: kind as "apply" | "inquire" | "tour" | "teach",
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone,
      childName: String(formData.get("childName") || ""),
      childDob: String(formData.get("childDob") || ""),
      stage: String(formData.get("stage") || ""),
      previousSchool: String(formData.get("previousSchool") || ""),
      visitOn: String(formData.get("visitOn") || ""),
      subject: String(formData.get("subject") || ""),
      note: String(formData.get("note") || ""),
    });
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "?ok=" + encodeURIComponent(ENQUIRY_OK[kind]));
}

export async function setEnquiryStatus(formData: FormData) {
  await requireUser("admin");
  const back = "/admin/enquiries";
  try {
    const status = String(formData.get("status") || "");
    if (status !== "new" && status !== "seen") throw new SchoolError("Choose a status.");
    mutate.setEnquiryStatus(Number(formData.get("id")), status);
  } catch (error) {
    bounce(back, error);
  }
  redirect(back + "?ok=" + encodeURIComponent("Front door updated."));
}

export async function markNoticesRead() {
  const user = await requireUser();
  mutate.markNoticesRead(user.id);
  redirect("/parent/notices?ok=" + encodeURIComponent("Notices marked read."));
}
