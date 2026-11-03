import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { EyeOffIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-urblue p-12 lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/3 size-96 rounded-full bg-white/5" />
        <Logo inverse />
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight text-white">
            One student. One vote per contest.
            <br />
            Nobody sees who you chose.
          </h1>
          <ul className="mt-8 space-y-4 text-urblue-100">
            <li className="flex gap-3"><ShieldIcon className="shrink-0 text-white" /> Eligibility checked against the university registry</li>
            <li className="flex gap-3"><EyeOffIcon className="shrink-0 text-white" /> Your identity is separated from your ballot</li>
            <li className="flex gap-3"><LockIcon className="shrink-0 text-white" /> Ballots encrypted before they leave your device</li>
          </ul>
        </div>
        <p className="text-xs text-urblue-200">University Electoral Commission</p>
      </div>

      <div className="flex flex-col items-center justify-center bg-white px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
