"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_OTP, demoAccounts } from "@/lib/data";
import { managedStaff, registeredStudents, updateManagedStaff, updateRegisteredStudent, verifyPassword } from "@/lib/accounts";
import { logActivity } from "@/lib/activity";
import { findInRegistry } from "@/lib/registry";
import { readRegistry } from "@/lib/registry-store";
import { homeFor, sessionFromAuth, startSession, type ApiUser } from "@/lib/session";
import { useSettings, type Role } from "@/lib/settings";
import { apiRequest } from "@/lib/api-client";
import { demoMode } from "@/lib/runtime-mode";
import { AlertIcon, ArrowLeftIcon, KeyIcon, LockIcon } from "@/components/icons";

type Pending = { role: Role; name: string; detail: string; regNumber?: string; registeredStudentId?: string; email?: string; userId?: string; accessToken?: string; refreshToken?: string; accessExpiresAt?: number };
type ApiAuth = { accessToken?: string; refreshToken?: string | null; expiresIn?: number; requiresOtp?: boolean; challengeId?: string; developmentCode?: string; user?: ApiUser };

const REASONS: Record<string, { tone: "info" | "warn"; text: string }> = {
  timeout: { tone: "warn", text: "You were signed out because your session was inactive. Sign in again to continue." },
  expired: { tone: "warn", text: "Your session has expired. Sign in again to pick up where you left off." },
  signedout: { tone: "info", text: "You have signed out. See you next time." },
  role: { tone: "warn", text: "That page belongs to a different role. Sign in with the right account." },
  signin: { tone: "info", text: "Please sign in to continue." },
};

const subscribeNone = () => () => {};
const readQuery = () => window.location.search;

export function LoginForm() {
  const router = useRouter();
  const settings = useSettings();
  const query = useSyncExternalStore(subscribeNone, readQuery, () => "");
  const params = new URLSearchParams(query);
  const notice = REASONS[params.get("reason") ?? ""];
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [pending, setPending] = useState<Pending | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiChallenge, setApiChallenge] = useState("");
  const [apiOtpCode, setApiOtpCode] = useState("");

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setIdentifier(account.identifier);
    setPassword(account.password);
    setError("");
  }

  function fail(message: string, actor: string, detail: string) {
    logActivity({ actor, role: "anonymous", type: "login_failed", severity: "warning", detail });
    setError(message);
    setLoading(false);
  }

  function enter(p: Pending) {
    startSession(p);
    logActivity({ actor: p.regNumber ?? p.email ?? p.detail, role: p.role, type: "login", severity: "info", detail: `${p.name} signed in as ${p.role}.` });
    const next = params.get("next");
    router.push(next && next.startsWith(homeFor(p.role)) ? next : homeFor(p.role));
  }

  async function resolve(id: string): Promise<Pending | string> {
    const demo = demoAccounts.find((a) => a.identifier.toLowerCase() === id);
    if (demo) {
      if (demo.password !== password) return "wrong";
      return { role: demo.role, name: demo.name, detail: demo.identifier, regNumber: "regNumber" in demo ? demo.regNumber : undefined, email: demo.role === "student" ? undefined : demo.identifier };
    }

    const staff = managedStaff().find((s) => s.email.toLowerCase() === id);
    if (staff) {
      if (!staff.active) return "This staff account is suspended. Contact the system administrator.";
      if ((staff.failedLogins ?? 0) >= settings.maxFailedLogins) return "This account is locked after too many failed attempts. Ask the system administrator to unlock it.";
      if (!(await verifyPassword(password, staff.passwordHash))) {
        updateManagedStaff(staff.email, { failedLogins: (staff.failedLogins ?? 0) + 1 });
        return "wrong";
      }
      updateManagedStaff(staff.email, { failedLogins: 0, lastLoginAt: new Date().toISOString() });
      return { role: staff.role, name: staff.name, detail: staff.email, email: staff.email };
    }

    const student = registeredStudents().find((s) => s.email.toLowerCase() === id || s.regNumber.toLowerCase() === id);
    if (student) {
      if (student.suspended) return "This student account is suspended. Contact the election office.";
      if ((student.failedLogins ?? 0) >= settings.maxFailedLogins) return "This account is locked after too many failed attempts. Contact the election office to unlock it.";
      if (!(await verifyPassword(password, student.passwordHash))) {
        updateRegisteredStudent(student.id, { failedLogins: (student.failedLogins ?? 0) + 1 });
        return "wrong";
      }
      const record = findInRegistry(readRegistry(), student.regNumber);
      if (!record || record.enrolment === "Withdrawn") {
        return "The registry office no longer lists you as a student, so this account can't be used. Contact the registry office.";
      }
      updateRegisteredStudent(student.id, { failedLogins: 0, lastLoginAt: new Date().toISOString() });
      return { role: "student", name: `${student.firstName} ${student.lastName}`, detail: student.regNumber, regNumber: student.regNumber, registeredStudentId: student.id, email: student.email };
    }
    return "wrong";
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const id = identifier.trim().toLowerCase();
    if (!demoMode) {
      let payload: ApiAuth;
      try {
        payload = await apiRequest<ApiAuth>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ identifier: identifier.trim(), password }),
        });
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : "The sign-in service is unavailable. Please try again.", id, "Backend sign-in failed.");
        return;
      }
      if (payload.requiresOtp && payload.challengeId) {
        setApiChallenge(payload.challengeId);
        setApiOtpCode(payload.developmentCode ?? "");
        setPending({ role: "student", name: payload.user?.name ?? "UniVote user", detail: identifier.trim() });
        setLoading(false);
        setStep("otp");
        return;
      }
      if (payload.accessToken && payload.user) {
        enter(sessionFromAuth({ ...payload, accessToken: payload.accessToken, user: payload.user }, identifier.trim()));
        return;
      }
      fail("The sign-in response from the server was incomplete. Please try again.", id, "Incomplete backend sign-in response.");
      return;
    }
    const result = await resolve(id);
    if (typeof result === "string") {
      const wrong = result === "wrong";
      fail(
        wrong ? "We couldn't sign you in with those details. Check your username, email or registration number and password." : result,
        identifier.trim() || "unknown",
        wrong ? `Wrong credentials for "${identifier.trim()}".` : result,
      );
      return;
    }
    // Demo administrators sign in with username and password only.
    const needsCode = result.role !== "admin" && settings.otpRequired[result.role];
    if (!needsCode) {
      enter(result);
      return;
    }
    setPending(result);
    window.setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 350);
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    if (apiChallenge) {
      setLoading(true);
      try {
        const payload = await apiRequest<ApiAuth>("/auth/otp/verify", {
          method: "POST",
          body: JSON.stringify({ challengeId: apiChallenge, code: otp }),
        });
        if (!payload.accessToken || !payload.user) throw new Error("The verification response from the server was incomplete.");
        enter(sessionFromAuth({ ...payload, accessToken: payload.accessToken, user: payload.user }, pending.detail));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not verify the code.");
        setLoading(false);
      }
      return;
    }
    if (otp !== DEMO_OTP) {
      fail("That code doesn't match. Check the code and try again.", pending.regNumber ?? pending.detail, `Wrong one-time code for ${pending.name}.`);
      return;
    }
    setError("");
    setLoading(true);
    enter(pending);
  }

  const errorBox = error && (
    <p role="alert" className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700">
      <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" /> {error}
    </p>
  );

  if (step === "otp") {
    return (
      <form onSubmit={submitOtp}>
        <button
          type="button"
          onClick={() => { setStep("credentials"); setPending(null); setError(""); setOtp(""); setApiChallenge(""); setApiOtpCode(""); }}
          className="mb-7 inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-urblue transition hover:text-urblue-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-urblue"
        >
          <ArrowLeftIcon width={17} height={17} /> Back to sign in
        </button>
        <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue ring-1 ring-urblue-100">
          <LockIcon width={22} height={22} />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-urblue">Second step</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Confirm it’s you</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter the six-digit sign-in code for <span className="font-semibold text-slate-800">{identifier}</span>.
        </p>

        <label htmlFor="otp" className="mb-2 mt-7 block text-sm font-semibold text-slate-700">One-time code</label>
        <input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
          className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-center font-mono text-2xl font-semibold tracking-[0.5em] text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-urblue focus:ring-4 focus:ring-urblue/10"
          placeholder="••••••"
          aria-describedby="otp-help"
          required
          autoFocus
        />
        <p id="otp-help" className="mt-2 text-xs text-slate-500">{apiChallenge ? "Enter the one-time code provided by the backend." : "For this demo, use the code shown below."}</p>
        {errorBox}
        <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-urblue px-4 py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(0,98,139,0.8)] transition hover:bg-urblue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue disabled:cursor-not-allowed disabled:opacity-50" disabled={otp.length !== 6 || loading}>
          {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</> : "Verify and continue"}
        </button>
        {apiChallenge ? apiOtpCode && <div className="mt-5 flex items-center justify-between rounded-xl border border-urblue-100 bg-urblue-50/70 px-4 py-3 text-sm"><span className="text-slate-600">Development code <span className="ml-1 font-mono font-bold tracking-wider text-urblue">{apiOtpCode}</span></span><button type="button" onClick={() => setOtp(apiOtpCode)} className="font-bold text-urblue hover:underline">Fill in</button></div> : demoMode && <div className="mt-5 flex items-center justify-between rounded-xl border border-urblue-100 bg-urblue-50/70 px-4 py-3 text-sm">
          <span className="text-slate-600">Demo code <span className="ml-1 font-mono font-bold tracking-wider text-urblue">{DEMO_OTP}</span></span>
          <button type="button" onClick={() => setOtp(DEMO_OTP)} className="font-bold text-urblue hover:underline">Fill in</button>
        </div>}
      </form>
    );
  }

  return (
    <>
      {notice && (
        <p role="status" className={`mb-6 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-5 ${notice.tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-urblue-100 bg-urblue-50 text-urblue-dark"}`}>
          <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" /> {notice.text}
        </p>
      )}
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-urblue">Welcome to UniVote</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.1rem]">Sign in to your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Students use their registration number or email. Staff use their staff email.</p>
      </div>

      <form onSubmit={submitCredentials}>
        <div className="space-y-5">
          <div>
            <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-700">Username, email or registration number</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              placeholder="2024/BUS/0388, name@ur.ac.rw or admin"
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-urblue focus:ring-4 focus:ring-urblue/10"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 pr-14 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-urblue focus:ring-4 focus:ring-urblue/10"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 flex items-center rounded-r-xl px-4 text-xs font-bold text-slate-500 transition hover:text-urblue focus-visible:outline-2 focus-visible:outline-urblue" aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {errorBox}
        <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-urblue px-4 py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(0,98,139,0.8)] transition hover:bg-urblue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue disabled:cursor-not-allowed disabled:opacity-50" disabled={loading}>
          {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Checking details…</> : "Continue"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">New student? <Link href="/register" className="font-bold text-urblue underline decoration-urblue/30 underline-offset-4 transition hover:decoration-urblue">Create an account</Link></p>

      {demoMode && <details className="group mt-7 rounded-xl border border-slate-200 bg-slate-50/70 open:bg-white open:shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 marker:hidden [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2.5"><span className="flex size-8 items-center justify-center rounded-lg bg-white text-urblue ring-1 ring-slate-200"><KeyIcon width={17} height={17} /></span>Try a demo account</span>
          <svg className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </summary>
        <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-3">
          {demoAccounts.map((account) => (
            <div key={account.identifier} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">{account.label}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">{account.identifier} · {account.password}</p>
              </div>
              <button type="button" onClick={() => fillDemo(account)} className="shrink-0 rounded-lg border border-urblue-200 px-3 py-1.5 text-xs font-bold text-urblue transition hover:bg-urblue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue">Use</button>
            </div>
          ))}
          <p className="px-1 pt-1 text-[11px] leading-5 text-slate-500">One-time code for students and officers: <span className="font-mono font-bold text-urblue">{DEMO_OTP}</span>. The administrator signs in without a code. Staff accounts are created by the administrator.</p>
        </div>
      </details>}
    </>
  );
}
