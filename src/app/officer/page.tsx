"use client";

import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import { formatDateTime, formatDay, relativeTime } from "@/lib/student-api";
import { Badge, Card, PageHeader, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { BarList, ChartCard, ColumnChart, Meter } from "@/components/charts";
import { ArrowRightIcon, BallotIcon, CalendarIcon, CheckCircleIcon, DatabaseIcon, PlusIcon, UploadIcon, UserPlusIcon } from "@/components/icons";

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
    return <Card className="mx-auto max-w-xl p-8 text-center"><h1 className="text-lg font-bold">Couldn&apos;t load the dashboard</h1><p className="mt-2 text-sm text-slate-600">{error}</p><button type="button" onClick={reload} className={`${btn.primary} mt-5`}>Try again</button></Card>;
  }
  if (!data) return <div className="space-y-6"><div className="h-20 animate-pulse rounded-2xl bg-urblue-100/60" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-urblue-100/50" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-urblue-100/40" /></div>;

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
          <p className="flex-1 text-sm text-amber-950"><strong>{toPublish.map((e) => e.title).join(", ")}</strong> {toPublish.length === 1 ? "has" : "have"} closed. Decrypt the ballots with the trustee key and publish the official results.</p>
          <Link href="/officer/elections" className={btn.primary}>Publish results <ArrowRightIcon width={16} height={16} /></Link>
        </div>
      )}

      {open.map((e) => <LiveElection key={e.id} election={e} />)}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
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
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.pending.map((p) => (
                  <li key={p.id}>
                    <Link href={`/officer/candidates/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-urblue-50/60">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.name}</p><p className="truncate text-xs text-slate-500">{p.contest} · {p.election}</p></div>
                      <span className="text-xs text-slate-400">{formatDay(p.submittedAt)}</span>
                      <ArrowRightIcon width={15} height={15} className="text-urblue" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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
        </div>
      </div>
    </>
  );
}

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

function LiveElection({ election }: { election: OfficerElection }) {
  const { data } = useApi<Turnout>(`/elections/${election.id}/turnout`, { pollMs: 30_000 });
  const hours = (data?.byHour ?? []).filter((row) => row.hour >= 5 && row.hour <= 21).map((row) => ({ label: `${String(row.hour).padStart(2, "0")}h`, value: row.ballots }));
  const colleges = (data?.byCollege ?? []).map((row) => ({ label: row.college, value: row.eligible ? (row.voted / row.eligible) * 100 : 0, detail: `${formatNumber(row.voted)} of ${formatNumber(row.eligible)}` })).sort((a, b) => b.value - a.value);
  return (
    <section className="mt-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-urblue px-2.5 py-1 text-xs font-bold text-white"><span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE</span>
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
