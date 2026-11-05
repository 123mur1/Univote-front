"use client";

import { useMemo, useState } from "react";
import { applications } from "@/lib/data";
import { ACTIVITY_LABELS, useActivity } from "@/lib/activity";
import { STANDINGS, downloadCsv, useStudentRows } from "@/lib/analytics";
import { useRegisteredStudents } from "@/lib/accounts";
import { useHydrated } from "@/lib/local-store";
import { fullName, toCsv } from "@/lib/registry";
import { effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { Card, btn, input } from "@/components/ui";
import { DownloadIcon, FilterIcon, SearchIcon } from "@/components/icons";

type Row = Record<string, string | number>;
type Column = { key: string; label: string; numeric?: boolean };
type FilterDef = { key: string; label: string };

type Dataset = { id: string; label: string; description: string; columns: Column[]; filters: FilterDef[]; rows: Row[] };

const PAGE = 25;

export function DataExplorer() {
  const hydrated = useHydrated();
  const students = useStudentRows();
  const accounts = useRegisteredStudents();
  const activity = useActivity();
  const reviews = useReviews();
  const submissions = useSubmissions();

  const datasets: Dataset[] = useMemo(
    () => [
      {
        id: "students",
        label: "Students (registry)",
        description: "Every student on the registry office's list, with their voting standing and account status.",
        columns: [
          { key: "regNumber", label: "Reg. number" },
          { key: "name", label: "Name" },
          { key: "gender", label: "Gender" },
          { key: "collegeCode", label: "College" },
          { key: "school", label: "School" },
          { key: "department", label: "Department" },
          { key: "campus", label: "Campus" },
          { key: "level", label: "Level" },
          { key: "yearOfStudy", label: "Year", numeric: true },
          { key: "enrolment", label: "Enrolment" },
          { key: "registeredAcademicYear", label: "Registered for" },
          { key: "studyEnd", label: "Study ends" },
          { key: "standing", label: "Voting standing" },
          { key: "account", label: "Account" },
          { key: "accountCreated", label: "Account created" },
        ],
        filters: [
          { key: "collegeCode", label: "College" },
          { key: "school", label: "School" },
          { key: "campus", label: "Campus" },
          { key: "level", label: "Level" },
          { key: "yearOfStudy", label: "Year" },
          { key: "enrolment", label: "Enrolment" },
          { key: "standing", label: "Voting standing" },
          { key: "account", label: "Account" },
          { key: "gender", label: "Gender" },
        ],
        rows: students.map((s) => ({
          regNumber: s.regNumber, name: fullName(s), gender: s.gender, collegeCode: s.collegeCode, school: s.school, department: s.department,
          campus: s.campus, level: s.level, yearOfStudy: s.yearOfStudy, enrolment: s.enrolment, registeredAcademicYear: s.registeredAcademicYear,
          studyEnd: s.studyEnd, standing: s.standing, account: s.account, accountCreated: s.accountCreated ?? "",
        })),
      },
      {
        id: "accounts",
        label: "Accounts created here",
        description: "Student accounts created through sign-up in this system.",
        columns: [
          { key: "regNumber", label: "Reg. number" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "createdAt", label: "Created" },
          { key: "createdForAcademicYear", label: "Signed up in" },
          { key: "status", label: "Status" },
          { key: "lastLoginAt", label: "Last sign-in" },
        ],
        filters: [
          { key: "status", label: "Status" },
          { key: "createdForAcademicYear", label: "Signed up in" },
        ],
        rows: accounts.map((a) => ({
          regNumber: a.regNumber, name: `${a.firstName} ${a.lastName}`, email: a.email, phone: a.phone, createdAt: a.createdAt.slice(0, 10),
          createdForAcademicYear: a.createdForAcademicYear, status: a.suspended ? "Suspended" : "Active", lastLoginAt: a.lastLoginAt?.slice(0, 16).replace("T", " ") ?? "",
        })),
      },
      {
        id: "nominations",
        label: "Nominations",
        description: "Candidate nominations and the officer's decision.",
        columns: [
          { key: "name", label: "Candidate" },
          { key: "studentId", label: "Reg. number" },
          { key: "contest", label: "Position" },
          { key: "election", label: "Election" },
          { key: "submitted", label: "Submitted" },
          { key: "status", label: "Status" },
          { key: "decidedBy", label: "Decided by" },
        ],
        filters: [
          { key: "election", label: "Election" },
          { key: "status", label: "Status" },
        ],
        rows: [...submissions, ...applications].map((a) => ({
          name: a.name, studentId: a.studentId, contest: a.contest, election: a.election, submitted: a.submitted,
          status: effectiveStatus(a, reviews[a.id]), decidedBy: reviews[a.id]?.decidedBy ?? (a.status === "pending" ? "" : "Before this session"),
        })),
      },
      {
        id: "activity",
        label: "Security & activity",
        description: "Sign-ins, failures, timeouts, blocked votes and administrative changes.",
        columns: [
          { key: "at", label: "Time" },
          { key: "type", label: "Event" },
          { key: "severity", label: "Severity" },
          { key: "role", label: "Role" },
          { key: "actor", label: "Actor" },
          { key: "detail", label: "Detail" },
        ],
        filters: [
          { key: "type", label: "Event" },
          { key: "severity", label: "Severity" },
          { key: "role", label: "Role" },
        ],
        rows: activity.map((a) => ({ at: a.at.slice(0, 19).replace("T", " "), type: ACTIVITY_LABELS[a.type], severity: a.severity, role: a.role, actor: a.actor, detail: a.detail })),
      },
    ],
    [students, accounts, activity, reviews, submissions],
  );

  const [datasetId, setDatasetId] = useState("students");
  const dataset = datasets.find((d) => d.id === datasetId)!;
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({ department: true, gender: true, level: true, accountCreated: true });
  const [page, setPage] = useState(0);

  const options = useMemo(() => {
    const o: Record<string, string[]> = {};
    dataset.filters.forEach((f) => {
      const vals = [...new Set(dataset.rows.map((r) => String(r[f.key])))].filter(Boolean);
      o[f.key] = f.key === "standing" ? STANDINGS.filter((s) => vals.includes(s)) : vals.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
    return o;
  }, [dataset]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = dataset.rows.filter(
      (r) => (!q || Object.values(r).some((v) => String(v).toLowerCase().includes(q))) && Object.entries(filters).every(([k, v]) => !v || String(r[k]) === v),
    );
    if (sort) rows = [...rows].sort((a, b) => (a[sort.key] > b[sort.key] ? sort.dir : a[sort.key] < b[sort.key] ? -sort.dir : 0));
    return rows;
  }, [dataset, query, filters, sort]);

  const columns = dataset.columns.filter((c) => !hidden[c.key]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const activeFilters = Object.values(filters).filter(Boolean).length;

  function switchDataset(id: string) {
    setDatasetId(id);
    setFilters({});
    setQuery("");
    setSort(null);
    setPage(0);
  }

  if (!hydrated) return <div className="h-[500px] animate-pulse rounded-xl bg-urblue-100/60" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist">
        {datasets.map((d) => (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={d.id === datasetId}
            onClick={() => switchDataset(d.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${d.id === datasetId ? "bg-urblue text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-urblue-300"}`}
          >
            {d.label} <span className="opacity-70">({d.rows.length.toLocaleString("en-US")})</span>
          </button>
        ))}
      </div>
      <p className="text-sm text-slate-600">{dataset.description}</p>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search every column" className={`${input} pl-10`} aria-label="Search" />
          </div>
          <button type="button" onClick={() => downloadCsv(`univote-${dataset.id}.csv`, toCsv(filtered, columns.map((c) => c.key)))} className={btn.primary}>
            <DownloadIcon width={16} height={16} /> Export {filtered.length.toLocaleString("en-US")} rows
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {dataset.filters.map((f) => (
            <label key={f.key} className="text-xs font-medium text-slate-600">
              {f.label}
              <select
                value={filters[f.key] ?? ""}
                onChange={(e) => { setFilters({ ...filters, [f.key]: e.target.value }); setPage(0); }}
                className={`${input} mt-1 py-2!`}
              >
                <option value="">All</option>
                {options[f.key]?.map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <details className="relative">
            <summary className="cursor-pointer font-medium text-urblue">Columns ({columns.length}/{dataset.columns.length})</summary>
            <div className="absolute z-20 mt-2 grid w-64 gap-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
              {dataset.columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 text-slate-700">
                  <input type="checkbox" checked={!hidden[c.key]} onChange={() => setHidden({ ...hidden, [c.key]: !hidden[c.key] })} className="accent-urblue" />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
          {activeFilters > 0 && (
            <button type="button" onClick={() => setFilters({})} className="inline-flex items-center gap-1 font-medium text-urblue hover:underline">
              <FilterIcon width={14} height={14} /> Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="whitespace-nowrap px-4 py-3 font-semibold" aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                    <button
                      type="button"
                      onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: sort.dir === 1 ? -1 : 1 } : { key: c.key, dir: 1 })}
                      className="inline-flex items-center gap-1 uppercase hover:text-urblue"
                    >
                      {c.label}
                      <span aria-hidden="true" className="text-[10px]">{sort?.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : ""}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((r, i) => (
                <tr key={i} className="hover:bg-urblue-50/50">
                  {columns.map((c) => (
                    <td key={c.key} className={`whitespace-nowrap px-4 py-2.5 ${c.numeric ? "text-right tabular-nums" : ""} ${c.key === "regNumber" || c.key === "studentId" ? "font-mono text-xs" : ""}`}>
                      {String(r[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-slate-500">No records match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          <span>{filtered.length.toLocaleString("en-US")} of {dataset.rows.length.toLocaleString("en-US")} records · page {page + 1} of {pages}</span>
          <div className="flex gap-2">
            <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
            <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
