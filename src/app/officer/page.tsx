"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { applications, elections } from "@/lib/data";
import { eligibleFor, simulatedVoted, simulatedVoteHour } from "@/lib/participation";
import { seedRegistry } from "@/lib/registry";
import { PendingApplicantsCard } from "./pending-applicants-card";
import { Card, PageHeader, ProgressBar, StatCard, btn, formatNumber, percent } from "@/components/ui";
import { AlertIcon, BallotIcon, ChartIcon, CheckCircleIcon, PlusIcon, UsersIcon } from "@/components/icons";
import { useApiElections } from "@/lib/election-api";
import { apiRequest } from "@/lib/api-client";
import { useSession } from "@/lib/session";

const integrityChecks = [
  { label: "Bulletin board", detail: "Checkpoint matches ballot count", ok: true },
  { label: "Duplicate voting", detail: "0 duplicate ballots blocked today", ok: true },
  { label: "Login anomalies", detail: "1 student ID rate-limited", ok: false },
];

export default function OfficerDashboard() {
  const backendElections = useApiElections();
  const session = useSession();
  const liveBackend = backendElections.find((item) => item.status === "open");
  if (session?.accessToken && !backendElections.length) return <PageHeader title="Election monitoring" description="Loading current elections from the backend…" />;
  if (liveBackend) return <BackendOfficerDashboard live={liveBackend} />;
  if (session?.accessToken) return <PageHeader title="Election monitoring" description="There is no election currently open for voting. View scheduled elections or create a new election." actions={<Link href="/officer/elections" className={btn.primary}>View elections</Link>} />;
  const live = elections.find((e) => e.status === "open");
  if (!live) return <PageHeader title="Election monitoring" description="No election is currently open for voting." actions={<Link href="/officer/elections" className={btn.primary}>View elections</Link>} />;
  // Counts only, from the registry electorate: ballot contents are never visible during voting.
  const electorate = seedRegistry.filter((s) => eligibleFor(s, live));
  const voters = electorate.filter((s) => simulatedVoted(s.regNumber, live.id));
  const hourly = Array.from({ length: 10 }, (_, i) => ({ hour: String(8 + i).padStart(2, "0"), ballots: voters.filter((s) => simulatedVoteHour(s.regNumber, live.id) === 8 + i).length }));
  const peak = Math.max(1, ...hourly.map((h) => h.ballots));
  const byCollege = [...new Set(electorate.map((s) => s.collegeCode))]
    .map((code) => ({ college: code, eligible: electorate.filter((s) => s.collegeCode === code).length, voted: voters.filter((s) => s.collegeCode === code).length }))
    .sort((a, b) => b.voted / b.eligible - a.voted / a.eligible);

  return (
    <>
      <PageHeader
        title="Election monitoring"
        description={`${live.title} · voting open until ${live.closes}`}
        actions={
          <Link href="/officer/elections/new" className={btn.primary}>
            <PlusIcon width={18} height={18} /> New election
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ballots cast" value={formatNumber(live.ballotsCast)} hint="Since 08:00 today · View elections" icon={<BallotIcon />} href="/officer/elections" />
        <StatCard label="Turnout" value={percent(live.ballotsCast, live.eligibleVoters)} hint={`of ${formatNumber(live.eligibleVoters)} eligible · View elections`} icon={<ChartIcon />} href="/officer/elections" />
        <StatCard label="Eligible voters" value={formatNumber(live.eligibleVoters)} hint="Registry-checked electorate · View voter roll" icon={<UsersIcon />} href="/officer/voters" />
        <PendingApplicantsCard seeded={applications} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold">Ballots per hour</h2>
          <p className="text-sm text-slate-500">Counts only: no ballot contents are visible during voting.</p>
          <div className="mt-6 flex h-48 items-end gap-3">
            {hourly.map((h) => (
              <div key={h.hour} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold text-urblue">{formatNumber(h.ballots)}</span>
                <div className="w-full rounded-t-md bg-urblue" style={{ height: `${(h.ballots / peak) * 140}px` }} />
                <span className="text-xs text-slate-500">{h.hour}:00</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold">Integrity checks</h2>
          <ul className="mt-4 space-y-4">
            {integrityChecks.map((c) => (
              <li key={c.label} className="flex gap-3">
                {c.ok ? (
                  <CheckCircleIcon className="shrink-0 text-emerald-600" />
                ) : (
                  <AlertIcon className="shrink-0 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <h2 className="font-semibold">Turnout by college</h2>
          <ul className="mt-5 space-y-4">
            {byCollege.map((f) => (
              <li key={f.college}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{f.college}</span>
                  <span className="font-medium text-slate-600">
                    {formatNumber(f.voted)} / {formatNumber(f.eligible)} · <span className="text-urblue">{percent(f.voted, f.eligible)}</span>
                  </span>
                </div>
                <ProgressBar value={f.voted} max={f.eligible} />
              </li>
            ))}
          </ul>
        </Card>

      </div>
    </>
  );
}

function BackendOfficerDashboard({ live }: { live: (typeof elections)[number] }) {
  const [summary, setSummary] = useState<{ eligibleCount: number; votedCount: number; byHour: { hour: number; ballots: number }[]; byCollege: { college: string; eligible: number; voted: number }[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<typeof summary>(`/elections/${live.id}/turnout`).then(setSummary).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load turnout data."));
  }, [live.id]);
  const hours = (summary?.byHour ?? []).filter((row) => row.hour >= 6 && row.hour <= 22);
  const peak = Math.max(1, ...hours.map((row) => row.ballots));
  return <>
    <PageHeader title="Election monitoring" description={`${live.title} · voting closes ${live.closes}`} actions={<Link href="/officer/elections/new" className={btn.primary}><PlusIcon width={18} height={18} /> New election</Link>} />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Ballots cast" value={formatNumber(summary?.votedCount ?? live.ballotsCast)} hint="Count only · View elections" icon={<BallotIcon />} href="/officer/elections" />
      <StatCard label="Turnout" value={percent(summary?.votedCount ?? live.ballotsCast, summary?.eligibleCount ?? live.eligibleVoters)} hint="Of eligible voters" icon={<ChartIcon />} href="/officer/elections" />
      <StatCard label="Eligible voters" value={formatNumber(summary?.eligibleCount ?? live.eligibleVoters)} hint="Registry-checked electorate" icon={<UsersIcon />} href="/officer/voters" />
      <PendingApplicantsCard seeded={applications} />
    </div>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2"><h2 className="font-semibold">Ballots per UTC hour</h2><p className="text-sm text-slate-500">Counts only. Ballot selections remain encrypted.</p>
        <div className="mt-6 flex h-48 items-end gap-2">{hours.map((row) => <div key={row.hour} className="flex flex-1 flex-col items-center gap-2"><span className="text-[10px] font-semibold text-urblue">{formatNumber(row.ballots)}</span><div className="w-full rounded-t-md bg-urblue" style={{ height: `${(row.ballots / peak) * 140}px` }} /><span className="text-[10px] text-slate-500">{String(row.hour).padStart(2, "0")}</span></div>)}</div>
      </Card>
      <Card className="p-6"><h2 className="font-semibold">Turnout by college</h2><ul className="mt-5 space-y-4">{(summary?.byCollege ?? []).map((row) => <li key={row.college}><div className="mb-1.5 flex justify-between text-sm"><span>{row.college}</span><span className="font-medium text-slate-600">{formatNumber(row.voted)} / {formatNumber(row.eligible)} · <span className="text-urblue">{percent(row.voted, row.eligible)}</span></span></div><ProgressBar value={row.voted} max={row.eligible} /></li>)}</ul></Card>
    </div>
  </>;
}
