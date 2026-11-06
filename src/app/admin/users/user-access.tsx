"use client";

import { useState } from "react";
import {
  addManagedStaff,
  deleteRegisteredStudent,
  hashPassword,
  updateManagedStaff,
  updateRegisteredStudent,
  saveRegisteredStudent,
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
import { accountChecks, findInRegistry, isEligible } from "@/lib/registry";
import { useRegistry } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { OFFICER_PERMISSIONS, saveSettings, useSettings, type OfficerPermission } from "@/lib/settings";
import { Badge, Card, btn, input, label } from "@/components/ui";
import { CheckIcon, LockIcon, SearchIcon, XIcon } from "@/components/icons";

const tabs = [
  { id: "staff", label: "Staff accounts" },
  { id: "students", label: "Student accounts" },
] as const;

function audit(detail: string, type: "account" | "settings" = "account", before?: string, after?: string) {
  const s = readSession();
  logActivity({ actor: s?.detail ?? "admin", role: "admin", type, severity: "info", detail, before, after });
}

export function UserAccess() {
  const hydrated = useHydrated();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("staff");
  const [createKind, setCreateKind] = useState<"student" | "staff" | null>(null);
  const [createdMessage, setCreatedMessage] = useState("");
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button type="button" className={btn.primary} onClick={() => setCreateKind("student")}>Create student</button>
        <button type="button" className={btn.secondary} onClick={() => setCreateKind("staff")}>Create election staff</button>
      </div>
      {createdMessage && <p role="status" className="text-sm text-emerald-700">{createdMessage}</p>}
      {createKind && <CreateAccountModal kind={createKind} onClose={() => setCreateKind(null)} onCreated={(text) => { setCreatedMessage(text); setCreateKind(null); }} />}
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
    </div>
  );
}

function StaffAccounts() {
  const staff = useManagedStaff();
  const settings = useSettings();
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();
  const [resetting, setResetting] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  function change(s: ManagedStaff, patch: Partial<ManagedStaff>, detail: string) {
    updateManagedStaff(s.email, patch);
    audit(detail, "account", JSON.stringify({ role: s.role, active: s.active, failedLogins: s.failedLogins ?? 0 }), JSON.stringify({ role: patch.role ?? s.role, active: patch.active ?? s.active, failedLogins: patch.failedLogins ?? s.failedLogins ?? 0 }));
  }

  async function resetPassword(s: ManagedStaff) {
    if (newPassword.length < settings.passwordMinLength) {
      setMessage({ ok: false, text: `Use at least ${settings.passwordMinLength} characters.` });
      return;
    }
    updateManagedStaff(s.email, { passwordHash: await hashPassword(newPassword), failedLogins: 0 });
    audit(`Reset the password for ${s.email}.`, "account", "Previous credential", "New temporary credential set");
    setResetting(null);
    setNewPassword("");
    setMessage({ ok: true, text: `Password reset for ${s.name}.` });
  }

  const builtIn = demoAccounts.filter((a) => a.role !== "student");

  return (
    <div className="space-y-5">
      {message && <p role="status" className={`text-sm ${message.ok ? "text-emerald-700" : "text-red-700"}`}>{message.text}</p>}
      <div className="grid gap-6">
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
    </div>
  );
}

function CreateAccountModal({ kind, onClose, onCreated }: { kind: "student" | "staff"; onClose: () => void; onCreated: (message: string) => void }) {
  const settings = useSettings();
  const registry = useRegistry();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < settings.passwordMinLength) { setBusy(false); setError(`Use at least ${settings.passwordMinLength} characters.`); return; }
    if (kind === "staff") {
      const role = String(form.get("role")) as StaffRole;
      const account: ManagedStaff = { name: String(form.get("name")).trim(), email: String(form.get("email")).trim(), role, passwordHash: await hashPassword(password), active: true, createdAt: new Date().toISOString() };
      const problem = addManagedStaff(account);
      setBusy(false);
      if (problem) { setError(problem); return; }
      audit(`Created ${role} account for ${account.name} (${account.email}).`, "account", "No account", `${role}; ${account.name}; ${account.email}; active`);
      onCreated(`${account.name} can now sign in. Share the temporary password securely.`); return;
    }
    const regNumber = String(form.get("regNumber")).trim().toUpperCase();
    const record = findInRegistry(registry, regNumber);
    if (!record) { setBusy(false); setError("Registration number was not found in the student registry."); return; }
    if (!isEligible(accountChecks(record, settings.academicYear, new Date().toISOString().slice(0, 10)))) { setBusy(false); setError("This student is not eligible for the current academic year."); return; }
    const account: RegisteredStudent = { id: crypto.randomUUID(), regNumber: record.regNumber, firstName: record.firstName, lastName: record.lastName, email: record.email, phone: String(form.get("phone")).trim(), passwordHash: await hashPassword(password), studentCardName: "", studentCardData: "", createdAt: new Date().toISOString(), createdForAcademicYear: settings.academicYear.label };
    const problem = saveRegisteredStudent(account);
    setBusy(false);
    if (problem) { setError(problem); return; }
    audit(`Created student account for ${record.regNumber} (${record.email}).`, "account", "No account", `${record.firstName} ${record.lastName}; ${record.regNumber}; active`);
    onCreated(`${record.firstName} ${record.lastName} can now sign in. Student card verification was not included in this admin-created account.`);
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/60 p-4" role="dialog" aria-modal="true" aria-labelledby="create-account-title" onKeyDown={(e) => e.key === "Escape" && onClose()}>
    <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 id="create-account-title" className="text-lg font-semibold">Create {kind === "student" ? "student" : "election staff"} account</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><XIcon /></button></div>
      <form onSubmit={submit} className="space-y-3">
        {kind === "student" ? <>
          <div><label className={label} htmlFor="new-student-reg">Registration number</label><input className={input} id="new-student-reg" name="regNumber" required /></div>
          <p className="text-xs text-slate-500">Student name and email are read from the registry.</p>
          <div><label className={label} htmlFor="new-student-phone">Phone number</label><input className={input} id="new-student-phone" name="phone" required /></div>
        </> : <>
          <div><label className={label} htmlFor="new-staff-name">Full name</label><input className={input} id="new-staff-name" name="name" required /></div>
          <div><label className={label} htmlFor="new-staff-email">Staff email (sign-in username)</label><input className={input} type="email" id="new-staff-email" name="email" required /></div>
          <div><label className={label} htmlFor="new-staff-role">Role</label><select className={input} id="new-staff-role" name="role" defaultValue="officer"><option value="officer">Election officer</option><option value="admin">System administrator</option></select></div>
        </>}
        <div><label className={label} htmlFor="new-account-password">Temporary password</label><input className={input} id="new-account-password" name="password" type="password" minLength={settings.passwordMinLength} autoComplete="new-password" required /></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={busy}>{busy ? "Creating…" : "Create account"}</button></div>
      </form>
    </div>
  </div>;
}

function StudentAccounts() {
  const accounts = useRegisteredStudents();
  const registry = useRegistry();
  const settings = useSettings();
  const [query, setQuery] = useState("");
  const [card, setCard] = useState<RegisteredStudent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [credentialNotice, setCredentialNotice] = useState("");
  const [editingCredentials, setEditingCredentials] = useState<RegisteredStudent | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const q = query.trim().toLowerCase();
  const rows = accounts.filter((a) => !q || `${a.firstName} ${a.lastName} ${a.regNumber} ${a.email}`.toLowerCase().includes(q));

  function change(a: RegisteredStudent, patch: Partial<RegisteredStudent>, detail: string) {
    updateRegisteredStudent(a.id, patch);
    audit(detail, "account", JSON.stringify({ suspended: !!a.suspended, failedLogins: a.failedLogins ?? 0 }), JSON.stringify({ suspended: patch.suspended ?? !!a.suspended, failedLogins: patch.failedLogins ?? a.failedLogins ?? 0 }));
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
                      {a.studentCardData && <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => setCard(a)}>Student card</button>}
                      <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => { setCredentialNotice(""); setEditingCredentials(a); }}>Edit credentials</button>
                      {locked && <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(a, { failedLogins: 0 }, `Unlocked student account ${a.regNumber}.`)}>Unlock</button>}
                      <button type="button" className={`${btn.secondary} px-3! py-1.5!`} onClick={() => change(a, { suspended: !a.suspended }, `${a.suspended ? "Reactivated" : "Suspended"} student account ${a.regNumber}.`)}>
                        {a.suspended ? "Reactivate" : "Suspend"}
                      </button>
                      {confirmDelete === a.id ? (
                        <button type="button" className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700" onClick={() => { deleteRegisteredStudent(a.id); audit(`Deleted student account ${a.regNumber}.`, "account", `${a.firstName} ${a.lastName}; ${a.regNumber}; active`, "Account deleted"); setConfirmDelete(null); }}>
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

      {editingCredentials && <StudentCredentialsModal
        student={editingCredentials}
        accounts={accounts}
        onClose={() => setEditingCredentials(null)}
        onSaved={(message) => { setEditingCredentials(null); setCredentialNotice(message); }}
      />}
      {credentialNotice && <p role="status" className="m-4 text-sm text-emerald-700">{credentialNotice}</p>}
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

function StudentCredentialsModal({ student, accounts, onClose, onSaved }: { student: RegisteredStudent; accounts: RegisteredStudent[]; onClose: () => void; onSaved: (message: string) => void }) {
  const settings = useSettings();
  const [email, setEmail] = useState(student.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const nextEmail = email.trim();
    if (password && password.length < settings.passwordMinLength) {
      setError(`Use at least ${settings.passwordMinLength} characters for a new password.`);
      return;
    }
    if (nextEmail && accounts.some((account) => account.id !== student.id && account.email.toLowerCase() === nextEmail.toLowerCase())) {
      setError("That email is already used by another student account.");
      return;
    }
    setSaving(true);
    const patch: Partial<RegisteredStudent> = { email: nextEmail };
    if (password) patch.passwordHash = await hashPassword(password);
    updateRegisteredStudent(student.id, patch);
    audit(`Updated sign-in credentials for student ${student.regNumber}.`, "account", `Email: ${student.email || "not set"}; password: unchanged`, `Email: ${nextEmail || "not set"}; password: ${password ? "reset" : "unchanged"}`);
    setSaving(false);
    onSaved(`Credentials updated for ${student.firstName} ${student.lastName}.`);
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/60 p-4" role="dialog" aria-modal="true" aria-labelledby="student-credentials-title" onKeyDown={(event) => event.key === "Escape" && onClose()}>
    <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><div><h2 id="student-credentials-title" className="text-lg font-semibold">Edit student credentials</h2><p className="text-sm text-slate-600">{student.firstName} {student.lastName} · {student.regNumber}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><XIcon /></button></div>
      <form onSubmit={save} className="space-y-4">
        <div><label className={label} htmlFor="student-login-email">Email / sign-in address</label><input id="student-login-email" type="email" className={input} value={email} onChange={(event) => setEmail(event.target.value)} /><p className="mt-1 text-xs text-slate-500">Students can also sign in with their registration number.</p></div>
        <div><label className={label} htmlFor="student-new-password">New temporary password (optional)</label><input id="student-new-password" type="password" autoComplete="new-password" className={input} value={password} onChange={(event) => setPassword(event.target.value)} minLength={settings.passwordMinLength} placeholder="Leave blank to keep the current password" /><p className="mt-1 text-xs text-slate-500">At least {settings.passwordMinLength} characters. Share it through a secure channel.</p></div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={btn.secondary} onClick={onClose}>Cancel</button><button className={btn.primary} disabled={saving}>{saving ? "Saving…" : "Save credentials"}</button></div>
      </form>
    </div>
  </div>;
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
  { capability: "Create accounts, edit credentials, suspend and unlock accounts", student: false, officer: false, admin: true },
  { capability: "Import the registry list and set the academic year", student: false, officer: false, admin: true },
  { capability: "Change security settings", student: false, officer: false, admin: true },
  { capability: "See how any individual voted", student: false, officer: false, admin: false },
];

export function RolesAndPermissions() {
  const settings = useSettings();

  function toggle(p: OfficerPermission) {
    const next = !settings.officerPermissions[p];
    saveSettings({ ...settings, officerPermissions: { ...settings.officerPermissions, [p]: next } });
    audit(`${next ? "Granted" : "Removed"} officer permission: ${OFFICER_PERMISSIONS[p].label}.`, "settings", String(!next), String(next));
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
