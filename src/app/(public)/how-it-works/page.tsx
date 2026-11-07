import type { Metadata } from "next";
import { BallotIcon, CheckCircleIcon, KeyIcon, LockIcon } from "@/components/icons";

export const metadata: Metadata = { title: "How voting works" };
const steps = [
  { icon: <KeyIcon />, title: "Sign in", body: "Use your student ID, password and the one-time code sent to your university email." },
  { icon: <BallotIcon />, title: "Cast your ballot", body: "Choose a candidate in each contest, review your choices and submit." },
  { icon: <LockIcon />, title: "Ballot protected", body: "Your ballot is stored separately from your identity." },
  { icon: <CheckCircleIcon />, title: "Check results", body: "After an authorized official publishes results, view the tally and verify your receipt." },
];
export default function HowItWorksPage() {
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <p className="text-sm font-semibold uppercase tracking-wider text-urblue">How it works</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Four steps to vote</h1>
    <ol className="mt-10 grid gap-6 md:grid-cols-4">{steps.map((s, i) => <li key={s.title}>
      <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-urblue-50 text-urblue">{s.icon}</span><span className="text-sm font-semibold text-urblue">Step {i + 1}</span></div>
      <h2 className="mt-4 font-semibold">{s.title}</h2><p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.body}</p>
    </li>)}</ol>
  </section>;
}
