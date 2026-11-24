"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { formatDateTime, formatDay, nominationsOpen, relativeTime, scopeText, useStudentOverview, type StudentElection, type StudentOverview } from "@/lib/student-api";
import { Badge, CandidatePhoto, Card, EmptyState, Panel, ProgressBar, SectionHeader, Skeleton, StatCard, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { AlertIcon, ArrowRightIcon, BallotIcon, CalendarIcon, ChartIcon, CheckCircleIcon, ClockIcon, LockIcon, ShieldIcon, TrophyIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

const statusOf = (e: StudentElection) => e.status.toLowerCase() as "upcoming" | "open" | "closed" | "published";

export default function StudentDashboard() {
  const session = useSession();
  const { data, error, reload } = useStudentOverview();

  if (error && !data) {
    return (
      <EmptyState
        className="mx-auto max-w-xl"
        icon={<AlertIcon width={26} height={26} className="text-amber-600" />}
        title="We couldn't load your dashboard"
        text={error}
        action={<button type="button" onClick={reload} className={btn.primary}>Try again</button>}
      />
    );
  }
  if (!data) return <DashboardSkeleton />;

  const open = data.elections.filter((e) => e.status === "OPEN");
  const actionNeeded = open.filter((e) => e.canVote && !e.voted);
  const upcoming = data.elections.filter((e) => e.status === "UPCOMING");
  const published = data.elections.filter((e) => e.status === "PUBLISHED").reverse();
  const applyable = data.elections.filter((e) => e.inScope && nominationsOpen(e));
  const name = data.record ? `${data.record.firstName} ${data.record.lastName}` : session?.name ?? "Student";
  const votesCast = data.elections.filter((e) => e.voted).length;
  const active = data.elections.filter((e) => e.status !== "PUBLISHED");

  return (
    <div className="space-y-8">
      <Welcome name={name} data={data} waiting={actionNeeded.length} />

      {actionNeeded.length > 0 && (
        <div className="univote-stagger space-y-4">
          {actionNeeded.map((e) => <VoteNow key={e.id} election={e} />)}
        </div>
      )}

      <div className="univote-stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Voting now" value={String(open.length)} hint={actionNeeded.length ? `${actionNeeded.length} waiting for your vote` : "Nothing waiting for you"} icon={<BallotIcon width={18} height={18} />} tone={actionNeeded.length ? "action" : "plain"} href="/student/elections" />
        <StatCard label="Upcoming" value={String(upcoming.length)} hint="Scheduled elections" icon={<CalendarIcon width={18} height={18} />} href="/student/elections" />
        <StatCard label="Votes cast" value={String(votesCast)} hint="This academic year" icon={<CheckCircleIcon width={18} height={18} />} href="/student/verify" />
        <StatCard label="Results out" value={String(published.length)} hint="Published elections" icon={<ChartIcon width={18} height={18} />} href="/student/results" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <SectionHeader title="Your elections" description="Everything scheduled for your college, school and campus." action={<Link href="/student/elections" className="inline-flex items-center gap-1 text-sm font-bold text-urblue hover:underline">See all <ArrowRightIcon width={15} height={15} /></Link>} />
            {active.length === 0 ? (
              <EmptyState icon={<BallotIcon width={26} height={26} />} title="No elections scheduled" text="When the Electoral Commission schedules an election you will be notified here." />
            ) : (
              <div className="univote-stagger grid gap-4 md:grid-cols-2">
                {active.map((e) => <ElectionCard key={e.id} election={e} />)}
              </div>
            )}
          </section>

          <section>
            <SectionHeader title="Latest results" description="Official outcomes published by the Electoral Commission." action={<Link href="/student/results" className="inline-flex items-center gap-1 text-sm font-bold text-urblue hover:underline">All results <ArrowRightIcon width={15} height={15} /></Link>} />
            {published.length === 0 ? (
              <EmptyState icon={<TrophyIcon width={26} height={26} />} title="No results published yet" text="Official results appear here as soon as the Electoral Commission publishes them." />
            ) : (
              <div className="space-y-4">{published.slice(0, 2).map((e) => <ResultPreview key={e.id} election={e} />)}</div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <JourneyCard data={data} votesCast={votesCast} hasOpen={open.length > 0} />
          <CandidacyCard data={data} applyable={applyable} />
          <RecordCard data={data} />
        </aside>
      </div>
    </div>
  );
}

function Welcome({ name, data, waiting }: { name: string; data: StudentOverview; waiting: number }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const r = data.record;
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep p-6 text-white shadow-[var(--shadow-brand)] sm:p-8">
      <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent)]" />
      <div aria-hidden="true" className="univote-rope univote-spin-slow pointer-events-none absolute -right-20 -top-24 size-80 text-white/10" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-urblue-200">{greeting},</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[2rem]">{name}</h1>
          {r && <p className="mt-2 max-w-xl text-sm text-urblue-100/90">{r.programme || r.department}{r.yearOfStudy ? ` · Year ${r.yearOfStudy}` : ""} · {r.school} · {r.campus} campus</p>}
          <p className="mt-4 text-sm font-medium text-white/90">
            {waiting > 0
              ? <>You have <span className="font-extrabold text-white">{waiting} election{waiting === 1 ? "" : "s"}</span> waiting for your vote.</>
              : "You're all caught up. We'll let you know when the next vote opens."}
          </p>
        </div>
        <div className={`flex items-center gap-3 self-start rounded-2xl p-3 pr-5 md:self-auto ${data.standing.ok ? "bg-white text-slate-900 shadow-xl" : "bg-amber-400 text-amber-950"}`}>
          <span className={`flex size-11 items-center justify-center rounded-xl ${data.standing.ok ? "bg-emerald-50 text-emerald-600" : "bg-amber-950/10"}`}>
            {data.standing.ok ? <ShieldIcon width={22} height={22} /> : <AlertIcon width={22} height={22} />}
          </span>
          <span>
            <span className="block text-[11px] font-bold uppercase tracking-wider opacity-60">Voter status</span>
            <span className="block text-sm font-bold">{data.standing.ok ? `Eligible · ${data.academicYear}` : "Not eligible to vote"}</span>
            {!data.standing.ok && <span className="block max-w-56 text-xs font-medium">{data.standing.reasons[0]}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function VoteNow({ election: e }: { election: StudentElection }) {
  const candidates = e.contests.reduce((sum, c) => sum + c.candidates.length, 0);
  return (
    <div className="group relative overflow-hidden rounded-3xl border-2 border-urblue bg-white p-5 shadow-[0_0_0_6px_rgba(0,98,139,.08)] sm:p-6">
      <div aria-hidden="true" className="univote-dots-bg pointer-events-none absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_left,black,transparent)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-urblue to-urblue-darker text-white shadow-[var(--shadow-brand)]">
          <BallotIcon width={30} height={30} />
          <span className="absolute -right-1 -top-1 flex size-4"><span className="univote-ping relative size-4 rounded-full bg-emerald-500 text-emerald-400 ring-2 ring-white" /></span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-urblue">Your vote is needed</p>
          <h2 className="mt-1 text-xl font-extrabold text-slate-900">{e.title}</h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5"><BallotIcon width={15} height={15} className="text-urblue" />{e.contests.length} position{e.contests.length === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1.5"><UsersIcon width={15} height={15} className="text-urblue" />{candidates} candidate{candidates === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700"><ClockIcon width={15} height={15} />Closes {relativeTime(e.closesAt)}</span>
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(e.closesAt)}</p>
        </div>
        <Link href={`/student/elections/${e.id}`} className={`${btn.primary} px-6! py-3.5!`}>
          Vote now <ArrowRightIcon width={18} height={18} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function ElectionCard({ election: e }: { election: StudentElection }) {
  const candidates = e.contests.reduce((sum, c) => sum + c.candidates.length, 0);
  const canApply = e.inScope && nominationsOpen(e);
  const voteNow = e.status === "OPEN" && e.canVote && !e.voted;
  return (
    <Card className="flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={statusOf(e)} />
        {e.voted ? <Badge tone="green"><CheckCircleIcon width={13} height={13} /> You voted</Badge> : !e.inScope ? <Badge tone="gray">Outside your unit</Badge> : e.canVote ? <Badge tone="blue">You can vote</Badge> : <Badge tone="amber">Not eligible</Badge>}
      </div>
      <h3 className="mt-3 font-bold leading-snug text-slate-900">{e.title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{scopeText(e)}</p>
      <dl className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2"><CalendarIcon width={16} height={16} className="text-urblue" />
          {e.status === "UPCOMING" ? <>Voting opens {relativeTime(e.opensAt)}</> : e.status === "OPEN" ? <>Voting closes {relativeTime(e.closesAt)}</> : <>Voting closed {formatDay(e.closesAt)} · counting</>}
        </div>
        <div className="flex items-center gap-2"><UsersIcon width={16} height={16} className="text-urblue" />{candidates} candidate{candidates === 1 ? "" : "s"} · {e.contests.length} position{e.contests.length === 1 ? "" : "s"}</div>
        {e.status === "OPEN" && (
          <div className="pt-2">
            <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-500">Turnout so far</span><span className="font-bold text-urblue">{percent(e.ballotsCast, e.eligibleCount)}</span></div>
            <ProgressBar value={e.ballotsCast} max={e.eligibleCount} />
          </div>
        )}
      </dl>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/student/elections/${e.id}`} className={`${voteNow ? btn.primary : btn.secondary} px-3.5! py-2! text-xs!`}>
          {voteNow ? "Vote now" : "View candidates"} <ArrowRightIcon width={14} height={14} />
        </Link>
        {canApply && <Link href={`/student/apply?election=${e.id}`} className={`${btn.ghost} px-3! py-2! text-xs!`}><UserPlusIcon width={14} height={14} /> Run for office</Link>}
      </div>
      {canApply && e.nominationsClose && <p className="mt-2 text-xs text-slate-500">Applications close {formatDay(e.nominationsClose)}</p>}
    </Card>
  );
}

function ResultPreview({ election: e }: { election: StudentElection }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold">{e.title}</h3>
          <p className="text-xs text-slate-500">{formatNumber(e.ballotsCast)} ballots · {percent(e.ballotsCast, e.eligibleCount)} turnout</p>
        </div>
        <Link href={`/student/results/${e.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-urblue hover:underline">Full results <ArrowRightIcon width={15} height={15} /></Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {e.contests.map((contest) => {
          const ranked = [...contest.candidates].sort((a, b) => (b.publishedVotes ?? 0) - (a.publishedVotes ?? 0));
          const total = ranked.reduce((sum, c) => sum + (c.publishedVotes ?? 0), 0);
          const winner = ranked[0];
          return (
            <li key={contest.id} className="rounded-2xl border border-slate-100 bg-gradient-to-br from-urblue-25 to-white p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{contest.title}</p>
              {winner ? (
                <div className="mt-2 flex items-center gap-3">
                  <CandidatePhoto name={winner.name} photo={winner.photoUrl ?? undefined} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate font-bold"><TrophyIcon width={15} height={15} className="shrink-0 text-amber-500" />{winner.name}</p>
                    <p className="text-xs text-slate-500">{formatNumber(winner.publishedVotes ?? 0)} votes · {percent(winner.publishedVotes ?? 0, total)}</p>
                    <div className="mt-1.5"><ProgressBar value={winner.publishedVotes ?? 0} max={total} size="sm" /></div>
                  </div>
                </div>
              ) : <p className="mt-2 text-sm text-slate-500">No candidates stood.</p>}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// A friendly checklist showing where the student is in this year's election cycle.
function JourneyCard({ data, votesCast, hasOpen }: { data: StudentOverview; votesCast: number; hasOpen: boolean }) {
  const steps = [
    { label: "Account verified", done: Boolean(data.record), href: "/student" },
    { label: "Eligible to vote", done: data.standing.ok, href: "/student" },
    { label: hasOpen ? "Cast your vote" : "Vote when an election opens", done: votesCast > 0, href: "/student/elections" },
    { label: "Verify your ballot", done: false, href: "/student/verify" },
  ];
  const done = steps.filter((s) => s.done).length;
  return (
    <Panel title="Your election journey" description={`${done} of ${steps.length} steps complete`} icon={<CheckCircleIcon width={18} height={18} />}>
      <ProgressBar value={done} max={steps.length} />
      <ol className="mt-4 space-y-1">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link href={s.href} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-urblue-25">
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                {s.done ? <CheckCircleIcon width={15} height={15} /> : i + 1}
              </span>
              <span className={`flex-1 text-sm ${s.done ? "text-slate-500 line-through decoration-slate-300" : "font-semibold text-slate-800"}`}>{s.label}</span>
              {!s.done && <ArrowRightIcon width={15} height={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-urblue" />}
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function RecordCard({ data }: { data: StudentOverview }) {
  const r = data.record;
  return (
    <Panel title="My registry record" description="Only the registry office can change these" icon={<ShieldIcon width={18} height={18} />} bodyClassName="">
      {r ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 p-5 text-sm">
          <Item label="Registration no." value={<span className="font-mono">{r.registrationNumber}</span>} wide />
          <Item label="College" value={r.college} wide />
          <Item label="School" value={r.school} wide />
          <Item label="Department" value={r.department} wide />
          {r.programme && <Item label="Programme" value={r.programme} wide />}
          <Item label="Campus" value={r.campus} />
          <Item label="Year" value={r.yearOfStudy ? `Year ${r.yearOfStudy}` : "—"} />
          <Item label="Status" value={<Badge tone={r.enrolment === "ACTIVE" ? "green" : "red"}>{r.enrolment.toLowerCase()}</Badge>} />
          <Item label="Registered for" value={r.registeredAcademicYear ?? "—"} />
          <Item label="Study period" value={`${formatDay(r.studyStart)} – ${formatDay(r.studyEnd)}`} wide />
        </dl>
      ) : (
        <p className="p-5 text-sm text-red-700">Your registration number is not on the current registry list. Contact the registry office.</p>
      )}
    </Panel>
  );
}

function Item({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

const NOMINATION_TONE = { PENDING: ["amber", "Under review"], APPROVED: ["green", "Approved"], REJECTED: ["red", "Not approved"] } as const;

function CandidacyCard({ data, applyable }: { data: StudentOverview; applyable: StudentElection[] }) {
  const c = data.candidacy;
  const checks = [
    { label: "Active registry record", pass: data.standing.ok },
    { label: `GPA of at least 2.5${c?.gpa != null ? ` (yours: ${c.gpa.toFixed(2)})` : ""}`, pass: Boolean(c?.gpaOk) },
    { label: "No open disciplinary case", pass: Boolean(c?.disciplinaryOk) },
  ];
  const ready = checks.every((check) => check.pass);
  return (
    <Panel title="Run for office" description={ready ? "You meet every requirement" : "Requirements to stand as a candidate"} icon={<UserPlusIcon width={18} height={18} />}>
      <ul className="space-y-2.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2.5 text-sm">
            {check.pass ? <CheckCircleIcon width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <LockIcon width={18} height={18} className="mt-0.5 shrink-0 text-slate-400" />}
            <span className={check.pass ? "text-slate-700" : "text-slate-500"}>{check.label}</span>
          </li>
        ))}
      </ul>
      {ready && applyable.length > 0 ? (
        <Link href="/student/apply" className={`${btn.primary} mt-5 w-full`}>Apply for a position <ArrowRightIcon width={16} height={16} /></Link>
      ) : (
        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          {!ready ? "You need to meet every requirement above to stand as a candidate." : "No election is accepting applications from your unit right now."}
        </p>
      )}
      <h3 className="mt-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">My applications</h3>
      {data.nominations.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">You haven&apos;t applied for any position.</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {data.nominations.map((n) => (
            <li key={n.id} className="rounded-xl border border-slate-100 p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{n.contest}</p>
                  <p className="text-xs text-slate-500">{n.election} · {formatDay(n.submittedAt)}</p>
                </div>
                <Badge tone={NOMINATION_TONE[n.status][0]}>{NOMINATION_TONE[n.status][1]}</Badge>
              </div>
              {n.decisionNote && <p className={`mt-2 rounded-lg p-2 text-xs ${n.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>Commission&apos;s note: {n.decisionNote}</p>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-48 rounded-[1.75rem]" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 rounded-2xl lg:col-span-2" /><Skeleton className="h-80 rounded-2xl" /></div>
    </div>
  );
}
