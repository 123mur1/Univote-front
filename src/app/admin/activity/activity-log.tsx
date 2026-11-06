"use client";

import { useMemo, useState } from "react";
import { ACTIVITY_LABELS, clearActivity, logActivity, useActivity, type ActivityType } from "@/lib/activity";
import { downloadCsv } from "@/lib/analytics";
import { useHydrated, useNow } from "@/lib/local-store";
import { toCsv } from "@/lib/registry";
import { readSession } from "@/lib/session";
import { ChartCard, ColumnChart } from "@/components/charts";
import { Badge, Card, StatCard, btn, input } from "@/components/ui";
import { ActivityIcon, AlertIcon, DownloadIcon, LockIcon, SearchIcon, UsersIcon } from "@/components/icons";

export function ActivityLog() {
  const hydrated = useHydrated();
  const activity = useActivity();
  const now = useNow();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [role, setRole] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activity.filter(
      (a) =>
        (!q || `${a.actor} ${a.detail}`.toLowerCase().includes(q)) &&
        (!type || a.type === type) &&
        (!severity || a.severity === severity) &&
        (!role || a.role === role),
    );
  }, [activity, query, type, severity, role]);

  const last7 = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now - (6 - i) * 86_400_000);
      return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-GB", { weekday: "short" }), value: 0 };
    });
    activity.forEach((a) => {
      const day = days.find((d) => d.key === a.at.slice(0, 10));
      if (day && (a.type === "login" || a.type === "login_failed")) day.value += 1;
    });
    return days.map((d) => ({ label: d.label, value: d.value, detail: d.key }));
  }, [activity, now]);

  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;

  const count = (t: ActivityType) => activity.filter((a) => a.type === t).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Successful sign-ins" value={String(count("login"))} icon={<UsersIcon />} />
        <StatCard label="Failed sign-ins" value={String(count("login_failed"))} hint="Wrong password, code or locked account" icon={<LockIcon />} />
        <StatCard label="Refused votes & sign-ups" value={String(count("vote_blocked") + count("signup_blocked"))} hint="Blocked by registry rules" icon={<AlertIcon />} />
        <StatCard label="Idle sign-outs" value={String(count("timeout"))} icon={<ActivityIcon />} />
      </div>

      <ChartCard title="Sign-in attempts, last 7 days" subtitle="Successful and failed" table={{ columns: ["Day", "Attempts"], rows: last7.map((d) => [d.detail ?? d.label, d.value]) }}>
        <ColumnChart data={last7} height={160} />
      </ChartCard>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row">
          <div className="relative flex-1">
            <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor or detail" className={`${input} pl-10`} aria-label="Search activity" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className={`${input} lg:w-48`} aria-label="Event">
            <option value="">All events</option>
            {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={`${input} lg:w-36`} aria-label="Severity">
            <option value="">Any severity</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${input} lg:w-36`} aria-label="Role">
            <option value="">Any role</option>
            <option value="student">Student</option>
            <option value="officer">Officer</option>
            <option value="admin">Admin</option>
            <option value="anonymous">Not signed in</option>
          </select>
          <button type="button" className={btn.secondary} onClick={() => downloadCsv("univote-activity.csv", toCsv(filtered, ["at", "type", "severity", "role", "actor", "detail"]))}>
            <DownloadIcon width={16} height={16} /> Export
          </button>
        </div>
        <ul className="max-h-[560px] divide-y divide-slate-100 overflow-auto">
          {filtered.map((a) => (
            <li key={a.id} className="flex gap-3 px-5 py-3 text-sm">
              {a.severity === "info" ? <ActivityIcon width={18} height={18} className="mt-0.5 shrink-0 text-urblue" /> : <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{ACTIVITY_LABELS[a.type]}</span>
                  <Badge tone={a.severity === "info" ? "gray" : a.severity === "warning" ? "amber" : "red"}>{a.severity}</Badge>
                  <Badge tone="blue">{a.role === "anonymous" ? "not signed in" : a.role}</Badge>
                </p>
                <p className="mt-0.5 text-slate-700">{a.detail}</p>
                <p className="text-xs text-slate-500">{new Date(a.at).toLocaleString("en-GB")} · {a.actor}</p>
              </div>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">{activity.length === 0 ? "Nothing recorded yet. Sign-ins, sign-ups, votes and admin changes appear here." : "No events match."}</li>}
        </ul>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>{filtered.length} of {activity.length} events (latest 1,000 kept in this prototype)</span>
          {confirmClear ? (
            <span className="flex gap-2">
              <button type="button" className="font-semibold text-red-700 hover:underline" onClick={() => {
                  clearActivity();
                  // Clearing the log is itself recorded, so it can't be done silently.
                  logActivity({ actor: readSession()?.detail ?? "admin", role: "admin", type: "settings", severity: "warning", detail: `Cleared ${activity.length} activity log entries.` , before: `${activity.length} activity entries`, after: "Activity log cleared" });
                  setConfirmClear(false);
                }}>Yes, clear the log</button>
              <button type="button" className="font-medium hover:underline" onClick={() => setConfirmClear(false)}>Cancel</button>
            </span>
          ) : (
            activity.length > 0 && <button type="button" className="font-medium text-urblue hover:underline" onClick={() => setConfirmClear(true)}>Clear log</button>
          )}
        </div>
      </Card>
    </div>
  );
}
