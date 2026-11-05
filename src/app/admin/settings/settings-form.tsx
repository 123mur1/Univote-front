"use client";

import { useState } from "react";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { readSession } from "@/lib/session";
import { resetSettings, saveSettings, useSettings, type Role, type SystemSettings } from "@/lib/settings";
import { Card, btn, input, label } from "@/components/ui";

const ROLE_LABELS: Record<Role, string> = { student: "Students", officer: "Election officers", admin: "Administrators" };

export function SettingsForm() {
  const hydrated = useHydrated();
  const settings = useSettings();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  // Keyed so the draft resets when settings change elsewhere (e.g. "Restore defaults").
  return <Editor key={JSON.stringify(settings)} settings={settings} />;
}

function Editor({ settings }: { settings: SystemSettings }) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const changed = JSON.stringify(draft) !== JSON.stringify(settings);
  const set = (patch: Partial<SystemSettings>) => {
    setDraft({ ...draft, ...patch });
    setSaved(false);
  };

  function save(e: React.FormEvent) {
    e.preventDefault();
    saveSettings(draft);
    logActivity({ actor: readSession()?.detail ?? "admin", role: "admin", type: "settings", severity: "warning", detail: "Changed system security settings." });
    setSaved(true);
  }

  return (
    <form onSubmit={save} className="space-y-6">
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
            resetSettings();
            logActivity({ actor: readSession()?.detail ?? "admin", role: "admin", type: "settings", severity: "warning", detail: "Restored default system settings." });
          }}
        >
          Restore defaults
        </button>
        <div className="flex items-center gap-3">
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
