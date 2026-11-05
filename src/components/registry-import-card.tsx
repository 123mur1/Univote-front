"use client";

import { useState } from "react";
import readXlsxFile from "read-excel-file/browser";
import { logActivity } from "@/lib/activity";
import { parseCsv, registryFromRegistrationNumbers, type RegistryStudent } from "@/lib/registry";
import { importRegistry } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { Badge, Card, btn } from "@/components/ui";
import { AlertIcon, UploadIcon } from "@/components/icons";

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

export function RegistryImportCard() {
  const settings = useSettings();
  const [file, setFile] = useState<string>();
  const [rows, setRows] = useState<string[][]>();
  const [columnIndex, setColumnIndex] = useState(0);
  const [firstDataRow, setFirstDataRow] = useState(0);
  const [parsed, setParsed] = useState<RegistryStudent[]>();
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [result, setResult] = useState<{ ok: boolean; text: string }>();
  const [loading, setLoading] = useState(false);

  async function onFile(selected?: File) {
    setResult(undefined);
    setParsed(undefined);
    setFile(undefined);
    setRows(undefined);
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
      const fileRows = extension === "csv"
        ? parseCsv(await selected.text())
        : ((await readXlsxFile(selected))[0]?.data ?? []).map((row) => row.map(formatCell));
      if (fileRows.length === 0 || fileRows.every((row) => row.length === 0)) {
        setResult({ ok: false, text: "The selected file has no rows to import." });
        return;
      }
      let registrationColumn = -1;
      let headerRow = -1;
      for (let rowIndex = 0; rowIndex < Math.min(fileRows.length, 20) && headerRow < 0; rowIndex++) {
        const foundColumn = fileRows[rowIndex].findIndex((cell) => /registration|reg\.?\s*(no|number)|student\s*(id|no|number)|student\s*registration/i.test(cell));
        if (foundColumn >= 0) {
          registrationColumn = foundColumn;
          headerRow = rowIndex;
        }
      }
      const initialColumn = registrationColumn >= 0 ? registrationColumn : 0;
      const initialDataRow = headerRow >= 0 ? headerRow + 1 : 0;
      setFile(selected.name);
      setRows(fileRows);
      setColumnIndex(initialColumn);
      setFirstDataRow(initialDataRow);
      setParsed(registryFromRegistrationNumbers(fileRows, initialColumn, initialDataRow, settings.academicYear.label));
    } catch (error) {
      setResult({
        ok: false,
        text: error instanceof Error ? `Could not read the spreadsheet: ${error.message}` : "Could not read the spreadsheet.",
      });
    } finally {
      setLoading(false);
    }
  }

  function updateSelection(nextColumn: number, nextFirstDataRow: number) {
    setColumnIndex(nextColumn);
    setFirstDataRow(nextFirstDataRow);
    if (rows) setParsed(registryFromRegistrationNumbers(rows, nextColumn, nextFirstDataRow, settings.academicYear.label));
  }

  function confirmImport() {
    if (!parsed || !file || parsed.length === 0) return;
    const error = importRegistry(parsed, mode, `Registry office file: ${file}`);
    if (error) {
      setResult({ ok: false, text: error });
      return;
    }
    const session = readSession();
    logActivity({
      actor: session?.detail ?? "admin",
      role: session?.role ?? "admin",
      type: "registry",
      severity: "warning",
      detail: `Imported ${parsed.length} registration numbers from ${file} (${mode}).`,
    });
    setResult({
      ok: true,
      text: `Imported ${parsed.length.toLocaleString("en-US")} registration numbers. Students on this testing list are treated as eligible.`,
    });
    setParsed(undefined);
    setFile(undefined);
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <UploadIcon width={18} height={18} className="text-urblue" />
        <h2 className="font-semibold">Import eligible students</h2>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        For testing, upload an Excel workbook (.xlsx) or CSV. No fixed headings or student details are required. Choose the column and starting row containing registration numbers; all other columns are ignored. <strong>Merge</strong> adds to the current list; <strong>Replace</strong> uses only this file.
      </p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Testing mode: every imported registration number is considered eligible for all elections. The import is stored in this browser only.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
          aria-label="Choose student registry Excel or CSV file"
          disabled={loading}
          className="block text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-urblue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-urblue hover:file:bg-urblue-100"
        />
        <div className="flex gap-4 text-sm">
          {(["merge", "replace"] as const).map((nextMode) => (
            <label key={nextMode} className="flex items-center gap-1.5">
              <input type="radio" name="registry-import-mode" checked={mode === nextMode} onChange={() => setMode(nextMode)} className="accent-urblue" />
              {nextMode === "merge" ? "Merge" : "Replace"}
            </label>
          ))}
        </div>
        {loading && <span role="status" className="text-sm text-slate-600">Reading file…</span>}
      </div>
      {parsed && file && rows && (
        <div className="mt-4 rounded-lg border border-slate-200 p-4">
          <h3 className="font-medium">Select registration numbers</h3>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="text-xs font-medium text-slate-700">
              Registration number column
              <select value={columnIndex} onChange={(event) => updateSelection(Number(event.target.value), firstDataRow)} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                {Array.from({ length: Math.max(...rows.map((row) => row.length)) }, (_, index) => (
                  <option key={index} value={index}>
                    {rows[0]?.[index] || `Column ${index + 1}`} — e.g. {rows.slice(firstDataRow).map((row) => row[index]?.trim()).find(Boolean) || "empty"}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-700">
              Start reading from row
              <select value={firstDataRow} onChange={(event) => updateSelection(columnIndex, Number(event.target.value))} className="mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal">
                {Array.from({ length: rows.length }, (_, index) => (
                  <option key={index} value={index}>{index + 1}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-sm">
            <strong>{parsed.length.toLocaleString("en-US")}</strong> registration numbers found in {file}
          </p>
          {parsed.length > 0 && (
            <>
              <p className="mt-3 text-xs text-slate-500">First rows:</p>
              <ul className="mt-1 space-y-0.5 font-mono text-xs text-slate-700">
                {parsed.slice(0, 3).map((student) => (
                  <li key={student.regNumber}>{student.regNumber}</li>
                ))}
              </ul>
              {mode === "replace" && (
                <p className="mt-3 flex gap-1.5 text-xs text-amber-800">
                  <AlertIcon width={14} height={14} /> Replace removes every student not in this file. Their accounts will stop working.
                </p>
              )}
              <button type="button" onClick={confirmImport} className={`${btn.primary} mt-3`}>
                Import {parsed.length.toLocaleString("en-US")} students
              </button>
            </>
          )}
          {parsed.length === 0 && (
            <p role="alert" className="mt-3 flex gap-1.5 text-sm text-red-700">
              <AlertIcon width={16} height={16} /> No values found in that column from row {firstDataRow + 1}. Choose the column and first data row that contain registration numbers.
            </p>
          )}
          </div>
        </div>
      )}
      {result && (
        <p role={result.ok ? "status" : "alert"} className={`mt-3 text-sm ${result.ok ? "text-emerald-700" : "text-red-700"}`}>
          <Badge tone={result.ok ? "green" : "red"}>{result.ok ? "Done" : "Import failed"}</Badge> {result.text}
        </p>
      )}
    </Card>
  );
}
