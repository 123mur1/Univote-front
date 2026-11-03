import type { Metadata } from "next";
import Link from "next/link";
import { applications, auditLog, elections, turnoutByFaculty } from "@/lib/data";
import { PendingApplicantsCard } from "./pending-applicants-card";
import { Card, PageHeader, ProgressBar, StatCard, btn, formatNumber, percent } from "@/components/ui";
import { AlertIcon, BallotIcon, ChartIcon, CheckCircleIcon, PlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Election monitoring" };

const hourly = [
  { hour: "08", ballots: 412 },
  { hour: "09", ballots: 980 },
  { hour: "10", ballots: 1514 },
  { hour: "11", ballots: 1290 },
  { hour: "12", ballots: 1018 },
];

const integrityChecks = [
  { label: "Audit chain", detail: "All entries linked", ok: true },
  { label: "Bulletin board", detail: "Checkpoint matches ballot count", ok: true },
  { label: "Duplicate voting", detail: "0 duplicate ballots blocked today", ok: true },
  { label: "Login anomalies", detail: "1 student ID rate-limited", ok: false },
];

export default function AdminDashboard() {
  const live = elections.find((e) => e.status === "open")!;
  const peak = Math.max(...hourly.map((h) => h.ballots));

  return (
    <>
      <PageHeader
        title="Election monitoring"
        description={`${live.title} · voting open until ${live.closes}`}
        actions={
          <Link href="/admin/elections/new" className={btn.primary}>
            <PlusIcon width={18} height={18} /> New election
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ballots cast" value={formatNumber(live.ballotsCast)} hint="Since 08:00 today" icon={<BallotIcon />} />
        <StatCard label="Turnout" value={percent(live.ballotsCast, live.eligibleVoters)} hint={`of ${formatNumber(live.eligibleVoters)} eligible`} icon={<ChartIcon />} />
        <StatCard label="Eligible voters" value={formatNumber(live.eligibleVoters)} hint="Synced from registry 1 Oct" icon={<UsersIcon />} />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold">Turnout by faculty</h2>
          <ul className="mt-5 space-y-4">
            {turnoutByFaculty.map((f) => (
              <li key={f.faculty}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{f.faculty}</span>
                  <span className="font-medium text-slate-600">
                    {formatNumber(f.voted)} / {formatNumber(f.eligible)} · <span className="text-urblue">{percent(f.voted, f.eligible)}</span>
                  </span>
                </div>
                <ProgressBar value={f.voted} max={f.eligible} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href="/admin/audit" className="text-sm font-medium text-urblue hover:underline">Full log</Link>
          </div>
          <ul className="mt-4 space-y-4">
            {[...auditLog].reverse().slice(0, 5).map((e) => (
              <li key={e.seq} className="flex gap-3 text-sm">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-urblue" />
                <div>
                  <p className="text-slate-800">{e.action}</p>
                  <p className="text-xs text-slate-500">{e.time} · {e.actor}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
