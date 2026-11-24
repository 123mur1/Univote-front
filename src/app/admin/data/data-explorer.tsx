"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { downloadCsv } from "@/lib/analytics";
import { toCsv } from "@/lib/registry";
import { Card, btn, input } from "@/components/ui";
import { DatabaseIcon, DownloadIcon, SearchIcon } from "@/components/icons";

type Row = Record<string, string | number>;
type Dataset = { key: string; label: string; description: string; columns: { key: string; label: string }[]; load: () => Promise<Row[]> };

const day = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
const dateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-GB") : "");

async function paged<T>(path: string, pageSize = 200) {
  const rows: T[] = [];
  for (let page = 1; page < 500; page++) {
    const separator = path.includes("?") ? "&" : "?";
    const chunk = await apiRequest<{ items: T[]; total: number }>(`${path}${separator}page=${page}&pageSize=${pageSize}`);
    rows.push(...chunk.items);
    if (rows.length >= chunk.total || !chunk.items.length) break;
  }
  return rows;
}

const DATASETS: Dataset[] = [
  {
    key: "registry", label: "Registry students", description: "The eligibility list imported from the registry office.",
    columns: [{ key: "registrationNumber", label: "Reg. number" }, { key: "name", label: "Name" }, { key: "college", label: "College" }, { key: "school", label: "School" }, { key: "department", label: "Department" }, { key: "campus", label: "Campus" }, { key: "year", label: "Year" }, { key: "enrolment", label: "Status" }, { key: "academicYear", label: "Academic year" }, { key: "account", label: "Account" }],
    load: async () => (await paged<Record<string, unknown> & { studentProfile: unknown }>("/registry")).map((r) => ({
      registrationNumber: String(r.registrationNumber), name: `${r.firstName} ${r.lastName}`, college: String(r.college), school: String(r.school), department: String(r.department),
      campus: String(r.campus), year: r.yearOfStudy ? Number(r.yearOfStudy) : "", enrolment: String(r.enrolment).toLowerCase(), academicYear: String(r.registeredAcademicYear ?? ""), account: r.studentProfile ? "yes" : "no",
    })),
  },
  {
    key: "accounts", label: "User accounts", description: "Every student, officer and administrator account.",
    columns: [{ key: "name", label: "Name" }, { key: "identifier", label: "Reg. number / email" }, { key: "role", label: "Role" }, { key: "status", label: "Status" }, { key: "failedSignIns", label: "Failed sign-ins" }, { key: "lastLogin", label: "Last sign-in" }, { key: "created", label: "Created" }],
    load: async () => (await paged<Record<string, unknown>>("/users")).map((u) => ({
      name: String(u.name), identifier: String(u.registrationNumber ?? u.email ?? ""), role: String(u.role).toLowerCase().replace(/_/g, " "), status: u.active ? "active" : "suspended",
      failedSignIns: Number(u.failedSignIns), lastLogin: dateTime(u.lastLoginAt as string), created: day(u.createdAt as string),
    })),
  },
  {
    key: "applications", label: "Candidate applications", description: "Nominations submitted by students and the commission's decisions.",
    columns: [{ key: "name", label: "Applicant" }, { key: "registrationNumber", label: "Reg. number" }, { key: "position", label: "Position" }, { key: "election", label: "Election" }, { key: "status", label: "Status" }, { key: "submitted", label: "Submitted" }, { key: "note", label: "Decision note" }],
    load: async () => (await apiRequest<Record<string, unknown>[]>("/nominations")).map((n) => ({
      name: String(n.name), registrationNumber: String(n.studentRegistrationNo), position: String((n.contest as { title: string }).title), election: String((n.election as { title: string }).title),
      status: String(n.status).toLowerCase(), submitted: day(n.submittedAt as string), note: String(n.decisionNote ?? ""),
    })),
  },
  {
    key: "activity", label: "Security & activity log", description: "The latest 500 sign-ins, changes and refusals.",
    columns: [{ key: "when", label: "When" }, { key: "actor", label: "Actor" }, { key: "role", label: "Role" }, { key: "type", label: "Type" }, { key: "severity", label: "Severity" }, { key: "detail", label: "Detail" }],
    load: async () => (await apiRequest<Record<string, unknown>[]>("/audit/activity?take=500")).map((a) => ({
      when: dateTime(a.occurredAt as string), actor: String(a.actorLabel), role: String(a.actorRole).toLowerCase(), type: String(a.type).toLowerCase().replace(/_/g, " "), severity: String(a.severity).toLowerCase(), detail: String(a.detail),
    })),
  },
];

export function DataExplorer() {
  const [key, setKey] = useState(DATASETS[0].key);
  const [state, setState] = useState<{ key: string; rows?: Row[]; error?: string }>({ key: "" });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ column: string; asc: boolean } | null>(null);
  const dataset = DATASETS.find((d) => d.key === key)!;

  useEffect(() => {
    let live = true;
    dataset.load()
      .then((rows) => { if (live) setState({ key, rows }); })
      .catch((cause) => { if (live) setState({ key, error: cause instanceof Error ? cause.message : "Could not load data." }); });
    return () => { live = false; };
  }, [dataset, key]);

  const current = state.key === key ? state : { key, rows: undefined, error: undefined };
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (current.rows ?? []).filter((row) => !q || Object.values(row).some((v) => String(v).toLowerCase().includes(q)));
    if (!sort) return list;
    return [...list].sort((a, b) => {
      const left = a[sort.column];
      const right = b[sort.column];
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
      return sort.asc ? order : -order;
    });
  }, [current.rows, query, sort]);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="h-fit p-2">
        {DATASETS.map((d) => (
          <button key={d.key} type="button" onClick={() => { setKey(d.key); setQuery(""); setSort(null); }} className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${key === d.key ? "bg-urblue text-white" : "text-slate-700 hover:bg-urblue-50"}`}>
            <DatabaseIcon width={17} height={17} className="mt-0.5 shrink-0" />
            <span><span className="block text-sm font-semibold">{d.label}</span><span className={`block text-xs ${key === d.key ? "text-urblue-100" : "text-slate-500"}`}>{d.description}</span></span>
          </button>
        ))}
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${dataset.label.toLowerCase()}`} className={`${input} pl-9`} aria-label="Search data" />
          </div>
          <button type="button" disabled={!rows.length} onClick={() => downloadCsv(`univote-${dataset.key}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows, dataset.columns.map((c) => c.key)))} className={btn.secondary}>
            <DownloadIcon width={16} height={16} /> Export {rows.length.toLocaleString("en-US")} rows
          </button>
        </div>
        {current.error && <p role="alert" className="bg-red-50 px-5 py-3 text-sm text-red-700">{current.error}</p>}
        <div className="max-h-[65vh] overflow-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="sticky top-0 bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>{dataset.columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-semibold">
                  <button type="button" onClick={() => setSort((s) => ({ column: c.key, asc: s?.column === c.key ? !s.asc : true }))} className="inline-flex items-center gap-1 uppercase">
                    {c.label}{sort?.column === c.key && (sort.asc ? " ▲" : " ▼")}
                  </button>
                </th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!current.rows && !current.error && <tr><td colSpan={dataset.columns.length} className="px-4 py-10 text-center text-slate-500">Loading…</td></tr>}
              {rows.slice(0, 500).map((row, i) => <tr key={i} className="hover:bg-urblue-50/40">{dataset.columns.map((c) => <td key={c.key} className="max-w-xs truncate px-4 py-2.5" title={String(row[c.key])}>{row[c.key]}</td>)}</tr>)}
              {current.rows && rows.length === 0 && <tr><td colSpan={dataset.columns.length} className="px-4 py-10 text-center text-slate-500">No rows match.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">{rows.length > 500 ? `Showing the first 500 of ${rows.length.toLocaleString("en-US")} rows. Export includes all of them.` : `${rows.length.toLocaleString("en-US")} rows`}</p>
      </Card>
    </div>
  );
}
