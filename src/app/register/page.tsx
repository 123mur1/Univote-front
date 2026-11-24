import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { StudentRegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Create student account" };

export default function RegisterPage() {
  return (
    <AuthShell
      wide
      headline="Your voice shapes our university."
      text="Create your student account in a minute. We check your registration number against the official UR registry, so your academic details are always correct."
      footer={<>Already registered? <Link href="/login" className="font-bold text-urblue hover:underline">Sign in</Link></>}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-urblue">Student sign up</p>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Create your student account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Start with your registration number. If you&apos;re on the registry, you&apos;ll confirm your details and choose a password.</p>
      <StudentRegistrationForm />
    </AuthShell>
  );
}
