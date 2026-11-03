"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DEMO_OTP, demoAccounts } from "@/lib/data";
import { managedOfficers, registeredStudents, verifyPassword } from "@/lib/accounts";
import { AlertIcon, ArrowLeftIcon, KeyIcon, LockIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setIdentifier(account.identifier);
    setPassword(account.password);
    setError("");
  }

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const account = demoAccounts.find((a) => a.identifier.toLowerCase() === normalizedIdentifier && a.password === password);
    let profile: { name: string; detail: string; registeredStudentId?: string } | undefined = account ? { name: account.name, detail: account.identifier } : undefined;
    let signedInRole: "student" | "officer" | "admin" | undefined = account?.role;

    if (!profile) {
      const student = registeredStudents().find((item) => item.email.toLowerCase() === normalizedIdentifier || item.registrationNumber.toLowerCase() === normalizedIdentifier);
      if (student && await verifyPassword(password, student.passwordHash)) {
        profile = { name: `${student.firstName} ${student.lastName}`, detail: student.registrationNumber, registeredStudentId: student.id };
        signedInRole = "student";
      }
    }

    if (!profile) {
      const officer = managedOfficers().find((item) => item.active && item.email.toLowerCase() === normalizedIdentifier);
      if (officer && await verifyPassword(password, officer.passwordHash)) {
        profile = { name: officer.name, detail: "Election Officer" };
        signedInRole = "officer";
      }
    }

    if (!profile) {
      setError("We couldn’t find an account with those details. Check your email or registration number and password, then try again.");
      return;
    }

    localStorage.setItem("univote.active-session.v1", JSON.stringify({ role: signedInRole, ...profile }));
    setError("");
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 350);
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setError("That code doesn’t match. Check the code and try again.");
      return;
    }
    setError("");
    setLoading(true);
    const session = JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null");
    window.setTimeout(() => router.push(session?.role === "student" ? "/student" : "/admin"), 450);
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
          onClick={() => { setStep("credentials"); setError(""); setOtp(""); }}
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
        <p id="otp-help" className="mt-2 text-xs text-slate-500">For this demo, use the code shown below.</p>
        {errorBox}
        <button type="submit" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-urblue px-4 py-3.5 text-sm font-bold text-white shadow-[0_6px_16px_-8px_rgba(0,98,139,0.8)] transition hover:bg-urblue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue disabled:cursor-not-allowed disabled:opacity-50" disabled={otp.length !== 6 || loading}>
          {loading ? <><span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Signing in…</> : "Verify and continue"}
        </button>
        <div className="mt-5 flex items-center justify-between rounded-xl border border-urblue-100 bg-urblue-50/70 px-4 py-3 text-sm">
          <span className="text-slate-600">Demo code <span className="ml-1 font-mono font-bold tracking-wider text-urblue">{DEMO_OTP}</span></span>
          <button type="button" onClick={() => setOtp(DEMO_OTP)} className="font-bold text-urblue hover:underline">Fill in</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-urblue">Welcome to UniVote</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-[2.1rem]">Sign in to your account</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use the email or student registration number linked to your account.</p>
      </div>

      <form onSubmit={submitCredentials}>
        <div className="space-y-5">
          <div>
            <label htmlFor="identifier" className="mb-2 block text-sm font-semibold text-slate-700">Email or student registration number</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
              placeholder="name@example.com or 2024/ABC/0123"
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

      <details className="group mt-7 rounded-xl border border-slate-200 bg-slate-50/70 open:bg-white open:shadow-sm">
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
          <p className="px-1 pt-1 text-[11px] leading-5 text-slate-500">Demo code for all accounts: <span className="font-mono font-bold text-urblue">{DEMO_OTP}</span>. Staff accounts are created by an administrator.</p>
        </div>
      </details>
    </>
  );
}
