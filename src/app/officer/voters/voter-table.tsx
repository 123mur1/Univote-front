"use client";

import { useMemo, useState } from "react";
import type { Election } from "@/lib/data";
import { downloadCsv, useElectionStats, useStudentRows } from "@/lib/analytics";
import { useHydrated } from "@/lib/local-store";
import { fullName, scopeLabel, toCsv } from "@/lib/registry";
import { useSettings } from "@/lib/settings";
import { Badge, Card, btn, input } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";

const PAGE = 25;

export function VoterTable({ elections }: { elections: Election[] }) {
  const hydrated = useHydrated();
  const settings = useSettings();
  const rows = useStudentRows();
  const [electionId, setElectionId] = useState(elections[0]?.id ?? "");
  const election = elections.find((e) => e.id === electionId);
  const { electorate, voters } = useElectionStats(election, rows);
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("");
  const [voted, setVoted] = useState<"" | "yes" | "no">("");
  const [page, setPage] = useState(0);

  const votedSet = useMemo(() => new Set(voters.map((v) => v.regNumber)), [voters]);
  const schools = useMemo(() => [...new Set(electorate.map((s) => s.school))].sort(), [electorate]);
  const q = query.trim().toLowerCase();
  const filtered = electorate.filter(
    (s) =>
      (!q || fullName(s).toLowerCase().includes(q) || s.regNumber.toLowerCase().includes(q)) &&
      (!school || s.school === school) &&
      (!voted || (voted === "yes") === votedSet.has(s.regNumber)),
  );
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;

  function exportCsv() {
    const data = filtered.map((s) => ({ regNumber: s.regNumber, name: fullName(s), school: s.school, campus: s.campus, voted: votedSet.has(s.regNumber) ? "yes" : "no" }));
    downloadCsv(`voter-roll-${electionId}.csv`, toCsv(data, ["regNumber", "name", "school", "campus", "voted"]));
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <select value={electionId} onChange={(e) => { setElectionId(e.target.value); setSchool(""); setPage(0); }} className={`${input} lg:max-w-xs`} aria-label="Election">
          {elections.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
        <div className="relative flex-1">
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search name or registration number" className={`${input} pl-10`} aria-label="Search voters" />
        </div>
        <select value={school} onChange={(e) => { setSchool(e.target.value); setPage(0); }} className={`${input} lg:max-w-56`} aria-label="School">
          <option value="">All schools</option>
          {schools.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={voted} onChange={(e) => { setVoted(e.target.value as typeof voted); setPage(0); }} className={`${input} lg:max-w-40`} aria-label="Voted">
          <option value="">Voted or not</option>
          <option value="yes">Voted</option>
          <option value="no">Not yet</option>
        </select>
        {settings.officerPermissions.exportVoterRoll && (
          <button type="button" onClick={exportCsv} className={btn.secondary}>
            <DownloadIcon width={16} height={16} /> Export
          </button>
        )}
      </div>
      {election && (
        <p className="border-b border-slate-100 bg-urblue-50/60 px-5 py-2.5 text-xs text-slate-600">
          {scopeLabel(election.eligibility)} · {electorate.length.toLocaleString("en-US")} eligible by registry rules for {settings.academicYear.label} ·{" "}
          {voters.length.toLocaleString("en-US")} voted
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">School</th>
              <th className="px-5 py-3 font-semibold">Campus</th>
              <th className="px-5 py-3 font-semibold">Voted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((s) => (
              <tr key={s.regNumber} className="hover:bg-urblue-50/50">
                <td className="px-5 py-3">
                  <p className="font-medium">{fullName(s)}</p>
                  <p className="font-mono text-xs text-slate-500">{s.regNumber}</p>
                </td>
                <td className="px-5 py-3">{s.school}</td>
                <td className="px-5 py-3">{s.campus}</td>
                <td className="px-5 py-3">{votedSet.has(s.regNumber) ? <Badge tone="green">Voted</Badge> : <Badge tone="gray">Not yet</Badge>}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No eligible students match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>{filtered.length.toLocaleString("en-US")} students · page {page + 1} of {pages}</span>
        <div className="flex gap-2">
          <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
    </Card>
  );
}
