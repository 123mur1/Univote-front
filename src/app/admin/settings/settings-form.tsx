"use client";

import { useEffect, useState } from "react";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { readSession } from "@/lib/session";
import { resetSettings, saveSettings, useSettings, type Role, type SystemSettings } from "@/lib/settings";
import { Card, btn, input, label } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const permissionKeys = {
  MANAGE_ELECTIONS: "manageElections", REVIEW_CANDIDATES: "reviewCandidates", VIEW_VOTER_ROLL: "viewVoterRoll",
  IMPORT_REGISTRY: "importRegistry", EXPORT_VOTER_ROLL: "exportVoterRoll", VIEW_AUDIT_LOG: "viewAuditLog",
} as const;

const ROLE_LABELS: Record<Role, string> = { student: "Students", officer: "Election officers", admin: "Administrators" };

export function SettingsForm() {
  const hydrated = useHydrated();
  const settings = useSettings();
  useEffect(() => {
    if (!readSession()?.accessToken) return;
    Promise.all([
      apiRequest<Record<string, unknown>>("/settings"),
      apiRequest<{ permission: keyof typeof permissionKeys; enabled: boolean }[]>("/settings/officer-permissions"),
    ]).then(([remote, permissions]) => {
      const officerPermissions = { ...DEFAULT_SETTINGS.officerPermissions };
      permissions.forEach((row) => { officerPermissions[permissionKeys[row.permission]] = row.enabled; });
      saveSettings({
        ...DEFAULT_SETTINGS,
        academicYear: { label: String(remote.academicYearLabel), start: String(remote.academicYearStart).slice(0, 10), end: String(remote.academicYearEnd).slice(0, 10) },
        idleMinutes: { student: Number(remote.studentIdleMinutes), officer: Number(remote.officerIdleMinutes), admin: Number(remote.adminIdleMinutes) },
        warningSeconds: Number(remote.warningSeconds), otpRequired: { student: Boolean(remote.studentOtpRequired), officer: Boolean(remote.officerOtpRequired) },
        passwordMinLength: Number(remote.passwordMinLength), maxFailedLogins: Number(remote.maxFailedLogins),
        allowStudentSignup: Boolean(remote.allowStudentSignup), officerPermissions,
      });
    }).catch(() => { /* Existing prototype settings remain available if the API is offline. */ });
  }, []);
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  // Keyed so the draft resets when settings change elsewhere (e.g. "Restore defaults").
  return <Editor key={JSON.stringify(settings)} settings={settings} />;
}

function Editor({ settings }: { settings: SystemSettings }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const changed = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = (patch: Partial<SystemSettings>) => {
    setDraft({ ...draft, ...patch });
    setSaved(false);
  };

  async function persist(next: SystemSettings) {
    if (readSession()?.accessToken) {
      await apiRequest("/settings", { method: "PATCH", body: JSON.stringify({
        academicYearLabel: next.academicYear.label, academicYearStart: next.academicYear.start, academicYearEnd: next.academicYear.end,
        studentIdleMinutes: next.idleMinutes.student, officerIdleMinutes: next.idleMinutes.officer, adminIdleMinutes: next.idleMinutes.admin,
        warningSeconds: next.warningSeconds, studentOtpRequired: next.otpRequired.student, officerOtpRequired: next.otpRequired.officer,
        passwordMinLength: next.passwordMinLength, maxFailedLogins: next.maxFailedLogins, allowStudentSignup: next.allowStudentSignup,
      }) });
      const permissions = Object.entries(permissionKeys) as [keyof typeof permissionKeys, keyof typeof next.officerPermissions][];
      for (const [permission, key] of permissions) await apiRequest("/settings/officer-permissions", { method: "PUT", body: JSON.stringify({ permission, enabled: next.officerPermissions[key] }) });
    }
    saveSettings(next);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try { await persist(draft); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save system settings."); return; }
    logActivity({ actor: readSession()?.detail ?? "admin", role: "admin", type: "settings", severity: "warning", detail: "Changed system security settings.", before: JSON.stringify(settings), after: JSON.stringify(draft) });
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="p-5">
        <h2 className="font-semibold">Academic year</h2>
        <p className="mt-1 text-sm text-slate-600">Only students the registry lists for this academic year can sign up, vote or stand as candidates.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="ay-label">Label</label>
            <input id="ay-label" className={input} pattern="\d{4}/\d{4}" placeholder="2026/2027" value={draft.academicYear.label} onChange={(e) => set({ academicYear: { ...draft.academicYear, label: e.target.value } })} required />
          </div>
          <div>
            <label className={label} htmlFor="ay-start">Starts</label>
            <input id="ay-start" type="date" className={input} value={draft.academicYear.start} onChange={(e) => set({ academicYear: { ...draft.academicYear, start: e.target.value } })} required />
          </div>
          <div>
            <label className={label} htmlFor="ay-end">Ends</label>
            <input id="ay-end" type="date" className={input} value={draft.academicYear.end} onChange={(e) => set({ academicYear: { ...draft.academicYear, end: e.target.value } })} required />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Sessions & sign-out warnings</h2>
          <p className="mt-1 text-sm text-slate-600">Idle users see a countdown warning, then are signed out automatically.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <div key={r}>
                <label className={label} htmlFor={`idle-${r}`}>{ROLE_LABELS[r]} (minutes)</label>
                <input id={`idle-${r}`} type="number" min={1} max={120} className={input} value={draft.idleMinutes[r]} onChange={(e) => set({ idleMinutes: { ...draft.idleMinutes, [r]: Math.max(1, Number(e.target.value)) } })} />
              </div>
            ))}
          </div>
          <div className="mt-3 max-w-xs">
            <label className={label} htmlFor="warning">Warning countdown (seconds)</label>
            <input id="warning" type="number" min={10} max={300} className={input} value={draft.warningSeconds} onChange={(e) => set({ warningSeconds: Math.max(10, Number(e.target.value)) })} />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Sign-in security</h2>
          <div className="mt-4 space-y-3">
            <Toggle
              label="One-time code for students"
              detail="Students confirm a code after their password."
              checked={draft.otpRequired.student}
              onChange={(v) => set({ otpRequired: { ...draft.otpRequired, student: v } })}
            />
            <Toggle
              label="One-time code for election officers"
              detail="Officers confirm a code after their password."
              checked={draft.otpRequired.officer}
              onChange={(v) => set({ otpRequired: { ...draft.otpRequired, officer: v } })}
            />
            <p className="rounded-lg bg-urblue-50 p-3 text-xs text-slate-600">Administrators sign in with username and password only.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="minlen">Minimum password length</label>
              <input id="minlen" type="number" min={8} max={64} className={input} value={draft.passwordMinLength} onChange={(e) => set({ passwordMinLength: Math.max(8, Number(e.target.value)) })} />
            </div>
            <div>
              <label className={label} htmlFor="lockout">Lock account after failed sign-ins</label>
              <input id="lockout" type="number" min={3} max={20} className={input} value={draft.maxFailedLogins} onChange={(e) => set({ maxFailedLogins: Math.max(3, Number(e.target.value)) })} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold">Student sign-up</h2>
        <div className="mt-3">
          <Toggle
            label="Allow students to create accounts"
            detail="Sign-up always checks the registry office's list. Switch this off to close sign-up entirely, e.g. while the registry is being updated."
            checked={draft.allowStudentSignup}
            onChange={(v) => set({ allowStudentSignup: v })}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="text-sm font-medium text-slate-600 hover:text-urblue hover:underline"
          onClick={() => {
            void persist(DEFAULT_SETTINGS).then(() => {
              resetSettings();
              logActivity({ actor: readSession()?.detail ?? "admin", role: "admin", type: "settings", severity: "warning", detail: "Restored default system settings.", before: JSON.stringify(settings), after: "System defaults" });
            }).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not restore defaults."));
          }}
        >
          Restore defaults
        </button>
        <div className="flex items-center gap-3">
          {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
          {saved && <span className="text-sm text-emerald-700">Settings saved.</span>}
          <button className={btn.primary} disabled={!changed}>Save settings</button>
        </div>
      </div>
    </form>
  );
}

function Toggle({ label: text, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
      <div>
        <p className="text-sm font-medium">{text}</p>
        <p className="text-xs text-slate-500">{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={text}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-urblue" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
