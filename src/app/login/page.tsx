import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      headline="Your voice belongs in every election."
      text="Sign in to follow campus elections, meet the candidates and cast your vote in the elections you're eligible for."
      footer={<p className="text-xs leading-5 text-slate-500">Keep your password and one-time code private. Need help? Contact your campus election office.</p>}
    >
      <LoginForm />
    </AuthShell>
  );
}
