"use client";

import { useEffect, useMemo, useState } from "react";
import type { Election } from "@/lib/data";
import { downloadCsv, useElectionStats, useStudentRows } from "@/lib/analytics";
import { useHydrated } from "@/lib/local-store";
import { fullName, scopeLabel, toCsv } from "@/lib/registry";
import { useSettings } from "@/lib/settings";
import { Badge, Card, btn, input } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { apiRequest } from "@/lib/api-client";
import { readSession } from "@/lib/session";
import { useApiElections } from "@/lib/election-api";

const PAGE = 25;
type RemoteData = {
  election: { eligibleCount: number; votedCount: number };
  filters: { schools: string[] };
  items: { registrationNumber: string; name: string; school: string; campus: string; voted: boolean }[];
  total: number;
};

export function VoterTable({ elections, allowExport = false }: { elections: Election[]; allowExport?: boolean }) {
  const hydrated = useHydrated();
  const settings = useSettings();
  const rows = useStudentRows();
  const apiElections = useApiElections();
  const remoteMode = Boolean(readSession()?.accessToken);
  const options = remoteMode && apiElections.length ? apiElections : elections;
  const [electionId, setElectionId] = useState(options[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("");
  const [voted, setVoted] = useState<"" | "yes" | "no">("");
  const [page, setPage] = useState(0);
  const [remoteData, setRemoteData] = useState<RemoteData | null>(null);
  const [remoteError, setRemoteError] = useState("");

  useEffect(() => {
    if (options.length && !options.some((item) => item.id === electionId)) setElectionId(options[0].id);
  }, [options, electionId]);
  const election = options.find((item) => item.id === electionId);
  const { electorate, voters } = useElectionStats(election, rows);
  useEffect(() => {
    if (!remoteMode || !electionId) return;
    const params = new URLSearchParams({ page: String(page + 1), pageSize: String(PAGE), q: query, school, voted });
    apiRequest<RemoteData>(`/elections/${electionId}/voters?${params}`)
      .then((data) => { setRemoteData(data); setRemoteError(""); })
      .catch((cause) => { setRemoteData(null); setRemoteError(cause instanceof Error ? cause.message : "Could not load the backend voter roll."); });
  }, [remoteMode, electionId, page, query, school, voted]);

  const votedSet = useMemo(() => new Set(voters.map((v) => v.regNumber)), [voters]);
  const localSchools = useMemo(() => [...new Set(electorate.map((s) => s.school))].sort(), [electorate]);
  const schools = remoteMode && remoteData ? remoteData.filters.schools : localSchools;
  const q = query.trim().toLowerCase();
  const filtered = electorate.filter((student) =>
    (!q || fullName(student).toLowerCase().includes(q) || student.regNumber.toLowerCase().includes(q)) &&
    (!school || student.school === school) && (!voted || (voted === "yes") === votedSet.has(student.regNumber)));
  const localShown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const total = remoteMode && remoteData ? remoteData.total : filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;

  function exportCsv() {
    const data = remoteMode && remoteData
      ? remoteData.items.map((item) => ({ regNumber: item.registrationNumber, name: item.name, school: item.school, campus: item.campus, voted: item.voted ? "yes" : "no" }))
      : filtered.map((student) => ({ regNumber: student.regNumber, name: fullName(student), school: student.school, campus: student.campus, voted: votedSet.has(student.regNumber) ? "yes" : "no" }));
    downloadCsv(`voter-roll-${electionId}.csv`, toCsv(data, ["regNumber", "name", "school", "campus", "voted"]));
  }

  const displayRows = remoteMode && remoteData
    ? remoteData.items.map((item) => ({ regNumber: item.registrationNumber, name: item.name, school: item.school, campus: item.campus, voted: item.voted }))
    : localShown.map((student) => ({ regNumber: student.regNumber, name: fullName(student), school: student.school, campus: student.campus, voted: votedSet.has(student.regNumber) }));

  return <Card className="overflow-hidden">
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
      <select value={electionId} onChange={(event) => { setElectionId(event.target.value); setSchool(""); setPage(0); }} className={`${input} lg:max-w-xs`} aria-label="Election">
        {options.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
      <div className="relative flex-1"><SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search name or registration number" className={`${input} pl-10`} aria-label="Search voters" />
      </div>
      <select value={school} onChange={(event) => { setSchool(event.target.value); setPage(0); }} className={`${input} lg:max-w-56`} aria-label="School"><option value="">All schools</option>{schools.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={voted} onChange={(event) => { setVoted(event.target.value as typeof voted); setPage(0); }} className={`${input} lg:max-w-40`} aria-label="Voted"><option value="">Voted or not</option><option value="yes">Voted</option><option value="no">Not yet</option></select>
      {(allowExport || settings.officerPermissions.exportVoterRoll) && <button type="button" onClick={exportCsv} className={btn.secondary}><DownloadIcon width={16} height={16} /> Export</button>}
    </div>
    {election && <p className="border-b border-slate-100 bg-urblue-50/60 px-5 py-2.5 text-xs text-slate-600">
      {scopeLabel(election.eligibility)} · {(remoteMode && remoteData ? remoteData.election.eligibleCount : electorate.length).toLocaleString("en-US")} eligible by registry rules for {settings.academicYear.label} · {(remoteMode && remoteData ? remoteData.election.votedCount : voters.length).toLocaleString("en-US")} voted
    </p>}
    {remoteError && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{remoteError}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
      <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark"><tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-5 py-3 font-semibold">School</th><th className="px-5 py-3 font-semibold">Campus</th><th className="px-5 py-3 font-semibold">Voted</th></tr></thead>
      <tbody className="divide-y divide-slate-100">
        {displayRows.map((student) => <tr key={student.regNumber} className="hover:bg-urblue-50/50"><td className="px-5 py-3"><p className="font-medium">{student.name}</p><p className="font-mono text-xs text-slate-500">{student.regNumber}</p></td><td className="px-5 py-3">{student.school}</td><td className="px-5 py-3">{student.campus}</td><td className="px-5 py-3">{student.voted ? <Badge tone="green">Voted</Badge> : <Badge tone="gray">Not yet</Badge>}</td></tr>)}
        {displayRows.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No eligible students match these filters.</td></tr>}
      </tbody>
    </table></div>
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"><span>{total.toLocaleString("en-US")} students · page {page + 1} of {pages}</span><div className="flex gap-2"><button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button></div></div>
  </Card>;
}
