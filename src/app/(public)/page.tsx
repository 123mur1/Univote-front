"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { elections as demoElections, type Election } from "@/lib/data";
import { useApiElections } from "@/lib/election-api";
import { btn, Card, ProgressBar, Ring, StatusBadge, formatNumber, percent } from "@/components/ui";
import {
  ArrowRightIcon,
  BallotIcon,
  CalendarIcon,
  ChainIcon,
  ChartIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  EyeOffIcon,
  FingerprintIcon,
  LockIcon,
  ShieldIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/icons";
import { CreatedElectionsPreview } from "@/components/views/created-elections-preview";

const HERO_IMAGES = [
  { src: "/ur-campus.png", label: "University of Rwanda campuses" },
  { src: "/ur-graduation.png", label: "University of Rwanda graduation" },
  { src: "/ur-community.jpg", label: "University of Rwanda student community" },
];

const STEPS = [
  {
    icon: FingerprintIcon,
    title: "Sign in securely",
    text: "Use your registration number and password, then confirm with a one-time code. Only students on the official registry can take part.",
    detail: ["Registry-checked identity", "One-time code on every sign-in", "Automatic sign-out when idle"],
  },
  {
    icon: UsersIcon,
    title: "Meet the candidates",
    text: "Read every approved candidate's manifesto, programme and year of study before you decide. All candidates are reviewed by the Electoral Commission.",
    detail: ["Commission-approved candidates only", "Full manifestos and profiles", "Positions for your college and school"],
  },
  {
    icon: BallotIcon,
    title: "Cast your ballot",
    text: "Pick one candidate or abstain for each position, review your choices, then submit. Your ballot is encrypted in your browser before it leaves your device.",
    detail: ["Review before you submit", "Encrypted on your device", "One student, one ballot"],
  },
  {
    icon: ShieldIcon,
    title: "Verify the result",
    text: "Keep your receipt code to confirm your ballot was counted, without revealing who you chose. Results are published with a public audit trail.",
    detail: ["Private receipt code", "Publicly verifiable results", "Tamper-evident audit log"],
  },
];

const FAQS = [
  { q: "Who can vote in an election?", a: "Every active student on the University of Rwanda registry who falls within the election's scope (for example your college, school or campus). Your dashboard shows exactly which elections you are eligible for, and why." },
  { q: "Can anyone see who I voted for?", a: "No. Your choices are encrypted in your browser before they are sent, and they are stored separately from your identity. Officers can see that you voted, never how you voted." },
  { q: "What if I make a mistake on my ballot?", a: "Before you submit, UniVote shows a review screen with every choice you made. You can go back and change anything. Once you confirm and submit, the ballot is final." },
  { q: "How do I stand as a candidate?", a: "When nominations are open for your unit, use “Run for office” in your student portal. You will see the requirements (such as minimum GPA), upload your documents and follow your application's review status." },
  { q: "How do I know the results are genuine?", a: "Each ballot produces a receipt code you can check on the Verify page. Published results include a cryptographic fingerprint, and every action by officials is written to a public audit log." },
];

export default function Home() {
  const [heroIndex, setHeroIndex] = useState(0);
  const apiElections = useApiElections();
  const apiIds = new Set(apiElections.map((election) => election.id));
  const elections = [...apiElections, ...demoElections.filter((election) => !apiIds.has(election.id))];
  const live = elections.filter((e) => e.status !== "published");
  const featured = live.find((e) => e.status === "open") ?? live[0];
  const published = elections.filter((e) => e.status === "published");

  useEffect(() => {
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % HERO_IMAGES.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {/* ------------------------------------------------------------------ Hero */}
      <section className="relative isolate overflow-hidden bg-urblue-deep">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={image.src}
            role="img"
            aria-label={image.label}
            className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-all duration-[1600ms] ease-out ${index === heroIndex ? "scale-100 opacity-100" : "scale-110 opacity-0"}`}
            style={{ backgroundImage: `url('${image.src}')` }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-urblue-deep via-urblue-deep/85 to-urblue-darker/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-urblue-deep via-transparent to-transparent" />
        <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />
        <div aria-hidden="true" className="univote-rope univote-spin-slow pointer-events-none absolute -right-40 -top-40 size-[560px] text-white/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:pb-32 lg:pt-20">
          <div className="univote-reveal">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ur-logo.png" alt="University of Rwanda" className="size-8 rounded-full bg-white object-contain p-0.5" />
              <span className="text-xs font-semibold text-white">University of Rwanda · Official student elections</span>
            </div>
            <h1 className="mt-7 max-w-3xl text-[2.6rem] font-extrabold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[4.1rem]">
              Your campus.<br />
              Your voice.<br />
              <span className="bg-gradient-to-r from-urblue-light via-urblue-200 to-white bg-clip-text text-transparent">Your vote, secured.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-urblue-100/90">
              Choose your student leaders in minutes, from any phone or laptop. Ballots are encrypted, anonymous and
              verifiable, so every voice at UR counts exactly once.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/login" className={`${btn.inverse} px-6! py-3.5! text-[15px]!`}>
                Sign in to vote <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link href="/elections" className={`${btn.ghostInverse} px-6! py-3.5! text-[15px]!`}>
                Browse elections
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-urblue-100/85">
              {[
                { icon: <LockIcon width={17} height={17} />, text: "End-to-end encrypted" },
                { icon: <EyeOffIcon width={17} height={17} />, text: "Anonymous by design" },
                { icon: <ChainIcon width={17} height={17} />, text: "Publicly auditable" },
              ].map((b) => (
                <li key={b.text} className="inline-flex items-center gap-2"><span className="text-urblue-light">{b.icon}</span>{b.text}</li>
              ))}
            </ul>
          </div>

          {featured && <HeroElectionCard election={featured} />}
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2" aria-label="Choose background image">
          {HERO_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setHeroIndex(index)}
              aria-label={`Show ${image.label}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === heroIndex ? "w-10 bg-white" : "w-2.5 bg-white/40 hover:bg-white/70"}`}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ Stats strip */}
      <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:px-6">
        <div className="univote-stagger grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-200/80 shadow-[var(--shadow-lift)] md:grid-cols-4">
          {[
            { value: String(live.filter((e) => e.status === "open").length), label: "Elections open now", icon: <BallotIcon /> },
            { value: String(live.filter((e) => e.status === "upcoming").length), label: "Upcoming elections", icon: <CalendarIcon /> },
            { value: formatNumber(elections.reduce((s, e) => s + e.ballotsCast, 0)), label: "Ballots cast", icon: <CheckCircleIcon /> },
            { value: String(published.length), label: "Results published", icon: <ChartIcon /> },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-4 bg-white p-5 sm:p-6">
              <span className="hidden size-11 shrink-0 items-center justify-center rounded-2xl bg-urblue-50 text-urblue sm:flex">{s.icon}</span>
              <div>
                <p className="text-2xl font-extrabold tracking-tight tabular-nums text-slate-900 sm:text-3xl">{s.value}</p>
                <p className="text-xs font-medium text-slate-500 sm:text-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ How it works */}
      <HowItWorks />

      {/* ------------------------------------------------------------------ Elections */}
      <section className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-urblue">Elections</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Happening across UR</h2>
              <p className="mt-2 max-w-xl text-slate-600">Follow live turnout and see what&apos;s coming up for your college, school and campus.</p>
            </div>
            <Link href="/elections" className={btn.secondary}>All elections <ArrowRightIcon width={16} height={16} /></Link>
          </div>
          <div className="univote-stagger mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {live.map((e) => <ElectionTile key={e.id} election={e} />)}
            <CreatedElectionsPreview />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ Roles */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-urblue">Built for everyone</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">One platform, every part of the election</h2>
        </div>
        <div className="univote-stagger mt-12 grid gap-5 md:grid-cols-3">
          {[
            { icon: <BallotIcon width={24} height={24} />, title: "Students", text: "See the elections you can vote in, compare candidates and cast your ballot from your phone in under two minutes.", href: "/login", cta: "Go to student portal" },
            { icon: <UserPlusIcon width={24} height={24} />, title: "Candidates", text: "Check you meet the requirements, submit your nomination and documents online, and follow your review status live.", href: "/student/apply", cta: "Run for office" },
            { icon: <ShieldIcon width={24} height={24} />, title: "Electoral Commission", text: "Create elections, review applicants, manage the voter roll and publish results with a tamper-evident audit trail.", href: "/login", cta: "Officer sign in" },
          ].map((r) => (
            <Link key={r.title} href={r.href} className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-urblue-200 hover:shadow-[var(--shadow-lift)]">
              <span aria-hidden="true" className="univote-rope pointer-events-none absolute -right-10 -top-10 size-36 text-urblue-100 transition-transform duration-700 group-hover:rotate-45" />
              <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-urblue to-urblue-darker text-white shadow-[var(--shadow-brand)] transition-transform duration-300 group-hover:scale-105">{r.icon}</span>
              <h3 className="relative mt-6 text-xl font-bold">{r.title}</h3>
              <p className="relative mt-2 text-sm leading-6 text-slate-600">{r.text}</p>
              <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-urblue">
                {r.cta} <ArrowRightIcon width={16} height={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ FAQ */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-urblue">Questions</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Good to know before you vote</h2>
            <p className="mt-3 text-slate-600">Still unsure? Read the full guide or contact your campus election office.</p>
            <Link href="/how-it-works" className={`${btn.secondary} mt-6`}>How UniVote works <ArrowRightIcon width={16} height={16} /></Link>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200/80 bg-white transition-all open:border-urblue-200 open:bg-urblue-25 open:shadow-sm" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all group-open:rotate-180 group-open:bg-urblue group-open:text-white">
                    <ChevronDownIcon width={16} height={16} />
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-7 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep px-6 py-12 sm:px-12 sm:py-16">
          <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent)]" />
          <div aria-hidden="true" className="univote-rope pointer-events-none absolute -bottom-24 -right-16 size-80 text-white/10" />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Ready to lead? Ready to choose?</h2>
              <p className="mt-3 text-lg text-urblue-100">Create your student account in a minute with your registration number, then vote or run for office.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className={`${btn.inverse} px-6! py-3.5!`}>Create my account <ArrowRightIcon width={18} height={18} /></Link>
              <Link href="/student/apply" className={`${btn.ghostInverse} px-6! py-3.5!`}><UserPlusIcon width={18} height={18} /> Run for office</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroElectionCard({ election: e }: { election: Election }) {
  return (
    <div className="univote-reveal-delay relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
      <div aria-hidden="true" className="absolute -inset-4 rounded-[2.2rem] bg-gradient-to-br from-urblue-light/30 to-transparent blur-2xl" />
      <div className="univote-float relative rounded-[1.75rem] border border-white/50 bg-white/95 p-6 shadow-[0_40px_100px_-30px_rgba(0,20,35,.8)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <StatusBadge status={e.status} />
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><CalendarIcon width={14} height={14} /> Closes {e.closes}</span>
        </div>
        <h2 className="mt-4 text-xl font-extrabold leading-tight text-slate-900">{e.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{e.scope}</p>

        <div className="mt-6 flex items-center gap-5 rounded-2xl bg-urblue-25 p-4 ring-1 ring-urblue-100">
          <Ring value={e.ballotsCast} max={e.eligibleVoters} size={76} stroke={8} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live turnout</p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-urblue">{formatNumber(e.ballotsCast)}</p>
            <p className="text-xs text-slate-500">of {formatNumber(e.eligibleVoters)} eligible students</p>
          </div>
        </div>

        <ul className="mt-5 space-y-2">
          {e.contests.slice(0, 3).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 text-sm">
              <span className="truncate font-semibold text-slate-800">{c.title}</span>
              <span className="flex shrink-0 -space-x-2">
                {c.candidates.slice(0, 3).map((cand) => (
                  <span key={cand.id} className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-urblue-100 to-urblue-200 text-[10px] font-bold text-urblue-darker ring-2 ring-white">
                    {cand.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <Link href={`/elections/${e.id}`} className={`${btn.primary} mt-5 w-full`}>
          View this election <ArrowRightIcon width={16} height={16} />
        </Link>
      </div>
    </div>
  );
}

function ElectionTile({ election: e }: { election: Election }) {
  const candidates = e.contests.reduce((s, c) => s + c.candidates.length, 0);
  return (
    <Link href={`/elections/${e.id}`} className="group">
      <Card className="flex h-full flex-col p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-urblue-200 group-hover:shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={e.status} />
          <ArrowRightIcon width={18} height={18} className="text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-urblue" />
        </div>
        <h3 className="mt-4 text-lg font-bold leading-snug text-slate-900 group-hover:text-urblue">{e.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{e.scope}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Opens</p>
            <p className="mt-0.5 font-semibold text-slate-800">{e.opens}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Closes</p>
            <p className="mt-0.5 font-semibold text-slate-800">{e.closes}</p>
          </div>
        </div>
        <div className="mt-auto pt-5">
          {e.status === "open" ? (
            <>
              <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-slate-500">Turnout</span><span className="font-bold text-urblue">{percent(e.ballotsCast, e.eligibleVoters)}</span></div>
              <ProgressBar value={e.ballotsCast} max={e.eligibleVoters} />
            </>
          ) : (
            <p className="text-xs font-medium text-slate-500">{e.contests.length} position{e.contests.length === 1 ? "" : "s"} · {candidates} candidate{candidates === 1 ? "" : "s"}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

function HowItWorks() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const Icon = step.icon;
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-urblue">How voting works</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Four simple steps, fully protected</h2>
        <p className="mt-3 text-slate-600">From sign-in to verified result, every step is designed to be quick for you and impossible to tamper with.</p>
      </div>
      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col gap-3" role="tablist" aria-label="Voting steps">
          {STEPS.map((s, i) => {
            const StepIcon = s.icon;
            const on = i === active;
            return (
              <button
                key={s.title}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 sm:p-5 ${on ? "border-urblue-200 bg-white shadow-[var(--shadow-lift)]" : "border-transparent bg-transparent hover:bg-urblue-25"}`}
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${on ? "bg-urblue text-white shadow-[var(--shadow-brand)]" : "bg-urblue-50 text-urblue"}`}>
                  <StepIcon width={22} height={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-xs font-bold uppercase tracking-wider ${on ? "text-urblue" : "text-slate-400"}`}>Step {i + 1}</span>
                  <span className="block text-base font-bold text-slate-900">{s.title}</span>
                </span>
                <ArrowRightIcon width={18} height={18} className={`shrink-0 transition-all ${on ? "translate-x-0 text-urblue opacity-100" : "-translate-x-2 opacity-0"}`} />
              </button>
            );
          })}
        </div>
        <div key={active} className="univote-sheet relative overflow-hidden rounded-3xl bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep p-8 text-white sm:p-10">
          <div className="univote-grid-bg pointer-events-none absolute inset-0 opacity-60" />
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 text-[11rem] font-extrabold leading-none text-white/[0.06]">0{active + 1}</span>
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Icon width={30} height={30} />
          </span>
          <h3 className="relative mt-6 text-2xl font-extrabold">{step.title}</h3>
          <p className="relative mt-3 max-w-md leading-7 text-urblue-100">{step.text}</p>
          <ul className="relative mt-7 space-y-3">
            {step.detail.map((d) => (
              <li key={d} className="flex items-center gap-3 text-sm font-semibold">
                <span className="flex size-6 items-center justify-center rounded-full bg-white text-urblue"><CheckCircleIcon width={15} height={15} /></span>
                {d}
              </li>
            ))}
          </ul>
          <div className="relative mt-8 flex gap-1.5">
            {STEPS.map((s, i) => (
              <span key={s.title} className={`h-1 rounded-full transition-all duration-500 ${i === active ? "w-10 bg-white" : "w-4 bg-white/30"}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
