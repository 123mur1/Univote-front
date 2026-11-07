import type { Metadata } from "next";
import { Card } from "@/components/ui";
import { ChainIcon, CheckCircleIcon, EyeOffIcon, ShieldIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "About UniVote" };

const principles = [
  { icon: <UsersIcon />, title: "Eligibility & authentication", body: "Only enrolled students on the voter roll can sign in and vote." },
  { icon: <EyeOffIcon />, title: "Ballot secrecy", body: "A voter's identity is checked separately from their ballot." },
  { icon: <ChainIcon />, title: "Transparency & accountability", body: "Sensitive actions are recorded so they can be reviewed." },
  { icon: <ShieldIcon />, title: "Tamper detection", body: "Published encrypted ballots and verification tools help detect changes." },
  { icon: <CheckCircleIcon />, title: "Equal rules for all", body: "The same voting rules and election timings apply to every eligible student." },
];

export default function AboutPage() {
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
    <p className="text-sm font-semibold uppercase tracking-wider text-urblue">About us</p>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Built on five principles</h1>
    <p className="mt-3 max-w-2xl text-slate-600">UniVote supports fair, secure and verifiable campus elections.</p>
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {principles.map((p) => <Card key={p.title} className="p-6">
        <span className="inline-flex rounded-lg bg-urblue p-2.5 text-white">{p.icon}</span>
        <h2 className="mt-4 font-semibold">{p.title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
      </Card>)}
    </div>
  </section>;
}
