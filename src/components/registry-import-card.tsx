"use client";

import { useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { logActivity } from "@/lib/activity";
import { fullName, parseCsv, registryFromSystemRows, type RegistryStudent } from "@/lib/registry";
import { importRegistry, readRegistry } from "@/lib/registry-store";
import { makeRegistryTemplate } from "@/lib/registry-template";
import { readSession } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { Badge, Card, btn } from "@/components/ui";
import { AlertIcon, DownloadIcon, UploadIcon } from "@/components/icons";
import { apiRequest } from "@/lib/api-client";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatCell(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value == null ? "" : String(value).trim();
}

function downloadTemplate() {
  const workbook = makeRegistryTemplate();
  const url = URL.createObjectURL(new Blob([workbook.buffer as ArrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "univote-registry-template.xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function RegistryImportCard() {
  const settings = useSettings();
  const [file, setFile] = useState<string>();
  const [parsed, setParsed] = useState<RegistryStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const [loading, setLoading] = useState(false);

  async function onFile(selected?: File) {
    setResult(undefined);
    setParsed([]);
    setErrors([]);
    setFile(undefined);
    if (!selected) return;
    if (selected.size > MAX_FILE_BYTES) {
      setResult({ ok: false, text: "The file must be 10 MB or smaller." });
      return;
    }
    const extension = selected.name.split(".").pop()?.toLowerCase();
    if (extension !== "csv" && extension !== "xlsx") {
      setResult({ ok: false, text: "Choose an Excel .xlsx workbook or .csv file." });
      return;
    }
    setLoading(true);
    try {
      const rows = extension === "csv"
        ? parseCsv(await selected.text())
        : ((await readXlsxFile(selected))[0]?.data ?? []).map((row) => row.map(formatCell));
      const result = registryFromSystemRows(rows, settings.academicYear);
      if (result.students.length === 0 && result.errors.length === 0) {
        setResult({ ok: true, text: "No student rows found. Add records to the template, then upload it again." });
        return;
      }
      setFile(selected.name);
      setParsed(result.students);
      setErrors(result.errors);
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? `Could not read the spreadsheet: ${error.message}` : "Could not read the spreadsheet." });
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!file || parsed.length === 0) return;
    const session = readSession();
    if (session?.accessToken) {
      setLoading(true);
      try {
        const outcome = await apiRequest<{ imported: number; total: number; retained: number }>("/registry/import", {
          method: "POST",
          body: JSON.stringify({
            mode, sourceFilename: file,
            students: parsed.map((student) => ({
              registrationNumber: student.regNumber, firstName: student.firstName, lastName: student.lastName,
              gender: student.gender || undefined, dateOfBirth: student.dateOfBirth || undefined, email: student.email || undefined,
              collegeCode: student.collegeCode || undefined, college: student.college, school: student.school,
              department: student.department, campus: student.campus, programme: student.programme || undefined,
              level: student.level || undefined, yearOfStudy: student.yearOfStudy || undefined,
              enrolment: student.enrolment.toUpperCase(), registeredAcademicYear: student.registeredAcademicYear || undefined,
              studyStart: student.studyStart || undefined, studyEnd: student.studyEnd || undefined,
              cumulativeGpa: student.cumulativeGpa, openDisciplinaryCase: student.openDisciplinaryCase,
            })),
          }),
        });
        window.dispatchEvent(new Event("univote:registry-updated"));
        logActivity({ actor: session.detail, role: session.role, type: "registry", severity: "warning", detail: `Imported ${outcome.imported} registry students from ${file} (${mode}).`, before: "Backend registry", after: `${outcome.total} records; ${outcome.retained} retained` });
        setResult({ ok: true, text: `Imported ${outcome.imported.toLocaleString("en-US")} students. The backend now contains ${outcome.total.toLocaleString("en-US")} registry records.` });
        setParsed([]); setFile(undefined);
      } catch (cause) {
        setResult({ ok: false, text: cause instanceof Error ? cause.message : "Could not import the registry to the server." });
      } finally { setLoading(false); }
      return;
    }
    const beforeCount = readRegistry().length;
    const issue = importRegistry(parsed, mode, `Registry file: ${file}`);
    if (issue) {
      setResult({ ok: false, text: issue });
      return;
    }
    const afterCount = readRegistry().length;
    logActivity({
      actor: session?.detail ?? "admin",
      role: session?.role ?? "admin",
      type: "registry",
      severity: "warning",
      detail: `Imported ${parsed.length} registry students from ${file} (${mode}).${errors.length ? ` ${errors.length} rows were skipped.` : ""}`,
      before: `${beforeCount} registry records`,
      after: `${afterCount} registry records; ${parsed.length} imported`,
    });
    setResult({ ok: true, text: `Imported ${parsed.length.toLocaleString("en-US")} students.${errors.length ? ` ${errors.length} invalid rows were skipped.` : ""}` });
    setParsed([]);
    setFile(undefined);
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><UploadIcon width={18} height={18} className="text-urblue" /><h2 className="font-semibold">Import student registry</h2></div>
        <button type="button" className={btn.secondary} onClick={downloadTemplate}><DownloadIcon width={16} height={16} /> Download Excel template</button>
      </div>
      <p className="mt-2 text-sm text-slate-600">Use the UniVote template to prepare the registry list. Registration number, names, campus, college, school/faculty and department are mapped into the system. Workbooks with matching registry headers can also be imported directly.</p>
      <p className="mt-2 rounded-lg bg-urblue-50 px-3 py-2 text-xs text-slate-600">In the template, choose a campus and college first. The school dropdown then shows schools in that college, and the department dropdown shows departments in the selected school. Signed-in staff import directly to the backend; offline demo imports remain in this browser.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { void onFile(event.target.files?.[0]); event.target.value = ""; }} aria-label="Choose student registry Excel or CSV file" disabled={loading} className="block text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-urblue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-urblue hover:file:bg-urblue-100" />
        <div className="flex gap-4 text-sm">{(["merge", "replace"] as const).map((nextMode) => <label key={nextMode} className="flex items-center gap-1.5"><input type="radio" name="registry-import-mode" checked={mode === nextMode} onChange={() => setMode(nextMode)} className="accent-urblue" />{nextMode === "merge" ? "Merge" : "Replace"}</label>)}</div>
        {loading && <span role="status" className="text-sm text-slate-600">Reading file…</span>}
      </div>
      {file && (parsed.length > 0 || errors.length > 0) && <div className="mt-4 rounded-lg border border-slate-200 p-4">
        <h3 className="font-medium">Import preview · {file}</h3>
        {parsed.length > 0 && <>
          <p className="mt-1 text-sm"><strong>{parsed.length.toLocaleString("en-US")}</strong> valid students ready to import</p>
          <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead><tr className="text-slate-500"><th className="pb-2">Registration number</th><th className="pb-2">Name</th><th className="pb-2">Campus</th><th className="pb-2">College</th><th className="pb-2">School / department</th></tr></thead><tbody className="divide-y divide-slate-100">{parsed.slice(0, 5).map((student) => <tr key={student.regNumber}><td className="py-2 font-mono">{student.regNumber}</td><td className="py-2">{fullName(student)}</td><td className="py-2">{student.campus}</td><td className="py-2">{student.college}</td><td className="py-2">{student.school} / {student.department}</td></tr>)}</tbody></table></div>
        </>}
        {errors.length > 0 && <div role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><p className="font-semibold">{errors.length} row or format issue{errors.length === 1 ? "" : "s"}</p><ul className="mt-1 list-inside list-disc">{errors.slice(0, 8).map((error) => <li key={error}>{error}</li>)}</ul>{errors.length > 8 && <p className="mt-1">And {errors.length - 8} more.</p>}</div>}
        {mode === "replace" && parsed.length > 0 && <p className="mt-3 flex gap-1.5 text-xs text-amber-800"><AlertIcon width={14} height={14} /> Replace removes every student not in this file. Their accounts may no longer be eligible.</p>}
        {parsed.length > 0 && <button type="button" onClick={confirmImport} className={`${btn.primary} mt-3`}>Import {parsed.length.toLocaleString("en-US")} students</button>}
      </div>}
      {result && <p role={result.ok ? "status" : "alert"} className={`mt-3 text-sm ${result.ok ? "text-emerald-700" : "text-red-700"}`}><Badge tone={result.ok ? "green" : "red"}>{result.ok ? "Done" : "Import failed"}</Badge> {result.text}</p>}
    </Card>
  );
}
