"use client";

import { useState, useSyncExternalStore } from "react";
import { apiRequest } from "@/lib/api-client";
import { notifyDataChanged, useApi } from "@/lib/use-api";
import { useSettings } from "@/lib/settings";
import type { RegistryRow } from "@/lib/student-api";
import { downloadCsv } from "@/lib/analytics";
import { toCsv } from "@/lib/registry";
import { Badge, Card, btn, input, label } from "./ui";
import { DownloadIcon, PlusIcon, SearchIcon, XIcon } from "./icons";

type Page = { items: (RegistryRow & { studentProfile: { userId: string } | null })[]; total: number; page: number; pageSize: number };
type Facets = { campuses: string[]; colleges: string[]; schools: string[]; departments: string[] };

const PAGE_SIZE = 25;
const ENROLMENTS = ["ACTIVE", "DEFERRED", "SUSPENDED", "GRADUATED", "WITHDRAWN"];
const subscribeNone = () => () => {};
const readQ = () => new URLSearchParams(window.location.search).get("q") ?? "";

const enrolmentTone = (value: string) => (value === "ACTIVE" ? "green" : value === "WITHDRAWN" || value === "SUSPENDED" ? "red" : "amber");

export function RegistryBrowser({ canAdd = true }: { canAdd?: boolean }) {
  const initialQ = useSyncExternalStore(subscribeNone, readQ, () => "");
  const [query, setQuery] = useState<string | null>(null);
  const q = query ?? initialQ;
  const [filters, setFilters] = useState({ campus: "", college: "", school: "", enrolment: "" });
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { data: facets } = useApi<Facets>("/registry/facets", { silent: true });
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), ...(q.trim() ? { q: q.trim() } : {}), ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
  const { data, error, loading } = useApi<Page>(`/registry?${params}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function exportAll() {
    setExporting(true);
    try {
      const rows: RegistryRow[] = [];
      for (let next = 1; ; next++) {
        const all = new URLSearchParams(params);
        all.set("page", String(next));
        all.set("pageSize", "200");
        const chunk = await apiRequest<Page>(`/registry?${all}`);
        rows.push(...chunk.items);
        if (rows.length >= chunk.total || !chunk.items.length) break;
      }
      downloadCsv("eligibility-list.csv", toCsv(rows.map((r) => ({ ...r, cumulativeGpa: r.cumulativeGpa ?? "", studyStart: r.studyStart?.slice(0, 10) ?? "", studyEnd: r.studyEnd?.slice(0, 10) ?? "" })), ["registrationNumber", "firstName", "lastName", "email", "campus", "college", "school", "department", "programme", "level", "yearOfStudy", "enrolment", "registeredAcademicYear", "studyStart", "studyEnd"]));
    } finally {
      setExporting(false);
    }
  }

  const select = (key: keyof typeof filters, placeholder: string, options: string[] = []) => (
    <select value={filters[key]} onChange={(e) => setFilter(key, e.target.value)} className={`${input} lg:max-w-48`} aria-label={placeholder}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option} value={option}>{key === "enrolment" ? option.toLowerCase() : option}</option>)}
    </select>
  );

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name or registration number" className={`${input} pl-9`} aria-label="Search the eligibility list" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={exportAll} disabled={exporting || !data?.total} className={btn.secondary}><DownloadIcon width={16} height={16} /> {exporting ? "Exporting…" : "Export CSV"}</button>
            {canAdd && <button type="button" onClick={() => setAdding(true)} className={btn.primary}><PlusIcon width={16} height={16} /> Add student</button>}
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row">
          {select("campus", "All campuses", facets?.campuses)}
          {select("college", "All colleges", facets?.colleges)}
          {select("school", "All schools", facets?.schools)}
          {select("enrolment", "Any status", ENROLMENTS)}
          {Object.values(filters).some(Boolean) && <button type="button" onClick={() => { setFilters({ campus: "", college: "", school: "", enrolment: "" }); setPage(1); }} className="text-sm font-medium text-urblue hover:underline lg:ml-2">Clear filters</button>}
        </div>
      </div>
      {error && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
            <tr><th className="px-5 py-3 font-semibold">Student</th><th className="px-5 py-3 font-semibold">College / school</th><th className="px-5 py-3 font-semibold">Campus</th><th className="px-5 py-3 font-semibold">Year</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Account</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && !data && [0, 1, 2, 3, 4].map((i) => <tr key={i}><td colSpan={6} className="px-5 py-3"><div className="h-8 animate-pulse rounded bg-urblue-50" /></td></tr>)}
            {data?.items.map((r) => (
              <tr key={r.registrationNumber} className="hover:bg-urblue-50/50">
                <td className="px-5 py-3"><p className="font-medium">{r.firstName} {r.lastName}</p><p className="font-mono text-xs text-slate-500">{r.registrationNumber}</p></td>
                <td className="px-5 py-3"><p>{r.college}</p><p className="text-xs text-slate-500">{r.school} · {r.department}</p></td>
                <td className="px-5 py-3">{r.campus}</td>
                <td className="px-5 py-3">{r.yearOfStudy ? `Year ${r.yearOfStudy}` : "—"}</td>
                <td className="px-5 py-3"><Badge tone={enrolmentTone(r.enrolment)}>{r.enrolment.toLowerCase()}</Badge><p className="mt-1 text-xs text-slate-500">{r.registeredAcademicYear ?? "Year not set"}</p></td>
                <td className="px-5 py-3">{r.studentProfile ? <Badge tone="blue">Has account</Badge> : <span className="text-xs text-slate-400">Not signed up</span>}</td>
              </tr>
            ))}
            {data && data.items.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">{data.total === 0 && !q && !Object.values(filters).some(Boolean) ? "The eligibility list is empty. Import the registry office's file or add students one by one." : "No students match these filters."}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        <span>{(data?.total ?? 0).toLocaleString("en-US")} students · page {page} of {pages}</span>
        <div className="flex gap-2">
          <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      </div>
      {adding && <AddStudentDialog facets={facets} onClose={() => setAdding(false)} />}
    </Card>
  );
}

function AddStudentDialog({ facets, onClose }: { facets?: Facets; onClose: () => void }) {
  const settings = useSettings();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (key: string) => String(form.get(key) ?? "").trim() || undefined;
    setBusy(true);
    setError("");
    try {
      await apiRequest("/registry/records", {
        method: "POST",
        body: JSON.stringify({
          registrationNumber: value("registrationNumber"), firstName: value("firstName"), lastName: value("lastName"), email: value("email"),
          gender: value("gender"), campus: value("campus"), college: value("college"), school: value("school"), department: value("department"),
          programme: value("programme"), level: value("level"), yearOfStudy: value("yearOfStudy"), enrolment: value("enrolment"),
          registeredAcademicYear: value("registeredAcademicYear"), studyStart: value("studyStart"), studyEnd: value("studyEnd"),
          cumulativeGpa: value("cumulativeGpa"), openDisciplinaryCase: form.get("openDisciplinaryCase") === "yes" ? true : form.get("openDisciplinaryCase") === "no" ? false : undefined,
        }),
      });
      notifyDataChanged();
      setDone(`${value("firstName")} ${value("lastName")} is on the eligibility list.`);
      formElement.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this student.");
    } finally {
      setBusy(false);
    }
  }

  const field = (name: string, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, list?: string[]) => (
    <div>
      <label htmlFor={`add-${name}`} className={label}>{text}</label>
      <input id={`add-${name}`} name={name} className={input} list={list ? `list-${name}` : undefined} {...props} />
      {list && <datalist id={`list-${name}`}>{list.map((option) => <option key={option} value={option} />)}</datalist>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-urblue-darker/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="add-student-title" className="text-lg font-bold">Add a student to the eligibility list</h2>
            <p className="mt-1 text-sm text-slate-600">Use this for corrections or late registrations. An existing registration number is updated.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><XIcon /></button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {field("registrationNumber", "Registration number *", { required: true, className: `${input} font-mono uppercase`, placeholder: "2024/BUS/0388" })}
          {field("email", "University email", { type: "email" })}
          {field("firstName", "First name *", { required: true })}
          {field("lastName", "Last name *", { required: true })}
          {field("campus", "Campus *", { required: true }, facets?.campuses)}
          {field("college", "College *", { required: true }, facets?.colleges)}
          {field("school", "School *", { required: true }, facets?.schools)}
          {field("department", "Department *", { required: true }, facets?.departments)}
          {field("programme", "Programme")}
          {field("yearOfStudy", "Year of study", { type: "number", min: 1, max: 10 })}
          <div><label htmlFor="add-level" className={label}>Level</label><select id="add-level" name="level" className={input}><option value="">Not set</option><option value="UNDERGRADUATE">Undergraduate</option><option value="POSTGRADUATE">Postgraduate</option></select></div>
          <div><label htmlFor="add-gender" className={label}>Gender</label><select id="add-gender" name="gender" className={input}><option value="">Not set</option><option value="FEMALE">Female</option><option value="MALE">Male</option></select></div>
          <div><label htmlFor="add-enrolment" className={label}>Registry status</label><select id="add-enrolment" name="enrolment" className={input} defaultValue="ACTIVE">{ENROLMENTS.map((e) => <option key={e} value={e}>{e.toLowerCase()}</option>)}</select></div>
          {field("registeredAcademicYear", "Registered academic year", { defaultValue: settings.academicYear.label, pattern: "\\d{4}/\\d{4}" })}
          {field("studyStart", "Study start", { type: "date" })}
          {field("studyEnd", "Study end", { type: "date" })}
          {field("cumulativeGpa", "Cumulative GPA (for candidates)", { type: "number", step: "0.01", min: 0, max: 4 })}
          <div><label htmlFor="add-disc" className={label}>Open disciplinary case?</label><select id="add-disc" name="openDisciplinaryCase" className={input}><option value="">Not recorded</option><option value="no">No</option><option value="yes">Yes</option></select></div>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {done && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{done} Add another or close.</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btn.secondary}>Close</button>
          <button type="submit" disabled={busy} className={btn.primary}>{busy ? "Saving…" : "Save student"}</button>
        </div>
      </form>
    </div>
  );
}
