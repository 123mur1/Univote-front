"use client";

import { useState } from "react";
import {
  addManagedStaff,
  deleteRegisteredStudent,
  hashPassword,
  updateManagedStaff,
  updateRegisteredStudent,
  useManagedStaff,
  useRegisteredStudents,
  type ManagedStaff,
  type RegisteredStudent,
  type StaffRole,
} from "@/lib/accounts";
import { logActivity } from "@/lib/activity";
import { standingOf } from "@/lib/analytics";
import { demoAccounts } from "@/lib/data";
import { useHydrated } from "@/lib/local-store";
import { findInRegistry } from "@/lib/registry";
import { useRegistry } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { OFFICER_PERMISSIONS, saveSettings, useSettings, type OfficerPermission } from "@/lib/settings";
import { Badge, Card, btn, input, label } from "@/components/ui";
import { CheckIcon, LockIcon, SearchIcon, XIcon } from "@/components/icons";

const tabs = [
  { id: "staff", label: "Staff accounts" },
  { id: "students", label: "Student accounts" },
  { id: "roles", label: "Roles & permissions" },
] as const;

function audit(detail: string, type: "account" | "settings" = "account") {
  const s = readSession();
  logActivity({ actor: s?.detail ?? "admin", role: "admin", type, severity: "info", detail });
}

export function UserAccess() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("staff");
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-urblue text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-urblue-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "staff" && <StaffAccounts />}
      {tab === "students" && <StudentAccounts />}
      {tab === "roles" && <RolesAndPermissions />}
    </div>
  );
}

function StaffAccounts() {
  const staff = useManagedStaff();
  const settings = useSettings();
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get("password") ?? "");
    if (password.length < settings.passwordMinLength) {
      setMessage({ ok: false, text: `Temporary passwords need at least ${settings.passwordMinLength} characters.` });
      return;
    }
    const role = String(form.get("role")) as StaffRole;
    const account: ManagedStaff = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      role,
      passwordHash: await hashPassword(password),
      active: true,
      createdAt: new Date().toISOString(),
    };
    const error = addManagedStaff(account);
    if (error) return setMessage({ ok: false, text: error });
    audit(`Created ${role} account for ${account.name} (${account.email}).`);
    setMessage({ ok: true, text: `${account.name} can now sign in. Share the temporary password through a secure channel.` });
    formEl.reset();
  }

  function change(s: ManagedStaff, patch: Partial<ManagedStaff>, detail: string) {
    updateManagedStaff(s.email, patch);
    audit(detail);
  }

  async function resetPassword(s: ManagedStaff) {
    if (newPassword.length < settings.passwordMinLength) {
      setMessage({ ok: false, text: `Use at least ${settings.passwordMinLength} characters.` });
      return;
    }
    updateManagedStaff(s.email, { passwordHash: await hashPassword(newPassword), failedLogins: 0 });
    audit(`Reset the password for ${s.email}.`);
    setResetting(null);
    setNewPassword("");
    setMessage({ ok: true, text: `Password reset for ${s.name}.` });
  }

  const builtIn = demoAccounts.filter((a) => a.role !== "student");

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="p-5 xl:col-span-1">
        <h2 className="font-semibold">Create staff account</h2>
        <p className="mt-1 text-sm text-slate-600">Officers and administrators can&apos;t sign themselves up. Each account is created here.</p>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div><label className={label} htmlFor="s-name">Full name</label><input className={input} id="s-name" name="name" required /></div>
          <div><label className={label} htmlFor="s-email">Staff email (sign-in username)</label><input className={input} type="email" id="s-email" name="email" required /></div>
          <div>
            <label className={label} htmlFor="s-role">Role</label>
            <select className={input} id="s-role" name="role" defaultValue="officer">
              <option value="officer">Election officer</option>
              <option value="admin">System administrator</option>
            </select>
          </div>
          <div><label className={label} htmlFor="s-password">Temporary password</label><input className={input} type="password" id="s-password" name="password" minLength={settings.passwordMinLength} autoComplete="new-password" required /></div>
          <button className={`${btn.primary} w-full`}>Create account</button>
        </form>
        {message && <p role="status" className={`mt-3 text-sm ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
      </Card>

      <Card className="overflow-hidden xl:col-span-2">
        <div className="p-5 pb-3">
          <h2 className="font-semibold">Staff accounts</h2>
          <p className="text-sm text-slate-600">Locked accounts have reached {settings.maxFailedLogins} failed sign-ins.</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {builtIn.map((a) => (
            <li key={a.identifier} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{a.name} <Badge tone="gray">built-in demo</Badge></p>
                <p className="text-sm text-slate-600">{a.identifier}</p>
              </div>
              <Badge tone={a.role === "admin" ? "amber" : "blue"}>{a.role === "admin" ? "Administrator" : "Election officer"}</Badge>
            </li>
          ))}
          {staff.map((s) => {
            const locked = (s.failedLogins ?? 0) >= settings.maxFailedLogins;
            return (
              <li key={s.email} className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      {s.name}
                      {!s.active && <Badge tone="red">Suspended</Badge>}
                      {locked && <Badge tone="amber">Locked</Badge>}
                    </p>
                    <p className="text-sm text-slate-600">{s.email}</p>
                    <p className="text-xs text-slate-500">
                      Created {new Date(s.createdAt).toLocaleDateString("en-GB")} · {s.lastLoginAt ? `last sign-in ${new Date(s.lastLoginAt).toLocaleString("en-GB")}` : "never signed in"}
                    </p>
                  </div>
                  <select
                    value={s.role}
                    onChange={(e) => change(s, { role: e.target.value as StaffRole }, `Changed ${s.email} to ${e.target.value}.`)}
                    className={`${input} w-auto py-1.5!`}
                    aria-label={`Role for ${s.name}`}
                  >
                    <option value="officer">Election officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                  {locked && <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(s, { failedLogins: 0 }, `Unlocked ${s.email}.`)}>Unlock</button>}
                  <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => { setResetting(resetting === s.email ? null : s.email); setNewPassword(""); }}>Reset password</button>
                  <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(s, { active: !s.active }, `${s.active ? "Suspended" : "Reactivated"} ${s.email}.`)}>
                    {s.active ? "Suspend" : "Reactivate"}
                  </button>
                </div>
                {resetting === s.email && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={`${input} max-w-xs`} placeholder="New temporary password" aria-label="New temporary password" autoFocus />
                    <button type="button" className={btn.primary} onClick={() => resetPassword(s)}>Save password</button>
                  </div>
                )}
              </li>
            );
          })}
          {staff.length === 0 && <li className="px-5 py-6 text-sm text-slate-500">No staff accounts created yet.</li>}
        </ul>
      </Card>
    </div>
  );
}

function StudentAccounts() {
  const accounts = useRegisteredStudents();
  const registry = useRegistry();
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [card, setCard] = useState<RegisteredStudent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const q = query.trim().toLowerCase();
  const rows = accounts.filter((a) => !q || `${a.firstName} ${a.lastName} ${a.regNumber} ${a.email}`.toLowerCase().includes(q));

  function change(a: RegisteredStudent, patch: Partial<RegisteredStudent>, detail: string) {
    updateRegisteredStudent(a.id, patch);
    audit(detail);
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, registration number or email" className={`${input} pl-10`} aria-label="Search student accounts" />
        </div>
        <p className="text-xs text-slate-500">
          Standing is read live from the registry. A suspended account can&apos;t sign in; an ineligible one can sign in but can&apos;t vote.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">Registry standing</th>
              <th className="px-5 py-3 font-semibold">Account</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((a) => {
              const r = findInRegistry(registry, a.regNumber);
              const standing = r ? standingOf(r, settings.academicYear, today) : "Not on registry";
              const locked = (a.failedLogins ?? 0) >= settings.maxFailedLogins;
              return (
                <tr key={a.id} className="align-top">
                  <td className="px-5 py-3">
                    <p className="font-medium">{a.firstName} {a.lastName}</p>
                    <p className="font-mono text-xs text-slate-500">{a.regNumber}</p>
                    <p className="text-xs text-slate-500">{a.email} · {a.phone}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={standing === "Eligible" ? "green" : "red"}>{standing}</Badge>
                    {r && <p className="mt-1 text-xs text-slate-500">{r.school} · {r.campus}</p>}
                  </td>
                  <td className="space-y-1 px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
                      {locked && <Badge tone="amber">Locked</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">Signed up {new Date(a.createdAt).toLocaleDateString("en-GB")} ({a.createdForAcademicYear})</p>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => setCard(a)}>Student card</button>
                      {locked && <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(a, { failedLogins: 0 }, `Unlocked student account ${a.regNumber}.`)}>Unlock</button>}
                      <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(a, { suspended: !a.suspended }, `${a.suspended ? "Reactivated" : "Suspended"} student account ${a.regNumber}.`)}>
                        {a.suspended ? "Reactivate" : "Suspend"}
                      </button>
                      {confirmDelete === a.id ? (
                        <button type="button" className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700" onClick={() => { deleteRegisteredStudent(a.id); audit(`Deleted student account ${a.regNumber}.`); setConfirmDelete(null); }}>
                          Confirm delete
                        </button>
                      ) : (
                        <button type="button" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => setConfirmDelete(a.id)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">{accounts.length === 0 ? "No students have signed up in this browser yet." : "No accounts match."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {card && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/60 p-4" role="dialog" aria-modal="true" aria-label="Student card" onKeyDown={(e) => e.key === "Escape" && setCard(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <p className="font-semibold">{card.firstName} {card.lastName} · {card.studentCardName}</p>
              <button type="button" onClick={() => setCard(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close" autoFocus><XIcon /></button>
            </div>
            <div className="max-h-[70vh] overflow-auto bg-slate-100 p-4">
              {card.studentCardData.startsWith("data:application/pdf") ? (
                <iframe src={card.studentCardData} title="Student card" className="h-[60vh] w-full rounded bg-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- stored data: URL
                <img src={card.studentCardData} alt={`Student card of ${card.firstName} ${card.lastName}`} className="mx-auto max-h-[60vh] rounded bg-white shadow" />
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

const MATRIX: { capability: string; student: boolean; officer: boolean | OfficerPermission; admin: boolean }[] = [
  { capability: "Vote in elections they're eligible for", student: true, officer: false, admin: false },
  { capability: "Submit a candidate nomination", student: true, officer: false, admin: false },
  { capability: "Create and edit elections", student: false, officer: "manageElections", admin: false },
  { capability: "Review and approve candidates", student: false, officer: "reviewCandidates", admin: false },
  { capability: "View the voter roll", student: false, officer: "viewVoterRoll", admin: true },
  { capability: "Export the voter roll", student: false, officer: "exportVoterRoll", admin: true },
  { capability: "View the election audit log", student: true, officer: "viewAuditLog", admin: true },
  { capability: "View analytics and export any dataset", student: false, officer: false, admin: true },
  { capability: "Create, suspend and unlock accounts", student: false, officer: false, admin: true },
  { capability: "Import the registry list and set the academic year", student: false, officer: false, admin: true },
  { capability: "Change security settings", student: false, officer: false, admin: true },
  { capability: "See how any individual voted", student: false, officer: false, admin: false },
];

function RolesAndPermissions() {
  const settings = useSettings();

  function toggle(p: OfficerPermission) {
    const next = !settings.officerPermissions[p];
    saveSettings({ ...settings, officerPermissions: { ...settings.officerPermissions, [p]: next } });
    audit(`${next ? "Granted" : "Removed"} officer permission: ${OFFICER_PERMISSIONS[p].label}.`, "settings");
  }

  const cell = (v: boolean) =>
    v ? <CheckIcon width={18} height={18} className="mx-auto text-emerald-600" aria-label="Allowed" /> : <XIcon width={18} height={18} className="mx-auto text-slate-300" aria-label="Not allowed" />;

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="p-5 xl:col-span-2">
        <h2 className="font-semibold">Election officer permissions</h2>
        <p className="mt-1 text-sm text-slate-600">Switch these off to remove a section from every officer&apos;s menu. Changes apply immediately.</p>
        <ul className="mt-4 space-y-3">
          {(Object.keys(OFFICER_PERMISSIONS) as OfficerPermission[]).map((p) => (
            <li key={p} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium">{OFFICER_PERMISSIONS[p].label}</p>
                <p className="text-xs text-slate-500">{OFFICER_PERMISSIONS[p].detail}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.officerPermissions[p]}
                aria-label={OFFICER_PERMISSIONS[p].label}
                onClick={() => toggle(p)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${settings.officerPermissions[p] ? "bg-urblue" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${settings.officerPermissions[p] ? "left-5.5" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="overflow-hidden xl:col-span-3">
        <div className="p-5 pb-3">
          <h2 className="font-semibold">Who can do what</h2>
          <p className="text-sm text-slate-600">No role, including administrator, can see how an individual voted.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Capability</th>
                <th className="px-3 py-2.5 font-semibold">Student</th>
                <th className="px-3 py-2.5 font-semibold">Officer</th>
                <th className="px-3 py-2.5 font-semibold">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX.map((m) => (
                <tr key={m.capability}>
                  <td className="px-5 py-2.5">{m.capability}</td>
                  <td className="px-3 py-2.5">{cell(m.student)}</td>
                  <td className="px-3 py-2.5">
                    {typeof m.officer === "string" ? (
                      <span className="flex items-center justify-center gap-1">
                        {cell(settings.officerPermissions[m.officer])}
                        <LockIcon width={12} height={12} className="text-slate-400" aria-label="Set by administrator" />
                      </span>
                    ) : (
                      cell(m.officer)
                    )}
                  </td>
                  <td className="px-3 py-2.5">{cell(m.admin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
