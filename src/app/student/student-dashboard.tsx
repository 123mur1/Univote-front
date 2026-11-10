"use client";

import Link from "next/link";
import { useSession } from "@/lib/session";
import { formatDateTime, formatDay, nominationsOpen, relativeTime, scopeText, useStudentOverview, type StudentElection, type StudentOverview } from "@/lib/student-api";
import { Badge, CandidatePhoto, Card, ProgressBar, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { AlertIcon, ArrowRightIcon, BallotIcon, CalendarIcon, ChartIcon, CheckCircleIcon, LockIcon, ShieldIcon, TrophyIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

const statusOf = (e: StudentElection) => e.status.toLowerCase() as "upcoming" | "open" | "closed" | "published";

export default function StudentDashboard() {
  const session = useSession();
  const { data, error, reload } = useStudentOverview();

  if (error && !data) {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <AlertIcon width={30} height={30} className="mx-auto text-amber-600" />
        <h1 className="mt-3 text-lg font-bold">We couldn&apos;t load your dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <button type="button" onClick={reload} className={`${btn.primary} mt-5`}>Try again</button>
      </Card>
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

  return (
    <div className="space-y-8">
      <Welcome name={name} data={data} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Tile label="Voting now" value={open.length} hint={actionNeeded.length ? `${actionNeeded.length} waiting for your vote` : "Nothing waiting for you"} icon={<BallotIcon />} tone={actionNeeded.length ? "action" : "plain"} href="/student/elections" />
        <Tile label="Upcoming" value={upcoming.length} hint="Scheduled elections" icon={<CalendarIcon />} href="/student/elections" />
        <Tile label="Votes cast" value={votesCast} hint={`This academic year`} icon={<CheckCircleIcon />} href="/student/verify" />
        <Tile label="Results out" value={published.length} hint="Published elections" icon={<ChartIcon />} href="/student/results" />
      </div>

      {actionNeeded.map((e) => <VoteNow key={e.id} election={e} />)}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <SectionTitle title="Your elections" action={<Link href="/student/elections" className="text-sm font-semibold text-urblue hover:underline">See all</Link>} />
            {data.elections.filter((e) => e.status !== "PUBLISHED").length === 0 ? (
              <EmptyCard icon={<BallotIcon width={26} height={26} />} title="No elections scheduled" text="When the Electoral Commission schedules an election you will be notified here." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.elections.filter((e) => e.status !== "PUBLISHED").map((e) => <ElectionCard key={e.id} election={e} />)}
              </div>
            )}
          </section>

          <section>
            <SectionTitle title="Latest results" action={<Link href="/student/results" className="text-sm font-semibold text-urblue hover:underline">All results</Link>} />
            {published.length === 0 ? (
              <EmptyCard icon={<TrophyIcon width={26} height={26} />} title="No results published yet" text="Official results appear here as soon as the Electoral Commission publishes them." />
            ) : (
              <div className="space-y-4">{published.slice(0, 2).map((e) => <ResultPreview key={e.id} election={e} />)}</div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <RecordCard data={data} />
          <CandidacyCard data={data} applyable={applyable} />
        </aside>
      </div>
    </div>
  );
}

function Welcome({ name, data }: { name: string; data: StudentOverview }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const r = data.record;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-urblue-darker via-urblue-dark to-urblue p-6 text-white shadow-lg shadow-urblue/20 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-white/10 blur-2xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-24 size-64 rounded-full border border-white/10" />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-urblue-100">{greeting},</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name}</h1>
          {r && <p className="mt-2 max-w-xl text-sm text-urblue-100">{r.programme || r.department}{r.yearOfStudy ? ` · Year ${r.yearOfStudy}` : ""} · {r.school} · {r.campus} campus</p>}
        </div>
        <div className={`inline-flex items-center gap-2.5 self-start rounded-2xl px-4 py-3 text-sm font-semibold md:self-auto ${data.standing.ok ? "bg-white text-urblue" : "bg-amber-400 text-amber-950"}`}>
          {data.standing.ok ? <ShieldIcon width={20} height={20} /> : <AlertIcon width={20} height={20} />}
          <span>
            {data.standing.ok ? `Eligible voter · ${data.academicYear}` : "Not eligible to vote"}
            {!data.standing.ok && <span className="block text-xs font-medium">{data.standing.reasons[0]}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, hint, icon, href, tone = "plain" }: { label: string; value: number; hint: string; icon: React.ReactNode; href: string; tone?: "plain" | "action" }) {
  return (
    <Link href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue">
      <Card className={`h-full p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-5 ${tone === "action" ? "border-urblue ring-2 ring-urblue/15" : "group-hover:border-urblue-300"}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <span className={`rounded-xl p-2 ${tone === "action" ? "bg-urblue text-white" : "bg-urblue-50 text-urblue"}`}>{icon}</span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      </Card>
    </Link>
  );
}

function VoteNow({ election: e }: { election: StudentElection }) {
  const candidates = e.contests.reduce((sum, c) => sum + c.candidates.length, 0);
  return (
    <div className="flex flex-col gap-5 rounded-2xl border-2 border-urblue bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
      <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-urblue text-white shadow-md shadow-urblue/30">
        <BallotIcon width={28} height={28} />
      </span>
      <div className="flex-1">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-urblue-50 px-2.5 py-0.5 text-xs font-bold text-urblue"><span className="size-1.5 animate-pulse rounded-full bg-urblue" /> Your vote is needed</p>
        <h2 className="mt-2 text-lg font-bold text-slate-900">{e.title}</h2>
        <p className="mt-0.5 text-sm text-slate-600">{e.contests.length} position{e.contests.length === 1 ? "" : "s"} · {candidates} candidate{candidates === 1 ? "" : "s"} · closes {relativeTime(e.closesAt)} ({formatDateTime(e.closesAt)})</p>
      </div>
      <Link href={`/student/elections/${e.id}`} className={`${btn.primary} px-5! py-3!`}>
        Meet candidates & vote <ArrowRightIcon width={18} height={18} />
      </Link>
    </div>
  );
}

function ElectionCard({ election: e }: { election: StudentElection }) {
  const candidates = e.contests.reduce((sum, c) => sum + c.candidates.length, 0);
  const canApply = e.inScope && nominationsOpen(e);
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={statusOf(e)} />
        {e.voted ? <Badge tone="green">You voted</Badge> : !e.inScope ? <Badge tone="gray">Outside your unit</Badge> : e.canVote ? <Badge tone="blue">You can vote</Badge> : <Badge tone="amber">Not eligible</Badge>}
      </div>
      <h3 className="mt-3 font-semibold text-slate-900">{e.title}</h3>
      <p className="mt-0.5 text-xs text-slate-500">{scopeText(e)}</p>
      <dl className="mt-4 space-y-1.5 text-sm text-slate-600">
        <div className="flex items-center gap-2"><CalendarIcon width={16} height={16} className="text-urblue" />
          {e.status === "UPCOMING" ? <>Voting opens {relativeTime(e.opensAt)}</> : e.status === "OPEN" ? <>Voting closes {relativeTime(e.closesAt)}</> : <>Voting closed {formatDay(e.closesAt)} · counting</>}
        </div>
        <div className="flex items-center gap-2"><UsersIcon width={16} height={16} className="text-urblue" />{candidates} approved candidate{candidates === 1 ? "" : "s"} · {e.contests.length} position{e.contests.length === 1 ? "" : "s"}</div>
        {e.status === "OPEN" && <div className="pt-2"><ProgressBar value={e.ballotsCast} max={e.eligibleCount} /><p className="mt-1 text-xs text-slate-500">{percent(e.ballotsCast, e.eligibleCount)} turnout so far</p></div>}
      </dl>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Link href={`/student/elections/${e.id}`} className={`${e.status === "OPEN" && e.canVote && !e.voted ? btn.primary : btn.secondary} px-3! py-2! text-xs!`}>
          {e.status === "OPEN" && e.canVote && !e.voted ? "Vote now" : "View candidates"} <ArrowRightIcon width={14} height={14} />
        </Link>
        {canApply && <Link href={`/student/apply?election=${e.id}`} className={`${btn.secondary} px-3! py-2! text-xs!`}><UserPlusIcon width={14} height={14} /> Run for office</Link>}
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
          <h3 className="font-semibold">{e.title}</h3>
          <p className="text-xs text-slate-500">{formatNumber(e.ballotsCast)} ballots · {percent(e.ballotsCast, e.eligibleCount)} turnout</p>
        </div>
        <Link href={`/student/results/${e.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-urblue hover:underline">Full results <ArrowRightIcon width={15} height={15} /></Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {e.contests.map((contest) => {
          const ranked = [...contest.candidates].sort((a, b) => (b.publishedVotes ?? 0) - (a.publishedVotes ?? 0));
          const total = ranked.reduce((sum, c) => sum + (c.publishedVotes ?? 0), 0);
          const winner = ranked[0];
          return (
            <li key={contest.id} className="rounded-xl border border-slate-100 bg-urblue-50/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{contest.title}</p>
              {winner ? (
                <div className="mt-2 flex items-center gap-3">
                  <CandidatePhoto name={winner.name} photo={winner.photoUrl ?? undefined} size="md" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-semibold"><TrophyIcon width={15} height={15} className="text-amber-500" />{winner.name}</p>
                    <p className="text-xs text-slate-500">{formatNumber(winner.publishedVotes ?? 0)} votes · {percent(winner.publishedVotes ?? 0, total)}</p>
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

function RecordCard({ data }: { data: StudentOverview }) {
  const r = data.record;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <ShieldIcon className="text-urblue" />
        <h2 className="font-semibold">My registry record</h2>
      </div>
      {r ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm">
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
      <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">Only the registry office can change these details.</p>
    </Card>
  );
}

function Item({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
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
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <UserPlusIcon className="text-urblue" />
        <h2 className="font-semibold">Run for office</h2>
      </div>
      <div className="p-5">
        <ul className="space-y-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-start gap-2 text-sm">
              {check.pass ? <CheckCircleIcon width={18} height={18} className="mt-0.5 shrink-0 text-emerald-600" /> : <LockIcon width={18} height={18} className="mt-0.5 shrink-0 text-slate-400" />}
              <span className={check.pass ? "text-slate-700" : "text-slate-500"}>{check.label}</span>
            </li>
          ))}
        </ul>
        {ready && applyable.length > 0 ? (
          <Link href="/student/apply" className={`${btn.primary} mt-4 w-full`}>Apply for a position <ArrowRightIcon width={16} height={16} /></Link>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            {!ready ? "You need to meet every requirement above to stand as a candidate." : "No election is accepting applications from your unit right now."}
          </p>
        )}
        <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-500">My applications</h3>
        {data.nominations.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">You haven&apos;t applied for any position.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {data.nominations.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-100 p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{n.contest}</p>
                    <p className="text-xs text-slate-500">{n.election} · {formatDay(n.submittedAt)}</p>
                  </div>
                  <Badge tone={NOMINATION_TONE[n.status][0]}>{NOMINATION_TONE[n.status][1]}</Badge>
                </div>
                {n.decisionNote && <p className={`mt-2 rounded-lg p-2 text-xs ${n.status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>Commission&apos;s note: {n.decisionNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {action}
    </div>
  );
}

function EmptyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <Card className="flex flex-col items-center border-dashed p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue">{icon}</span>
      <p className="mt-3 font-semibold text-slate-800">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-40 animate-pulse rounded-3xl bg-urblue-100/70" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-urblue-100/50" />)}</div>
      <div className="grid gap-6 lg:grid-cols-3"><div className="h-80 animate-pulse rounded-2xl bg-urblue-100/40 lg:col-span-2" /><div className="h-80 animate-pulse rounded-2xl bg-urblue-100/40" /></div>
    </div>
  );
}
