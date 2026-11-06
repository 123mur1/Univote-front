"use client";

import { useMemo, useState } from "react";
import type { Election } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { STANDINGS, countBy, downloadCsv, useStudentRows } from "@/lib/analytics";
import { useHydrated } from "@/lib/local-store";
import { REGISTRY_COLUMNS, findInRegistry, fullName, isEligible, scopeLabel, toCsv, voterChecks } from "@/lib/registry";
import { SEED_SOURCE, resetRegistry, useRegistry, useRegistryImport } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { saveSettings, useSettings } from "@/lib/settings";
import { BarList, ChartCard } from "@/components/charts";
import { EligibilityList } from "@/components/eligibility-panel";
import { Badge, Card, btn, input, label } from "@/components/ui";
import { DownloadIcon, SearchIcon } from "@/components/icons";
import { RegistryImportCard } from "@/components/registry-import-card";

function audit(detail: string, type: "registry" | "settings" = "registry", before?: string, after?: string) {
  const s = readSession();
  logActivity({ actor: s?.detail ?? "admin", role: "admin", type, severity: "info", detail, before, after });
}

export function RegistryAdmin({ elections }: { elections: Election[] }) {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <AcademicYearCard />
        <SourceCard />
      </div>
      <RegistryImportCard />
      <div className="grid gap-6 xl:grid-cols-2">
        <EligibilityChecker elections={elections} />
        <StandingCard />
      </div>
      <LostEligibility />
    </div>
  );
}

function AcademicYearCard() {
  const settings = useSettings();
  const [draft, setDraft] = useState(settings.academicYear);
  const [saved, setSaved] = useState(false);
  const changed = JSON.stringify(draft) !== JSON.stringify(settings.academicYear);

  function save(e: React.FormEvent) {
    e.preventDefault();
    saveSettings({ ...settings, academicYear: draft });
    audit(`Set the current academic year to ${draft.label} (${draft.start} – ${draft.end}).`, "settings", JSON.stringify(settings.academicYear), JSON.stringify(draft));
    setSaved(true);
  }

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Current academic year</h2>
      <p className="mt-1 text-sm text-slate-600">
        Students must be registered for this year to vote or sign up. When the new year starts, change it here: anyone the
        registry hasn&apos;t re-registered loses eligibility automatically, even with an existing account.
      </p>
      <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="ay-label">Label</label>
          <input id="ay-label" className={input} value={draft.label} onChange={(e) => { setDraft({ ...draft, label: e.target.value }); setSaved(false); }} pattern="\d{4}/\d{4}" title="Format: 2026/2027" required />
        </div>
        <div>
          <label className={label} htmlFor="ay-start">Starts</label>
          <input id="ay-start" type="date" className={input} value={draft.start} onChange={(e) => { setDraft({ ...draft, start: e.target.value }); setSaved(false); }} required />
        </div>
        <div>
          <label className={label} htmlFor="ay-end">Ends</label>
          <input id="ay-end" type="date" className={input} value={draft.end} onChange={(e) => { setDraft({ ...draft, end: e.target.value }); setSaved(false); }} required />
        </div>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button className={btn.primary} disabled={!changed}>Save academic year</button>
          {saved && <span className="text-sm text-emerald-700">Saved. Eligibility is now checked against {settings.academicYear.label}.</span>}
        </div>
      </form>
    </Card>
  );
}

function SourceCard() {
  const imported = useRegistryImport();
  const registry = useRegistry();
  return (
    <Card className="p-5">
      <h2 className="font-semibold">Registry source</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Source</dt><dd className="text-right font-medium">{imported?.source ?? SEED_SOURCE}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Students</dt><dd className="font-medium tabular-nums">{registry.length.toLocaleString("en-US")}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-slate-500">Last import</dt><dd className="font-medium">{imported ? `${new Date(imported.importedAt).toLocaleString("en-GB")} (${imported.mode})` : "Never. Using the built-in list"}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btn.secondary} onClick={() => downloadCsv("registry.csv", toCsv(registry, REGISTRY_COLUMNS))}>
          <DownloadIcon width={16} height={16} /> Export registry
        </button>
        <button type="button" className={btn.secondary} onClick={() => downloadCsv("registry-template.csv", toCsv(registry.slice(0, 3), REGISTRY_COLUMNS))}>
          <DownloadIcon width={16} height={16} /> CSV template
        </button>
        {imported && (
          <button type="button" className={btn.secondary} onClick={() => { resetRegistry(); audit("Reset the registry to the built-in list.", "registry", `${registry.length} registry records (${imported.source})`, "Built-in registry records"); }}>
            Restore built-in list
          </button>
        )}
      </div>
    </Card>
  );
}

function EligibilityChecker({ elections }: { elections: Election[] }) {
  const registry = useRegistry();
  const settings = useSettings();
  const [reg, setReg] = useState("");
  const [looked, setLooked] = useState<string | null>(null);
  const record = looked ? findInRegistry(registry, looked) : undefined;
  const active = elections.filter((e) => e.status !== "published");

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Eligibility checker</h2>
      <p className="mt-1 text-sm text-slate-600">Look up any registration number to see exactly why the student can or can&apos;t vote in each election.</p>
      <form onSubmit={(e) => { e.preventDefault(); setLooked(reg.trim()); }} className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="2023/ICT/0142" className={`${input} pl-10 font-mono uppercase`} aria-label="Registration number" />
        </div>
        <button className={btn.primary}>Check</button>
      </form>
      {looked && !record && <p className="mt-4 text-sm text-red-700">{looked.toUpperCase()} is not on the registry list.</p>}
      {record && (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            <strong>{fullName(record)}</strong> · {record.school} · {record.campus} · {record.enrolment} · registered for {record.registeredAcademicYear}
          </p>
          {active.map((e) => {
            const checks = voterChecks(record, { scope: e.eligibility, closesOn: e.closesOn }, settings.academicYear);
            const ok = isEligible(checks);
            return (
              <div key={e.id} className="rounded-lg border border-slate-200 p-3">
                <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium">
                  {e.title} <Badge tone={ok ? "green" : "red"}>{ok ? "Can vote" : "Can't vote"}</Badge>
                </p>
                <p className="mb-2 text-xs text-slate-500">{scopeLabel(e.eligibility)}</p>
                <EligibilityList checks={ok ? checks : checks.filter((c) => !c.pass)} compact />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function StandingCard() {
  const rows = useStudentRows();
  const data = useMemo(() => {
    const c = countBy(rows, (r) => r.standing);
    return STANDINGS.map((s) => ({ label: s, value: c.get(s) ?? 0, detail: `${c.get(s) ?? 0} students` }));
  }, [rows]);
  return (
    <ChartCard title="Registry standing" subtitle="Students by voting standing this academic year" table={{ columns: ["Standing", "Students"], rows: data.map((d) => [d.label, d.value]) }}>
      <BarList data={data} highlight="Eligible" />
    </ChartCard>
  );
}

function LostEligibility() {
  const rows = useStudentRows();
  const lost = rows.filter((r) => r.account !== "No account" && r.standing !== "Eligible");
  return (
    <Card className="overflow-hidden">
      <div className="p-5 pb-3">
        <h2 className="font-semibold">Accounts that can no longer vote</h2>
        <p className="text-sm text-slate-600">
          {lost.length.toLocaleString("en-US")} students have accounts, but the registry no longer lists them as current. They can
          still sign in to see results, but every ballot is refused.
        </p>
      </div>
      <div className="max-h-80 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
            <tr>
              <th className="px-5 py-2.5 font-semibold">Student</th>
              <th className="px-5 py-2.5 font-semibold">School</th>
              <th className="px-5 py-2.5 font-semibold">Reason</th>
              <th className="px-5 py-2.5 font-semibold">Account since</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lost.slice(0, 200).map((r) => (
              <tr key={r.regNumber}>
                <td className="px-5 py-2"><p className="font-medium">{fullName(r)}</p><p className="font-mono text-xs text-slate-500">{r.regNumber}</p></td>
                <td className="px-5 py-2">{r.school}</td>
                <td className="px-5 py-2"><Badge tone="red">{r.standing}</Badge></td>
                <td className="px-5 py-2 text-slate-600">{r.accountCreated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
