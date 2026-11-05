"use client";

import { useState } from "react";
import Link from "next/link";
import { btn, input, label, Card } from "@/components/ui";
import { AlertIcon, CheckCircleIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { hashPassword, registeredStudents, saveRegisteredStudent, type RegisteredStudent } from "@/lib/accounts";
import { logActivity } from "@/lib/activity";
import { accountChecks, findInRegistry, formatDate, fullName, isEligible, type RegistryStudent } from "@/lib/registry";
import { useRegistry } from "@/lib/registry-store";
import { useSettings } from "@/lib/settings";

const MAX_CARD_BYTES = 2 * 1024 * 1024;

export function StudentRegistrationForm() {
  const registry = useRegistry();
  const settings = useSettings();
  const [step, setStep] = useState<"identify" | "account" | "done">("identify");
  const [regNumber, setRegNumber] = useState("");
  const [record, setRecord] = useState<RegistryStudent>();
  const [blocked, setBlocked] = useState<{ message: string }>();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [card, setCard] = useState<{ name: string; data: string }>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function refuse(message: string) {
    setBlocked({ message });
    logActivity({ actor: regNumber.trim().toUpperCase() || "unknown", role: "anonymous", type: "signup_blocked", severity: "warning", detail: message });
  }

  function identify(e: React.FormEvent) {
    e.preventDefault();
    setBlocked(undefined);
    if (!settings.allowStudentSignup) {
      refuse("Student sign-up is closed at the moment. Try again later or contact the election office.");
      return;
    }
    const r = findInRegistry(registry, regNumber);
    if (!r) {
      refuse("We couldn't find this registration number on the registry office's student list. Check it and try again.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const checks = accountChecks(r, settings.academicYear, today);
    if (!isEligible(checks)) {
      refuse("The registry office doesn't list this registration number as eligible for the current academic year.");
      return;
    }
    if (registeredStudents().some((s) => s.regNumber.toUpperCase() === r.regNumber.toUpperCase())) {
      refuse("An account already exists for this registration number. Sign in instead, or contact the election office if it isn't yours.");
      return;
    }
    setRecord(r);
    setStep("account");
  }

  function onCard(file?: File) {
    setError("");
    if (!file) return;
    if (!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type) || file.size > MAX_CARD_BYTES) {
      setError("Use a JPG, PNG, WebP or PDF file up to 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCard({ name: file.name, data: String(reader.result) });
    reader.readAsDataURL(file);
  }

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!record) return;
    setError("");
    if (password.length < settings.passwordMinLength) return setError(`Use at least ${settings.passwordMinLength} characters for your password.`);
    if (password !== confirm) return setError("The two passwords don't match.");
    if (!card) return setError("Upload a photo or PDF of your current student card.");
    setBusy(true);
    const student: RegisteredStudent = {
      id: crypto.randomUUID(),
      regNumber: record.regNumber,
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      phone: phone.trim(),
      passwordHash: await hashPassword(password),
      studentCardName: card.name,
      studentCardData: card.data,
      createdAt: new Date().toISOString(),
      createdForAcademicYear: settings.academicYear.label,
    };
    const result = saveRegisteredStudent(student);
    setBusy(false);
    if (result) return setError(result);
    logActivity({ actor: record.regNumber, role: "student", type: "signup", severity: "info", detail: `${fullName(record)} created an account (verified against the registry).` });
    setStep("done");
  }

  if (step === "done" && record) {
    return (
      <Card className="mt-6 border-emerald-200 bg-emerald-50 p-6">
        <CheckCircleIcon width={36} height={36} className="text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-900">Account created</h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
          Sign in with <strong className="font-mono">{record.regNumber}</strong> or <strong>{record.email}</strong> and your new password.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-emerald-900">
          Your eligibility is checked against the registry every time you vote. If you don&apos;t complete registration for
          the next academic year, or your study period ends, you won&apos;t be able to vote, even with this account.
        </p>
        <Link className={`${btn.primary} mt-5`} href="/login">Sign in</Link>
      </Card>
    );
  }

  if (step === "account" && record) {
    return (
      <form onSubmit={createAccount} className="mt-6 space-y-6">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-emerald-100 bg-emerald-50 px-5 py-4">
            <ShieldIcon className="shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Verified with the registry office</p>
              <p className="text-xs text-emerald-800">These details come from your student record and can&apos;t be changed here.</p>
            </div>
          </div>
          <dl className="grid gap-x-6 gap-y-4 p-5 text-sm sm:grid-cols-2 sm:p-6">
            {[
              ["Name", fullName(record)],
              ["Registration number", record.regNumber],
              ["University email", record.email],
              ["College", record.college],
              ["School", record.school],
              ["Department", record.department],
              ["Programme", record.programme],
              ["Campus", record.campus],
              ["Year of study", `Year ${record.yearOfStudy} · ${record.level}`],
              ["Registered for", record.registeredAcademicYear],
              ["Study period", `${formatDate(record.studyStart)} – ${formatDate(record.studyEnd)}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-slate-500">{k}</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 sm:px-6">
            Something wrong? Contact the registry office. Only they can change your student record.
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Account details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+250 7xx xxx xxx" required />
            </div>
            <div className="hidden sm:block" />
            <div>
              <label className={label} htmlFor="password">Create password</label>
              <input id="password" type="password" minLength={settings.passwordMinLength} autoComplete="new-password" className={input} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="mt-1 text-xs text-slate-500">At least {settings.passwordMinLength} characters.</p>
            </div>
            <div>
              <label className={label} htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" autoComplete="new-password" className={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="font-semibold">Student card</h2>
          <p className="mt-1 text-sm text-slate-600">Upload a clear photo or PDF of your current student card, up to 2 MB.</p>
          <input className="mt-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-urblue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-urblue hover:file:bg-urblue-100" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => onCard(e.target.files?.[0])} required />
          {card && <p className="mt-2 text-sm text-emerald-700">Selected: {card.name}</p>}
        </Card>

        {error && (
          <p role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertIcon width={18} height={18} className="shrink-0" /> {error}
          </p>
        )}
        <div className="flex flex-wrap justify-between gap-3">
          <button type="button" className={btn.secondary} onClick={() => { setStep("identify"); setRecord(undefined); }}>
            Back
          </button>
          <button className={btn.primary} type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Create my account"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={identify} className="mt-6 space-y-6">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <LockIcon width={18} height={18} className="text-urblue" />
          <h2 className="font-semibold">Step 1 · Check student eligibility</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Enter your registration number to check the registry for {settings.academicYear.label}. If eligible, continue directly to account setup.
        </p>
        <div className="mt-5">
          <label className={label} htmlFor="reg">Registration number</label>
          <input id="reg" className={`${input} font-mono uppercase`} value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="2024/BUS/0388" autoComplete="username" required />
        </div>
      </Card>

      {blocked && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="flex gap-2 font-medium">
            <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" /> {blocked.message}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button className={btn.primary} type="submit">Check eligibility</button>
      </div>

      <details className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <summary className="cursor-pointer font-medium text-slate-700">Demo registry records you can sign up with</summary>
        <ul className="mt-3 space-y-1.5 font-mono text-xs">
          <li>2023/SCI/0101 · 2003-02-18 · School of Science (can sign up)</li>
          <li>2024/ART/0560 · 2004-12-03 · School of Arts and Languages (can sign up)</li>
          <li>2024/LAW/0310 · 2004-05-02 · not registered for {settings.academicYear.label} (refused)</li>
          <li>2021/MED/0219 · 2001-06-15 · deferred (refused)</li>
        </ul>
      </details>
    </form>
  );
}
