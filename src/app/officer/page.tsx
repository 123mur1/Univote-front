"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { formatDateTime, formatDay, relativeTime } from "@/lib/student-api";
<<<<<<< HEAD
import { Badge, EmptyState, Panel, ProgressBar, Skeleton, StatCard, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { BarList, ChartCard, ColumnChart, Meter } from "@/components/charts";
import { AlertIcon, ArrowRightIcon, BallotIcon, CalendarIcon, ChartIcon, CheckCircleIcon, ClockIcon, DatabaseIcon, PlusIcon, UploadIcon, UserPlusIcon } from "@/components/icons";
=======
import { Badge, Card, PageHeader, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { BarList, ChartCard, ColumnChart, Meter } from "@/components/charts";
import { ArrowRightIcon, BallotIcon, CalendarIcon, CheckCircleIcon, DatabaseIcon, PlusIcon, UploadIcon, UserPlusIcon } from "@/components/icons";
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36

type OfficerElection = {
  id: string; title: string; status: "UPCOMING" | "OPEN" | "CLOSED" | "PUBLISHED"; scopeLevel: string; scopeValue: string | null;
  opensAt: string; closesAt: string; nominationsClose: string | null; positions: number; candidates: number; eligible: number; voted: number;
};
type OfficerStats = {
  academicYear: string;
  registryTotal: number;
  elections: OfficerElection[];
  nominations: { status: "PENDING" | "APPROVED" | "REJECTED"; count: number }[];
  pending: { id: string; name: string; registrationNumber: string; contest: string; election: string; submittedAt: string }[];
};
type Turnout = { eligibleCount: number; votedCount: number; byHour: { hour: number; ballots: number }[]; byCollege: { college: string; eligible: number; voted: number }[] };

const NEXT_STEP: Record<OfficerElection["status"], string> = {
  UPCOMING: "Review applicants before voting opens",
  OPEN: "Voting in progress, monitor turnout",
  CLOSED: "Decrypt ballots and publish results",
  PUBLISHED: "Results published",
};

export default function OfficerDashboard() {
  const session = useSession();
  const { data, error, reload } = useApi<OfficerStats>("/stats/officer", { pollMs: 60_000 });

  if (error && !data) {
<<<<<<< HEAD
    return <EmptyState className="mx-auto max-w-xl" icon={<AlertIcon width={26} height={26} className="text-amber-600" />} title="Couldn't load the dashboard" text={error} action={<button type="button" onClick={reload} className={btn.primary}>Try again</button>} />;
  }
  if (!data) return <div className="space-y-6" aria-busy="true"><Skeleton className="h-52 rounded-[1.75rem]" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div><Skeleton className="h-80 rounded-2xl" /></div>;
=======
    return <Card className="mx-auto max-w-xl p-8 text-center"><h1 className="text-lg font-bold">Couldn&apos;t load the dashboard</h1><p className="mt-2 text-sm text-slate-600">{error}</p><button type="button" onClick={reload} className={`${btn.primary} mt-5`}>Try again</button></Card>;
  }
  if (!data) return <div className="space-y-6"><div className="h-20 animate-pulse rounded-2xl bg-urblue-100/60" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-urblue-100/50" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-urblue-100/40" /></div>;
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36

  const count = (status: string) => data.nominations.find((n) => n.status === status)?.count ?? 0;
  const open = data.elections.filter((e) => e.status === "OPEN");
  const upcoming = data.elections.filter((e) => e.status === "UPCOMING");
  const toPublish = data.elections.filter((e) => e.status === "CLOSED");
  const steps = [
    { label: "Import the eligibility list", done: data.registryTotal > 0, href: "/officer/registry", detail: `${formatNumber(data.registryTotal)} students on the list` },
    { label: "Create an election", done: data.elections.length > 0, href: "/officer/elections/new", detail: `${data.elections.length} election${data.elections.length === 1 ? "" : "s"} created` },
    { label: "Review every applicant", done: data.elections.length > 0 && count("PENDING") === 0, href: "/officer/candidates", detail: `${count("PENDING")} waiting · ${count("APPROVED")} approved` },
    { label: "Publish results after voting", done: data.elections.some((e) => e.status === "PUBLISHED") && toPublish.length === 0, href: "/officer/elections", detail: toPublish.length ? `${toPublish.length} ready to publish` : "Nothing waiting" },
  ];

  return (
    <>
<<<<<<< HEAD
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep p-6 text-white shadow-[var(--shadow-brand)] sm:p-8">
        <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div aria-hidden="true" className="univote-rope univote-spin-slow pointer-events-none absolute -right-20 -top-24 size-80 text-white/10" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-urblue-200">Electoral Commission · {data.academicYear}</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[2rem]">Welcome back, {session?.name.split(" ")[0] ?? "officer"}</h1>
            <p className="mt-2 max-w-xl text-sm text-urblue-100/90">
              {open.length ? `${open.length} election${open.length === 1 ? " is" : "s are"} live right now.` : "No election is open right now."}{" "}
              {count("PENDING") ? `${count("PENDING")} applicant${count("PENDING") === 1 ? "" : "s"} waiting for your review.` : "No applicants are waiting."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/officer/registry" className={btn.ghostInverse}><UploadIcon width={17} height={17} /> Eligibility list</Link>
            <Link href="/officer/elections/new" className={btn.inverse}><PlusIcon width={17} height={17} /> New election</Link>
          </div>
        </div>

        {/* Election workflow pipeline */}
        <ol className="relative mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.label}>
              <Link href={step.href} className={`group flex h-full items-start gap-3 rounded-2xl p-3.5 ring-1 transition-all duration-200 hover:-translate-y-0.5 ${step.done ? "bg-white/10 ring-white/15 hover:bg-white/15" : "bg-white text-slate-900 ring-white shadow-xl"}`}>
                <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${step.done ? "bg-emerald-400 text-emerald-950" : "bg-urblue text-white"}`}>
                  {step.done ? <CheckCircleIcon width={17} height={17} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-[13px] font-bold ${step.done ? "text-white" : "text-slate-900"}`}>{step.label}</span>
                  <span className={`block truncate text-xs ${step.done ? "text-urblue-200" : "text-slate-500"}`}>{step.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <div className="univote-stagger mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Voting now" value={formatNumber(open.length)} hint={open.length ? `${formatNumber(open.reduce((s, e) => s + e.voted, 0))} ballots so far` : "No election open"} icon={<BallotIcon width={18} height={18} />} href="/officer/elections" tone={open.length > 0 ? "action" : "plain"} />
        <StatCard label="Upcoming" value={formatNumber(upcoming.length)} hint={upcoming[0] ? `Next opens ${relativeTime(upcoming[upcoming.length - 1].opensAt)}` : "None scheduled"} icon={<CalendarIcon width={18} height={18} />} href="/officer/elections" />
        <StatCard label="Applicants to review" value={formatNumber(count("PENDING"))} hint={`${count("APPROVED")} approved · ${count("REJECTED")} rejected`} icon={<UserPlusIcon width={18} height={18} />} href="/officer/candidates" tone={count("PENDING") > 0 ? "action" : "plain"} />
        <StatCard label="Eligibility list" value={formatNumber(data.registryTotal)} hint="Students in the registry" icon={<DatabaseIcon width={18} height={18} />} href="/officer/registry" />
      </div>

      {toPublish.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><ChartIcon width={22} height={22} /></span>
=======
      <PageHeader
        title={`Welcome, ${session?.name.split(" ")[0] ?? "officer"}`}
        description={`Electoral Commission dashboard · academic year ${data.academicYear}`}
        actions={<>
          <Link href="/officer/registry" className={btn.secondary}><UploadIcon width={17} height={17} /> <span className="hidden sm:inline">Eligibility list</span></Link>
          <Link href="/officer/elections/new" className={btn.primary}><PlusIcon width={17} height={17} /> New election</Link>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Voting now" value={open.length} hint={open.length ? `${formatNumber(open.reduce((s, e) => s + e.voted, 0))} ballots so far` : "No election open"} icon={<BallotIcon />} href="/officer/elections" highlight={open.length > 0} />
        <Kpi label="Upcoming" value={upcoming.length} hint={upcoming[0] ? `Next opens ${relativeTime(upcoming[upcoming.length - 1].opensAt)}` : "None scheduled"} icon={<CalendarIcon />} href="/officer/elections" />
        <Kpi label="Applicants to review" value={count("PENDING")} hint={`${count("APPROVED")} approved · ${count("REJECTED")} rejected`} icon={<UserPlusIcon />} href="/officer/candidates" highlight={count("PENDING") > 0} />
        <Kpi label="Eligibility list" value={data.registryTotal} hint="Students in the registry" icon={<DatabaseIcon />} href="/officer/registry" />
      </div>

      {toPublish.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
          <CheckCircleIcon className="shrink-0 text-amber-600" width={24} height={24} />
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
          <p className="flex-1 text-sm text-amber-950"><strong>{toPublish.map((e) => e.title).join(", ")}</strong> {toPublish.length === 1 ? "has" : "have"} closed. Decrypt the ballots with the trustee key and publish the official results.</p>
          <Link href="/officer/elections" className={btn.primary}>Publish results <ArrowRightIcon width={16} height={16} /></Link>
        </div>
      )}

      {open.map((e) => <LiveElection key={e.id} election={e} />)}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
<<<<<<< HEAD
        <Panel className="lg:col-span-2" title="Elections" description="Every election and its next step" icon={<BallotIcon width={18} height={18} />} bodyClassName="" action={<Link href="/officer/elections" className="inline-flex items-center gap-1 text-sm font-bold text-urblue hover:underline">Manage <ArrowRightIcon width={15} height={15} /></Link>}>
          {data.elections.length === 0 ? (
            <EmptyState className="m-5" icon={<BallotIcon width={24} height={24} />} title="No elections yet" text="Create the first election once the eligibility list is imported." action={<Link href="/officer/elections/new" className={btn.primary}><PlusIcon width={16} height={16} /> New election</Link>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.elections.map((e) => (
                <li key={e.id}><Link href={`/officer/elections/${e.id}`} className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-urblue-25 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-bold text-slate-900 group-hover:text-urblue">{e.title}</p><StatusBadge status={e.status.toLowerCase() as "open"} /></div>
                    <p className="mt-0.5 text-xs text-slate-500">{e.scopeValue ?? "University-wide"} · {e.positions} positions · {e.candidates} candidates · {formatDateTime(e.opensAt)} – {formatDateTime(e.closesAt)}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-urblue"><ClockIcon width={13} height={13} />{NEXT_STEP[e.status]}</p>
                  </div>
                  <div className="text-sm sm:w-40">
                    <div className="flex items-baseline justify-between"><span className="text-xs text-slate-500">{formatNumber(e.voted)} / {formatNumber(e.eligible)}</span><span className="font-bold text-slate-900">{percent(e.voted, e.eligible)}</span></div>
                    <div className="mt-1.5"><ProgressBar value={e.voted} max={e.eligible} size="sm" /></div>
                  </div>
                </Link></li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Waiting for review" description="Applications needing a decision" icon={<UserPlusIcon width={18} height={18} />} bodyClassName="" action={<Badge tone={count("PENDING") ? "amber" : "green"}>{count("PENDING")}</Badge>}>
            {data.pending.length === 0 ? (
              <div className="flex flex-col items-center p-6 text-center"><CheckCircleIcon width={28} height={28} className="text-emerald-500" /><p className="mt-2 text-sm font-semibold text-slate-700">You&apos;re all caught up</p><p className="mt-1 text-xs text-slate-500">New applications appear here and in your notifications.</p></div>
=======
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Elections</h2>
            <Link href="/officer/elections" className="text-sm font-semibold text-urblue hover:underline">Manage</Link>
          </div>
          {data.elections.length === 0 ? (
            <div className="p-8 text-center"><p className="font-medium">No elections yet</p><p className="mt-1 text-sm text-slate-500">Create the first election once the eligibility list is imported.</p><Link href="/officer/elections/new" className={`${btn.primary} mt-4`}><PlusIcon width={16} height={16} /> New election</Link></div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.elections.map((e) => (
                <li key={e.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-medium">{e.title}</p><StatusBadge status={e.status.toLowerCase() as "open"} /></div>
                    <p className="mt-0.5 text-xs text-slate-500">{e.scopeValue ?? "University-wide"} · {e.positions} positions · {e.candidates} candidates · {formatDateTime(e.opensAt)} – {formatDateTime(e.closesAt)}</p>
                    <p className="mt-1 text-xs font-medium text-urblue">{NEXT_STEP[e.status]}</p>
                  </div>
                  <div className="text-right text-sm sm:w-32">
                    <p className="font-semibold">{percent(e.voted, e.eligible)}</p>
                    <p className="text-xs text-slate-500">{formatNumber(e.voted)} / {formatNumber(e.eligible)} voted</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Waiting for review</h2>
              <Badge tone={count("PENDING") ? "amber" : "green"}>{count("PENDING")}</Badge>
            </div>
            {data.pending.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No applications are waiting. New ones appear here and in your notifications.</p>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.pending.map((p) => (
                  <li key={p.id}>
<<<<<<< HEAD
                    <Link href={`/officer/candidates/${p.id}`} className="group flex items-center gap-3 px-5 py-3 transition hover:bg-urblue-25">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-urblue-100 to-urblue-200 text-xs font-bold text-urblue-darker">{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="truncate text-xs text-slate-500">{p.contest} · {p.election}</p></div>
                      <span className="text-xs text-slate-400">{formatDay(p.submittedAt)}</span>
                      <ArrowRightIcon width={15} height={15} className="text-urblue transition-transform group-hover:translate-x-0.5" />
=======
                    <Link href={`/officer/candidates/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-urblue-50/60">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="truncate text-xs text-slate-500">{p.contest} · {p.election}</p></div>
                      <span className="text-xs text-slate-400">{formatDay(p.submittedAt)}</span>
                      <ArrowRightIcon width={15} height={15} className="text-urblue" />
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
                    </Link>
                  </li>
                ))}
              </ul>
            )}
<<<<<<< HEAD
          </Panel>
=======
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Election workflow</h2>
            <ol className="mt-4 space-y-3">
              {steps.map((step, index) => (
                <li key={step.label}>
                  <Link href={step.href} className="flex gap-3 rounded-xl p-2 -m-2 hover:bg-urblue-50/60">
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? "bg-emerald-600 text-white" : "bg-urblue-100 text-urblue"}`}>{step.done ? "✓" : index + 1}</span>
                    <span><span className="block text-sm font-medium">{step.label}</span><span className="block text-xs text-slate-500">{step.detail}</span></span>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
        </div>
      </div>
    </>
  );
}

<<<<<<< HEAD
=======
function Kpi({ label, value, hint, icon, href, highlight = false }: { label: string; value: number; hint: string; icon: React.ReactNode; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue">
      <Card className={`h-full p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-5 ${highlight ? "border-urblue ring-2 ring-urblue/10" : "group-hover:border-urblue-300"}`}>
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><span className={`rounded-xl p-2 ${highlight ? "bg-urblue text-white" : "bg-urblue-50 text-urblue"}`}>{icon}</span></div>
        <p className="mt-2 text-3xl font-bold tracking-tight">{formatNumber(value)}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{hint}</p>
      </Card>
    </Link>
  );
}

>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
function LiveElection({ election }: { election: OfficerElection }) {
  const { data } = useApi<Turnout>(`/elections/${election.id}/turnout`, { pollMs: 30_000 });
  const hours = (data?.byHour ?? []).filter((row) => row.hour >= 5 && row.hour <= 21).map((row) => ({ label: `${String(row.hour).padStart(2, "0")}h`, value: row.ballots }));
  const colleges = (data?.byCollege ?? []).map((row) => ({ label: row.college, value: row.eligible ? (row.voted / row.eligible) * 100 : 0, detail: `${formatNumber(row.voted)} of ${formatNumber(row.eligible)}` })).sort((a, b) => b.value - a.value);
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
<<<<<<< HEAD
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white"><span className="univote-ping relative size-1.5 rounded-full bg-white text-white" /> LIVE</span>
=======
        <span className="inline-flex items-center gap-1.5 rounded-full bg-urblue px-2.5 py-1 text-xs font-bold text-white"><span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE</span>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
        <h2 className="text-lg font-bold">{election.title}</h2>
        <span className="text-sm text-slate-500">closes {relativeTime(election.closesAt)}</span>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Turnout" subtitle="Counts only, ballots stay encrypted">
          <Meter value={data?.votedCount ?? election.voted} max={data?.eligibleCount ?? election.eligible} label="of eligible students have voted" />
        </ChartCard>
        <ChartCard title="Ballots per hour (UTC)" subtitle="Today" table={{ columns: ["Hour", "Ballots"], rows: hours.map((h) => [h.label, h.value]) }}>
          <ColumnChart data={hours} height={160} />
        </ChartCard>
        <ChartCard title="Turnout by college" table={{ columns: ["College", "Turnout"], rows: colleges.map((c) => [c.label, `${c.value.toFixed(1)}%`]) }}>
          {colleges.length ? <BarList data={colleges} unit="%" max={100} /> : <p className="text-sm text-slate-500">No ballots yet.</p>}
        </ChartCard>
      </div>
    </section>
  );
}
