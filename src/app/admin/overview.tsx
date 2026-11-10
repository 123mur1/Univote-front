"use client";

import { useState } from "react";
import Link from "next/link";
import { useApi } from "@/lib/use-api";
import { downloadCsv } from "@/lib/analytics";
import { toCsv } from "@/lib/registry";
import { timeAgo } from "@/components/notification-bell";
import { Badge, Card, StatusBadge, btn, formatNumber, input, percent } from "@/components/ui";
import { AreaChart, BarList, ChartCard, ColumnChart, Meter } from "@/components/charts";
import { ActivityIcon, AlertIcon, BallotIcon, DatabaseIcon, DownloadIcon, FilterIcon, RefreshIcon, ShieldIcon, UploadIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

type Group = { label: string; value: number };
type AdminStats = {
  generatedAt: string;
  academicYear: string;
  filters: { college: string | null; campus: string | null; days: number };
  registry: { total: number; current: number; withAccount: number; lastImport: { sourceFilename: string; createdAt: string; importedRows: number } | null; byEnrolment: Group[]; byCollege: Group[]; byCampus: Group[]; byLevel: Group[]; byGender: Group[]; byYear: Group[] };
  users: { byRole: { role: string; count: number }[]; suspended: number; locked: number };
  elections: { id: string; title: string; status: "UPCOMING" | "OPEN" | "CLOSED" | "PUBLISHED"; scopeValue: string | null; opensAt: string; closesAt: string; positions: number; candidates: number; nominations: number; eligible: number; voted: number }[];
  nominations: { status: string; count: number }[];
  timeline: { date: string; signups: number; ballots: number; logins: number; failedLogins: number }[];
  activityByType: Group[];
  recentAlerts: { id: string; actorLabel: string; type: string; severity: "WARNING" | "CRITICAL"; detail: string; occurredAt: string }[];
};
type Facets = { campuses: string[]; colleges: string[] };

const SERIES = [
  { key: "logins", label: "Sign-ins" },
  { key: "signups", label: "New accounts" },
  { key: "ballots", label: "Ballots cast" },
  { key: "failedLogins", label: "Failed sign-ins" },
] as const;

const ROLE_LABEL: Record<string, string> = { STUDENT: "Students", ELECTION_OFFICER: "Election officers", DISPUTE_RESOLUTION_COMMITTEE: "Dispute committee", SYSTEM_ADMINISTRATOR: "Administrators" };
const cap = (value: string) => value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");

export function AdminOverview() {
  const [college, setCollege] = useState("");
  const [campus, setCampus] = useState("");
  const [days, setDays] = useState(30);
  const [series, setSeries] = useState<(typeof SERIES)[number]["key"]>("logins");
  const params = new URLSearchParams({ days: String(days), ...(college ? { college } : {}), ...(campus ? { campus } : {}) });
  const { data, error, reload, loading } = useApi<AdminStats>(`/stats/admin?${params}`, { pollMs: 120_000 });
  const { data: facets } = useApi<Facets>("/registry/facets", { silent: true });

  const filters = (
    <Card className="mb-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700"><FilterIcon width={17} height={17} className="text-urblue" /> Filters</span>
      <select value={college} onChange={(e) => setCollege(e.target.value)} className={`${input} lg:max-w-60`} aria-label="College"><option value="">All colleges</option>{facets?.colleges.map((c) => <option key={c}>{c}</option>)}</select>
      <select value={campus} onChange={(e) => setCampus(e.target.value)} className={`${input} lg:max-w-48`} aria-label="Campus"><option value="">All campuses</option>{facets?.campuses.map((c) => <option key={c}>{c}</option>)}</select>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={`${input} lg:max-w-40`} aria-label="Period"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
      <div className="flex gap-2 lg:ml-auto">
        <button type="button" onClick={reload} className={btn.secondary} aria-label="Refresh"><RefreshIcon width={16} height={16} className={loading ? "animate-spin" : ""} /></button>
        {data && <button type="button" onClick={() => exportReport(data)} className={btn.secondary}><DownloadIcon width={16} height={16} /> Report</button>}
      </div>
    </Card>
  );

  if (error && !data) return <>{filters}<Card className="p-8 text-center"><p className="font-semibold">Couldn&apos;t load analytics</p><p className="mt-1 text-sm text-slate-600">{error}</p><button type="button" onClick={reload} className={`${btn.primary} mt-4`}>Try again</button></Card></>;
  if (!data) return <>{filters}<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-urblue-100/50" />)}</div></>;

  const staff = data.users.byRole.filter((r) => r.role !== "STUDENT").reduce((s, r) => s + r.count, 0);
  const students = data.users.byRole.find((r) => r.role === "STUDENT")?.count ?? 0;
  const open = data.elections.filter((e) => e.status === "OPEN").length;
  const upcoming = data.elections.filter((e) => e.status === "UPCOMING").length;
  const ballots = data.elections.reduce((s, e) => s + e.voted, 0);
  const pending = data.nominations.find((n) => n.status === "PENDING")?.count ?? 0;
  const period = data.timeline.reduce((acc, row) => ({ logins: acc.logins + row.logins, signups: acc.signups + row.signups, ballots: acc.ballots + row.ballots, failedLogins: acc.failedLogins + row.failedLogins }), { logins: 0, signups: 0, ballots: 0, failedLogins: 0 });
  const chart = data.timeline.map((row) => ({ label: new Date(`${row.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: row[series] }));
  const scoped = Boolean(college || campus);

  return (
    <>
      {filters}
      {scoped && <p className="-mt-3 mb-5 text-xs text-slate-500">Registry, eligibility and turnout figures are filtered to {[college, campus].filter(Boolean).join(" · ")}. Account and security totals are system-wide.</p>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Kpi label="Eligible students" value={formatNumber(data.registry.current)} hint={`of ${formatNumber(data.registry.total)} on the registry · ${data.academicYear}`} icon={<DatabaseIcon />} href="/admin/registry" />
        <Kpi label="Student accounts" value={formatNumber(students)} hint={`${percent(data.registry.withAccount, data.registry.current)} of eligible students signed up`} icon={<UsersIcon />} href="/admin/users?role=student" />
        <Kpi label="Elections" value={formatNumber(data.elections.length)} hint={`${open} open · ${upcoming} upcoming`} icon={<BallotIcon />} href="/admin/elections" />
        <Kpi label="Ballots cast" value={formatNumber(ballots)} hint={`${pending} applicant${pending === 1 ? "" : "s"} awaiting review`} icon={<ShieldIcon />} href="/admin/voters" />
        <Kpi label="Staff accounts" value={formatNumber(staff)} hint="Officers and administrators" icon={<UserPlusIcon />} href="/admin/users?role=staff" />
        <Kpi label={`Sign-ins (${days}d)`} value={formatNumber(period.logins)} hint={`${formatNumber(period.signups)} new accounts`} icon={<ActivityIcon />} href="/admin/activity" />
        <Kpi label="Locked accounts" value={formatNumber(data.users.locked)} hint={`${formatNumber(period.failedLogins)} failed sign-ins (${days}d)`} icon={<AlertIcon />} href="/admin/users?status=locked" alert={data.users.locked > 0} />
        <Kpi label="Suspended" value={formatNumber(data.users.suspended)} hint="Accounts switched off" icon={<ShieldIcon />} href="/admin/users?status=suspended" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="System activity"
            subtitle={`Daily ${SERIES.find((s) => s.key === series)?.label.toLowerCase()}, last ${days} days`}
            action={<div className="flex flex-wrap gap-1">{SERIES.map((s) => <button key={s.key} type="button" onClick={() => setSeries(s.key)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${series === s.key ? "bg-urblue text-white" : "bg-urblue-50 text-urblue hover:bg-urblue-100"}`}>{s.label}</button>)}</div>}
            table={{ columns: ["Date", "Sign-ins", "New accounts", "Ballots", "Failed sign-ins"], rows: data.timeline.map((r) => [r.date, r.logins, r.signups, r.ballots, r.failedLogins]) }}
          >
            <AreaChart data={chart} height={220} />
          </ChartCard>
        </div>
        <ChartCard title="Account adoption" subtitle="Eligible students with a UniVote account">
          <Meter value={data.registry.withAccount} max={Math.max(data.registry.current, data.registry.withAccount)} label="of eligible students have signed up" />
          <div className="mt-6 space-y-2 text-sm">
            {data.users.byRole.map((r) => <div key={r.role} className="flex justify-between"><span className="text-slate-600">{ROLE_LABEL[r.role] ?? r.role}</span><span className="font-semibold">{formatNumber(r.count)}</span></div>)}
          </div>
        </ChartCard>
      </div>

      <div className="mt-6">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div><h2 className="font-semibold">Elections and turnout</h2><p className="text-xs text-slate-500">Eligible voters computed live from the registry</p></div>
            <Link href="/officer/elections" className="text-sm font-semibold text-urblue hover:underline">Open election office</Link>
          </div>
          {data.elections.length === 0 ? <p className="p-6 text-sm text-slate-500">No elections yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark"><tr><th className="px-5 py-3">Election</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Positions</th><th className="px-5 py-3">Applicants</th><th className="px-5 py-3">Eligible</th><th className="px-5 py-3 w-56">Turnout</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.elections.map((e) => (
                    <tr key={e.id} className="hover:bg-urblue-50/50">
                      <td className="px-5 py-3"><Link href={`/officer/elections/${e.id}`} className="font-medium hover:text-urblue">{e.title}</Link><p className="text-xs text-slate-500">{e.scopeValue ?? "University-wide"}</p></td>
                      <td className="px-5 py-3"><StatusBadge status={e.status.toLowerCase() as "open"} /></td>
                      <td className="px-5 py-3">{e.positions} · {e.candidates} candidates</td>
                      <td className="px-5 py-3">{e.nominations}</td>
                      <td className="px-5 py-3">{formatNumber(e.eligible)}</td>
                      <td className="px-5 py-3"><div className="flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-urblue-100"><div className="h-full rounded-full bg-urblue" style={{ width: percent(e.voted, e.eligible) }} /></div><span className="w-16 text-right text-xs font-semibold">{percent(e.voted, e.eligible)}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Students by college" table={{ columns: ["College", "Students"], rows: data.registry.byCollege.map((g) => [g.label, g.value]) }}>
          <BarList data={data.registry.byCollege} highlight={college || undefined} />
        </ChartCard>
        <ChartCard title="Students by campus" table={{ columns: ["Campus", "Students"], rows: data.registry.byCampus.map((g) => [g.label, g.value]) }}>
          <BarList data={data.registry.byCampus} highlight={campus || undefined} />
        </ChartCard>
        <ChartCard title="Registry status" subtitle="Only active students can vote" table={{ columns: ["Status", "Students"], rows: data.registry.byEnrolment.map((g) => [g.label, g.value]) }}>
          <BarList data={data.registry.byEnrolment.map((g) => ({ ...g, label: cap(g.label) }))} highlight="Active" />
        </ChartCard>
        <ChartCard title="Year of study" table={{ columns: ["Year", "Students"], rows: data.registry.byYear.map((g) => [g.label, g.value]) }}>
          <ColumnChart data={[...data.registry.byYear].sort((a, b) => a.label.localeCompare(b.label)).map((g) => ({ label: g.label === "Not recorded" ? "—" : `Y${g.label}`, value: g.value }))} height={170} />
        </ChartCard>
        <ChartCard title="Level and gender">
          <BarList data={[...data.registry.byLevel.map((g) => ({ ...g, label: `Level · ${cap(g.label)}` })), ...data.registry.byGender.map((g) => ({ ...g, label: `Gender · ${cap(g.label)}` }))]} />
        </ChartCard>
        <ChartCard title="Activity by type" subtitle={`Last ${days} days`} table={{ columns: ["Type", "Events"], rows: data.activityByType.map((g) => [g.label, g.value]) }}>
          <BarList data={data.activityByType.slice(0, 8).map((g) => ({ ...g, label: cap(g.label) }))} />
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Recent security alerts</h2>
            <Link href="/admin/activity" className="text-sm font-semibold text-urblue hover:underline">Full activity log</Link>
          </div>
          {data.recentAlerts.length === 0 ? <p className="p-5 text-sm text-slate-500">No warnings recorded.</p> : (
            <ul className="divide-y divide-slate-100">
              {data.recentAlerts.map((a) => (
                <li key={a.id} className="flex gap-3 px-5 py-3">
                  <AlertIcon width={18} height={18} className={`mt-0.5 shrink-0 ${a.severity === "CRITICAL" ? "text-red-600" : "text-amber-600"}`} />
                  <div className="min-w-0 flex-1"><p className="text-sm">{a.detail}</p><p className="text-xs text-slate-500">{a.actorLabel} · {cap(a.type)} · {timeAgo(a.occurredAt)}</p></div>
                  <Badge tone={a.severity === "CRITICAL" ? "red" : "amber"}>{a.severity.toLowerCase()}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            <Link href="/admin/users?create=staff" className={`${btn.secondary} justify-start`}><UserPlusIcon width={17} height={17} /> Add an election officer</Link>
            <Link href="/admin/users?create=student" className={`${btn.secondary} justify-start`}><UsersIcon width={17} height={17} /> Create a student account</Link>
            <Link href="/admin/registry" className={`${btn.secondary} justify-start`}><UploadIcon width={17} height={17} /> Import or edit the registry</Link>
            <Link href="/admin/settings" className={`${btn.secondary} justify-start`}><ShieldIcon width={17} height={17} /> Security settings</Link>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            {data.registry.lastImport ? <>Last registry import: <strong>{data.registry.lastImport.sourceFilename}</strong>, {timeAgo(data.registry.lastImport.createdAt)} ({formatNumber(data.registry.lastImport.importedRows)} rows).</> : "The registry has not been imported yet."}
          </p>
          <p className="mt-2 text-xs text-slate-400">Updated {timeAgo(data.generatedAt)}</p>
        </Card>
      </div>
    </>
  );
}

function Kpi({ label, value, hint, icon, href, alert = false }: { label: string; value: string; hint: string; icon: React.ReactNode; href: string; alert?: boolean }) {
  return (
    <Link href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-urblue">
      <Card className={`h-full p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-5 ${alert ? "border-amber-300 bg-amber-50/40" : "group-hover:border-urblue-300"}`}>
        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><span className={`rounded-xl p-2 ${alert ? "bg-amber-100 text-amber-700" : "bg-urblue-50 text-urblue"}`}>{icon}</span></div>
        <p className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{hint}</p>
      </Card>
    </Link>
  );
}

function exportReport(data: AdminStats) {
  const rows = [
    { section: "Registry", metric: "Students on registry", value: data.registry.total },
    { section: "Registry", metric: `Eligible for ${data.academicYear}`, value: data.registry.current },
    { section: "Registry", metric: "Eligible students with an account", value: data.registry.withAccount },
    ...data.users.byRole.map((r) => ({ section: "Accounts", metric: ROLE_LABEL[r.role] ?? r.role, value: r.count })),
    { section: "Accounts", metric: "Suspended", value: data.users.suspended },
    { section: "Accounts", metric: "Locked", value: data.users.locked },
    ...data.elections.flatMap((e) => [
      { section: `Election: ${e.title}`, metric: "Status", value: e.status },
      { section: `Election: ${e.title}`, metric: "Eligible voters", value: e.eligible },
      { section: `Election: ${e.title}`, metric: "Ballots cast", value: e.voted },
      { section: `Election: ${e.title}`, metric: "Turnout", value: percent(e.voted, e.eligible) },
    ]),
    ...data.nominations.map((n) => ({ section: "Applications", metric: cap(n.status), value: n.count })),
    ...data.registry.byCollege.map((g) => ({ section: "Students by college", metric: g.label, value: g.value })),
    ...data.registry.byCampus.map((g) => ({ section: "Students by campus", metric: g.label, value: g.value })),
  ];
  downloadCsv(`univote-report-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, ["section", "metric", "value"]));
}
