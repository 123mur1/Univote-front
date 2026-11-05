"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { applications, type Election } from "@/lib/data";
import { ACTIVITY_LABELS, useActivity } from "@/lib/activity";
import { STANDINGS, countBy, useElectionStats, useStudentRows } from "@/lib/analytics";
import { useManagedStaff } from "@/lib/accounts";
import { useHydrated, useNow } from "@/lib/local-store";
import { scopeLabel } from "@/lib/registry";
import { effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { useSettings } from "@/lib/settings";
import { AreaChart, BarList, ChartCard, ColumnChart } from "@/components/charts";
import { Badge, Card, StatCard, input } from "@/components/ui";
import { ActivityIcon, AlertIcon, BallotIcon, ChartIcon, DatabaseIcon, ShieldIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

const pct = (a: number, b: number) => (b === 0 ? 0 : (a / b) * 100);

export function AdminOverview({ elections }: { elections: Election[] }) {
  const hydrated = useHydrated();
  const now = useNow();
  const settings = useSettings();
  const allRows = useStudentRows();
  const activity = useActivity();
  const staff = useManagedStaff();
  const reviews = useReviews();
  const submissions = useSubmissions();

  const tracked = elections.filter((e) => e.status !== "published");
  const [electionId, setElectionId] = useState(tracked[0]?.id ?? "");
  const [college, setCollege] = useState("");
  const [campus, setCampus] = useState("");
  const election = elections.find((e) => e.id === electionId);

  const colleges = useMemo(() => [...new Set(allRows.map((r) => r.collegeCode))].sort(), [allRows]);
  const campuses = useMemo(() => [...new Set(allRows.map((r) => r.campus))].sort(), [allRows]);
  const rows = useMemo(() => allRows.filter((r) => (!college || r.collegeCode === college) && (!campus || r.campus === campus)), [allRows, college, campus]);
  const { electorate, voters, hours } = useElectionStats(election, rows);

  const eligibleNow = rows.filter((r) => r.standing === "Eligible");
  const withAccount = eligibleNow.filter((r) => r.account !== "No account");
  const pending = [...submissions, ...applications].filter((a) => effectiveStatus(a, reviews[a.id]) === "pending").length;
  const weekAgo = now - 7 * 86_400_000;
  const alerts = activity.filter((a) => a.severity !== "info" && new Date(a.at).getTime() > weekAgo);

  const turnoutByCollege = useMemo(() => {
    const e = countBy(electorate, (r) => r.collegeCode);
    const v = countBy(voters, (r) => r.collegeCode);
    return [...e.entries()]
      .map(([label, n]) => ({ label, value: pct(v.get(label) ?? 0, n), detail: `${(v.get(label) ?? 0).toLocaleString("en-US")} of ${n.toLocaleString("en-US")} eligible voted` }))
      .sort((a, b) => b.value - a.value);
  }, [electorate, voters]);

  const byHour = Array.from({ length: 10 }, (_, i) => {
    const n = hours.filter((h) => h === 8 + i).length;
    return { label: `${String(8 + i).padStart(2, "0")}:00`, value: n };
  });

  const signups = useMemo(() => {
    const start = new Date("2026-09-01T00:00:00Z").getTime();
    const weeks = Math.max(1, Math.ceil((now - start) / (7 * 86_400_000)));
    const buckets = Array.from({ length: weeks }, (_, i) => ({ label: new Date(start + i * 7 * 86_400_000).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), value: 0 }));
    rows.forEach((r) => {
      if (!r.accountCreated) return;
      const w = Math.floor((new Date(`${r.accountCreated}T00:00:00Z`).getTime() - start) / (7 * 86_400_000));
      if (w >= 0 && w < weeks) buckets[w].value += 1;
    });
    // The current week isn't over yet, so say so rather than let the dip look like a drop.
    return buckets.map((b, i) => ({ ...b, detail: i === buckets.length - 1 ? "this week so far" : "new accounts that week" }));
  }, [rows, now]);

  const standing = useMemo(() => {
    const c = countBy(rows, (r) => r.standing);
    return STANDINGS.map((s) => ({ label: s, value: c.get(s) ?? 0, detail: `${pct(c.get(s) ?? 0, rows.length).toFixed(1)}% of students` }));
  }, [rows]);

  const bySchool = useMemo(
    () => [...countBy(electorate, (r) => r.school).entries()].map(([label, value]) => ({ label: label.replace(/^School of /, ""), value, detail: `${value} eligible` })).sort((a, b) => b.value - a.value).slice(0, 8),
    [electorate],
  );

  const byYear = useMemo(() => {
    const c = countBy(rows.filter((r) => r.standing === "Eligible"), (r) => String(r.yearOfStudy));
    return [1, 2, 3, 4, 5, 6].filter((y) => c.has(String(y))).map((y) => ({ label: `Year ${y}`, value: c.get(String(y)) ?? 0 }));
  }, [rows]);

  if (!hydrated) return <div className="h-[600px] animate-pulse rounded-xl bg-urblue-100/60" />;

  return (
    <div className="space-y-6">
      {/* Filters: one row above everything they control */}
      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <label className="flex-1 text-xs font-medium text-slate-600">
          Election
          <select value={electionId} onChange={(e) => setElectionId(e.target.value)} className={`${input} mt-1`}>
            {tracked.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600 lg:w-48">
          College
          <select value={college} onChange={(e) => setCollege(e.target.value)} className={`${input} mt-1`}>
            <option value="">All colleges</option>
            {colleges.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600 lg:w-48">
          Campus
          <select value={campus} onChange={(e) => setCampus(e.target.value)} className={`${input} mt-1`}>
            <option value="">All campuses</option>
            {campuses.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        {(college || campus) && (
          <button type="button" onClick={() => { setCollege(""); setCampus(""); }} className="pb-2.5 text-sm font-medium text-urblue hover:underline">
            Clear filters
          </button>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Students on registry" value={rows.length.toLocaleString("en-US")} hint={`Academic year ${settings.academicYear.label}`} icon={<DatabaseIcon />} />
        <StatCard label="Can vote this year" value={`${pct(eligibleNow.length, rows.length).toFixed(1)}%`} hint={`${eligibleNow.length.toLocaleString("en-US")} students`} icon={<ShieldIcon />} />
        <StatCard label="Eligible with accounts" value={`${pct(withAccount.length, eligibleNow.length).toFixed(1)}%`} hint={`${withAccount.length.toLocaleString("en-US")} signed up`} icon={<UsersIcon />} />
        <StatCard label="Turnout" value={`${pct(voters.length, electorate.length).toFixed(1)}%`} hint={`${voters.length.toLocaleString("en-US")} of ${electorate.length.toLocaleString("en-US")} eligible`} icon={<BallotIcon />} />
        <StatCard label="Nominations pending" value={String(pending)} hint="Awaiting election officers" icon={<UserPlusIcon />} />
        <StatCard label="Security alerts (7 days)" value={String(alerts.length)} hint={`${staff.filter((s) => (s.failedLogins ?? 0) >= settings.maxFailedLogins).length} staff accounts locked`} icon={<AlertIcon />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Turnout by college"
          subtitle={election ? `${election.title} · ${scopeLabel(election.eligibility)}` : undefined}
          table={{ columns: ["College", "Turnout"], rows: turnoutByCollege.map((d) => [d.label, `${d.value.toFixed(1)}%`]) }}
        >
          <BarList data={turnoutByCollege} unit="%" max={100} />
        </ChartCard>
        <ChartCard title="Ballots cast by hour" subtitle="Counts only. Ballot contents are never visible." table={{ columns: ["Hour", "Ballots"], rows: byHour.map((d) => [d.label, d.value]) }}>
          <ColumnChart data={byHour} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="New student accounts per week" subtitle="Since the academic year opened" table={{ columns: ["Week of", "Accounts"], rows: signups.map((d) => [d.label, d.value]) }}>
          <AreaChart data={signups} />
        </ChartCard>
        <ChartCard title="Voting standing from the registry" subtitle="Why students can or can't vote this academic year" table={{ columns: ["Standing", "Students"], rows: standing.map((d) => [d.label, d.value]) }}>
          <BarList data={standing} highlight="Eligible" />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Electorate by school" subtitle="Top schools in the selected election" table={{ columns: ["School", "Eligible"], rows: bySchool.map((d) => [d.label, d.value]) }}>
          <BarList data={bySchool} />
        </ChartCard>
        <ChartCard title="Eligible students by year of study" table={{ columns: ["Year", "Students"], rows: byYear.map((d) => [d.label, d.value]) }}>
          <ColumnChart data={byYear} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent security events</h2>
            <Link href="/admin/activity" className="text-sm font-medium text-urblue hover:underline">All activity</Link>
          </div>
          {activity.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No sign-ins or changes recorded in this browser yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  {a.severity === "info" ? <ActivityIcon width={18} height={18} className="mt-0.5 shrink-0 text-urblue" /> : <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />}
                  <div className="min-w-0">
                    <p className="text-slate-800">
                      <span className="font-medium">{ACTIVITY_LABELS[a.type]}</span> · {a.detail}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(a.at).toLocaleString("en-GB")} · {a.actor}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="overflow-hidden xl:col-span-3">
          <div className="flex items-center justify-between p-5 pb-3">
            <h2 className="font-semibold">Elections at a glance</h2>
            <Link href="/admin/elections" className="text-sm font-medium text-urblue hover:underline">Details</Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Election</th>
                <th className="px-5 py-2.5 font-semibold">Who can vote</th>
                <th className="px-5 py-2.5 text-right font-semibold">Turnout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elections.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{e.title}</p>
                    <Badge tone={e.status === "open" ? "blue" : e.status === "published" ? "green" : "gray"}>{e.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{scopeLabel(e.eligibility)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{e.ballotsCast ? `${pct(e.ballotsCast, e.eligibleVoters).toFixed(1)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="flex items-center gap-2 text-xs text-slate-500">
        <ChartIcon width={14} height={14} /> Figures combine the registry list with participation recorded in this prototype.
      </p>
    </div>
  );
}
