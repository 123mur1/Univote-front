"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_OTP, demoAccounts } from "@/lib/data";
import { btn, input, label } from "@/components/ui";
import { AlertIcon, ArrowLeftIcon, KeyIcon } from "@/components/icons";

type Role = "student" | "officer";

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo(account: (typeof demoAccounts)[number]) {
    setRole(account.role);
    setIdentifier(account.identifier);
    setPassword(account.password);
    setError("");
  }

  function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    const account = demoAccounts.find(
      (a) => a.role === role && a.identifier.toLowerCase() === identifier.trim().toLowerCase() && a.password === password,
    );
    if (!account) {
      setError("Those details don't match a demo account. Use one of the demo accounts below.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 600);
  }

  function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setError(`Incorrect code. In the demo the code is always ${DEMO_OTP}.`);
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => router.push(role === "student" ? "/student" : "/admin"), 600);
  }

  const errorBox = error && (
    <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      <AlertIcon width={18} height={18} className="shrink-0" /> {error}
    </p>
  );

  if (step === "otp") {
    return (
      <form onSubmit={submitOtp}>
        <button
          type="button"
          onClick={() => {
            setStep("credentials");
            setError("");
          }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-urblue hover:underline"
        >
          <ArrowLeftIcon width={16} height={16} /> Back
        </button>
        <h2 className="text-2xl font-bold tracking-tight">Enter your code</h2>
        <p className="mt-2 text-sm text-slate-600">
          We sent a 6-digit code to the university email linked to{" "}
          <span className="font-medium text-foreground">{identifier}</span>. It expires in 5 minutes.
        </p>
        <label htmlFor="otp" className={`${label} mt-6`}>One-time code</label>
        <input
          id="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className={`${input} text-center font-mono text-2xl tracking-[0.5em]`}
          placeholder="••••••"
          required
          autoFocus
        />
        {errorBox}
        <button type="submit" className={`${btn.primary} mt-6 w-full`} disabled={otp.length !== 6 || loading}>
          {loading ? "Verifying…" : "Verify and continue"}
        </button>
        <div className="mt-6 flex items-center justify-between rounded-lg bg-urblue-50 px-3 py-2.5 text-sm">
          <span className="text-slate-600">Demo code: <span className="font-mono font-semibold text-urblue">{DEMO_OTP}</span></span>
          <button type="button" onClick={() => setOtp(DEMO_OTP)} className="font-semibold text-urblue hover:underline">
            Fill in
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitCredentials}>
      <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
      <p className="mt-2 text-sm text-slate-600">Use your university credentials.</p>

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-urblue-50 p-1" role="tablist">
        {(["student", "officer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={role === r}
            onClick={() => {
              setRole(r);
              setError("");
            }}
            className={`rounded-md py-2 text-sm font-semibold transition ${
              role === r ? "bg-urblue text-white shadow-sm" : "text-urblue hover:bg-urblue-100"
            }`}
          >
            {r === "student" ? "Student" : "Election officer"}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="identifier" className={label}>{role === "student" ? "Student ID" : "Staff email"}</label>
          <input
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder={role === "student" ? "2024/BUS/0388" : "officer@univ.edu"}
            className={input}
            autoComplete="username"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={label}>Password</label>
            <a href="#" className="mb-1.5 text-xs font-medium text-urblue hover:underline">Forgot password?</a>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {errorBox}

      <button type="submit" className={`${btn.primary} mt-6 w-full`} disabled={loading}>
        {loading ? "Checking…" : "Continue"}
      </button>

      <div className="mt-8 rounded-xl border border-urblue-200 bg-urblue-50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-urblue">
          <KeyIcon width={18} height={18} /> Demo accounts
        </p>
        <ul className="mt-3 space-y-2">
          {demoAccounts.map((a) => (
            <li key={a.identifier} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-xs ring-1 ring-urblue-100">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{a.label}</p>
                <p className="mt-0.5 truncate font-mono text-slate-600">{a.identifier} · {a.password}</p>
              </div>
              <button
                type="button"
                onClick={() => fillDemo(a)}
                className="shrink-0 rounded-md bg-urblue px-3 py-1.5 text-xs font-semibold text-white hover:bg-urblue-dark"
              >
                Use
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-600">
          One-time code for every account: <span className="font-mono font-semibold text-urblue">{DEMO_OTP}</span>
        </p>
      </div>
    </form>
  );
}
