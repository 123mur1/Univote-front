"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { apiRequest } from "@/lib/api-client";
import { notifyDataChanged, useApi } from "@/lib/use-api";
import { signInAs } from "@/lib/impersonation";
import { useSession } from "@/lib/session";
import { useSettings } from "@/lib/settings";
import { timeAgo } from "@/components/notification-bell";
import { Avatar, Badge, Card, btn, input, label } from "@/components/ui";
import { AlertIcon, CheckCircleIcon, KeyIcon, LockIcon, LogInIcon, LogOutIcon, PlusIcon, SearchIcon, UserPlusIcon, XIcon } from "@/components/icons";

type Account = {
  id: string; role: "STUDENT" | "ELECTION_OFFICER" | "DISPUTE_RESOLUTION_COMMITTEE" | "SYSTEM_ADMINISTRATOR"; name: string; email: string | null;
  registrationNumber: string | null; active: boolean; failedSignIns: number; lastLoginAt: string | null; createdAt: string; studentProfile: { phone: string | null } | null;
};
type Page = { items: Account[]; total: number; page: number; pageSize: number; maxFailedLogins: number };

const TABS = [
  { key: "", label: "Everyone" },
  { key: "STUDENT", label: "Students" },
  { key: "ELECTION_OFFICER", label: "Election officers" },
  { key: "SYSTEM_ADMINISTRATOR", label: "Administrators" },
] as const;
const ROLE_LABEL: Record<Account["role"], string> = { STUDENT: "Student", ELECTION_OFFICER: "Election officer", DISPUTE_RESOLUTION_COMMITTEE: "Dispute committee", SYSTEM_ADMINISTRATOR: "Administrator" };
const PAGE_SIZE = 20;

const subscribeNone = () => () => {};
const readSearch = () => window.location.search;

function initialRole(param: string | null) {
  if (param === "student") return "STUDENT";
  if (param === "staff" || param === "officer") return "ELECTION_OFFICER";
  if (param === "admin") return "SYSTEM_ADMINISTRATOR";
  return "";
}

function generatePassword(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = crypto.getRandomValues(new Uint8Array(Math.max(length, 12)));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export function UsersAdmin() {
  const search = useSyncExternalStore(subscribeNone, readSearch, () => "");
  const params = new URLSearchParams(search);
  const [overrides, setOverrides] = useState<{ role?: string; status?: string; q?: string; create?: "staff" | "student" | null }>({});
  const role = overrides.role ?? initialRole(params.get("role"));
  const status = overrides.status ?? params.get("status") ?? "";
  const q = overrides.q ?? params.get("q") ?? "";
  const createParam = params.get("create");
  const creating = overrides.create !== undefined ? overrides.create : createParam === "staff" || createParam === "student" ? createParam : null;
  const [page, setPage] = useState(1);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(params.get("impersonation") === "ended" ? { ok: true, text: "The support session ended. You are back in your administrator account." } : null);
  const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), ...(role ? { role } : {}), ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) });
  const { data, error, loading } = useApi<Page>(`/users?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  const set = (patch: typeof overrides) => { setOverrides((current) => ({ ...current, ...patch })); setPage(1); };

  return (
    <>
      {flash && (
        <div role="status" className={`mb-5 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${flash.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
          {flash.ok ? <CheckCircleIcon width={18} height={18} className="mt-0.5 shrink-0" /> : <AlertIcon width={18} height={18} className="mt-0.5 shrink-0" />}
          <span className="flex-1">{flash.text}</span>
          <button type="button" onClick={() => setFlash(null)} aria-label="Dismiss"><XIcon width={16} height={16} /></button>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Account type">
          {TABS.map((t) => <button key={t.key} type="button" role="tab" aria-selected={role === t.key} onClick={() => set({ role: t.key })} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${role === t.key ? "bg-urblue text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-urblue-300"}`}>{t.label}</button>)}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => set({ create: "student" })} className={btn.secondary}><UserPlusIcon width={17} height={17} /> Student account</button>
          <button type="button" onClick={() => set({ create: "staff" })} className={btn.primary}><PlusIcon width={17} height={17} /> Staff account</button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => set({ q: e.target.value })} placeholder="Search name, email or registration number" className={`${input} pl-9`} aria-label="Search accounts" />
          </div>
          <select value={status} onChange={(e) => set({ status: e.target.value })} className={`${input} sm:max-w-48`} aria-label="Account status">
            <option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="locked">Locked out</option>
          </select>
        </div>
        {error && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
        <ul className="divide-y divide-slate-100">
          {loading && !data && [0, 1, 2, 3].map((i) => <li key={i} className="p-4"><div className="h-12 animate-pulse rounded-lg bg-urblue-50" /></li>)}
          {data?.items.map((account) => <AccountRow key={account.id} account={account} maxFailed={data.maxFailedLogins} onResult={setFlash} />)}
          {data && data.items.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-500">No accounts match.</li>}
        </ul>
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          <span>{(data?.total ?? 0).toLocaleString("en-US")} accounts · page {page} of {pages}</span>
          <div className="flex gap-2">
            <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button type="button" className={`${btn.secondary} px-3! py-1.5!`} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-xs text-slate-500">Officer permissions, password rules and sign-in protection are configured in System settings. Every action on this page is recorded in the security log.</p>

      {creating && <CreateDialog kind={creating} onClose={() => set({ create: null })} onCreated={(text) => { setFlash({ ok: true, text }); notifyDataChanged(); }} />}
    </>
  );
}

function AccountRow({ account: a, maxFailed, onResult }: { account: Account; maxFailed: number; onResult: (r: { ok: boolean; text: string }) => void }) {
  const session = useSession();
  const [menu, setMenu] = useState(false);
  const [dialog, setDialog] = useState<"password" | "email" | null>(null);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const locked = a.failedSignIns >= maxFailed;
  const self = session?.userId === a.id || (!session?.userId && session?.email === a.email);
  const identifier = a.registrationNumber ?? a.email ?? a.name;

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  async function act(run: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMenu(false);
    try {
      await run();
      onResult({ ok: true, text: success });
      notifyDataChanged();
    } catch (cause) {
      onResult({ ok: false, text: cause instanceof Error ? cause.message : "The action failed." });
    } finally {
      setBusy(false);
    }
  }

  async function impersonate() {
    setBusy(true);
    try { await signInAs(a.id); } catch (cause) { onResult({ ok: false, text: cause instanceof Error ? cause.message : "Could not open this account." }); setBusy(false); }
  }

  const canImpersonate = a.role !== "SYSTEM_ADMINISTRATOR" && a.active && !self;

  return (
    <li className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={a.name} size="sm" />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">{a.name}{self && <Badge tone="blue">You</Badge>}</p>
          <p className="truncate text-xs text-slate-500"><span className={a.registrationNumber ? "font-mono" : ""}>{identifier}</span>{a.registrationNumber && a.email ? ` · ${a.email}` : ""}{a.studentProfile?.phone ? ` · ${a.studentProfile.phone}` : ""}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:w-56">
        <Badge tone={a.role === "SYSTEM_ADMINISTRATOR" ? "amber" : a.role === "STUDENT" ? "gray" : "blue"}>{ROLE_LABEL[a.role]}</Badge>
        {!a.active ? <Badge tone="red">Suspended</Badge> : locked ? <Badge tone="red">Locked</Badge> : <Badge tone="green">Active</Badge>}
      </div>
      <p className="text-xs text-slate-500 sm:w-32">{a.lastLoginAt ? `Seen ${timeAgo(a.lastLoginAt)}` : "Never signed in"}</p>
      <div className="flex items-center gap-2">
        {canImpersonate && (
          <button type="button" onClick={impersonate} disabled={busy} className={`${btn.secondary} px-3! py-1.5! text-xs!`} title="Open this account to help the user">
            <LogInIcon width={14} height={14} /> Sign in as
          </button>
        )}
        <div className="relative" ref={box}>
          <button type="button" onClick={() => setMenu((v) => !v)} disabled={busy} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" aria-expanded={menu} aria-label={`Manage ${a.name}`}>
            {busy ? "…" : "Manage ▾"}
          </button>
          {menu && (
            <div className="absolute right-0 z-30 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
              {locked && <MenuItem icon={<LockIcon width={15} height={15} />} onClick={() => act(() => apiRequest(`/users/${a.id}/unlock`, { method: "POST" }), `${a.name} can sign in again.`)}>Unlock sign-in</MenuItem>}
              <MenuItem icon={<KeyIcon width={15} height={15} />} onClick={() => { setMenu(false); setDialog("password"); }}>Reset password</MenuItem>
              <MenuItem icon={<KeyIcon width={15} height={15} />} onClick={() => { setMenu(false); setDialog("email"); }}>Change email</MenuItem>
              {!self && <MenuItem icon={<LogOutIcon width={15} height={15} />} onClick={() => act(() => apiRequest(`/users/${a.id}/revoke-sessions`, { method: "POST" }), `Every session of ${a.name} was signed out.`)}>Sign out everywhere</MenuItem>}
              {!self && (a.active
                ? <MenuItem danger icon={<AlertIcon width={15} height={15} />} onClick={() => act(() => apiRequest(`/users/${a.id}/status`, { method: "PATCH", body: JSON.stringify({ active: false }) }), `${a.name}'s account is suspended and signed out.`)}>Suspend account</MenuItem>
                : <MenuItem icon={<CheckCircleIcon width={15} height={15} />} onClick={() => act(() => apiRequest(`/users/${a.id}/status`, { method: "PATCH", body: JSON.stringify({ active: true }) }), `${a.name}'s account is active again.`)}>Reactivate account</MenuItem>)}
            </div>
          )}
        </div>
      </div>
      {dialog && <CredentialDialog account={a} kind={dialog} onClose={() => setDialog(null)} onDone={(text) => { onResult({ ok: true, text }); notifyDataChanged(); }} />}
    </li>
  );
}

function MenuItem({ icon, children, onClick, danger = false }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-slate-50 ${danger ? "text-red-700" : "text-slate-700"}`}>{icon}{children}</button>;
}

function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-urblue-darker/60 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-lg font-bold">{title}</h2>{description && <p className="mt-1 text-sm text-slate-600">{description}</p>}</div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><XIcon /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, min }: { value: string; onChange: (v: string) => void; min: number }) {
  return (
    <div>
      <label htmlFor="new-password" className={label}>Temporary password</label>
      <div className="flex gap-2">
        <input id="new-password" value={value} onChange={(e) => onChange(e.target.value)} minLength={min} required className={`${input} font-mono`} />
        <button type="button" onClick={() => onChange(generatePassword(min + 2))} className={btn.secondary}>Generate</button>
      </div>
      <p className="mt-1 text-xs text-slate-500">At least {min} characters. Share it privately; the user should change it after signing in.</p>
    </div>
  );
}

function CredentialDialog({ account: a, kind, onClose, onDone }: { account: Account; kind: "password" | "email"; onClose: () => void; onDone: (text: string) => void }) {
  const settings = useSettings();
  const [value, setValue] = useState(kind === "email" ? a.email ?? "" : generatePassword(settings.passwordMinLength + 2));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiRequest(`/users/${a.id}/credentials`, { method: "PATCH", body: JSON.stringify(kind === "email" ? { email: value.trim() || null } : { password: value }) });
      onDone(kind === "email" ? `Email for ${a.name} updated.` : `Password for ${a.name} reset to ${value}. Their other sessions were signed out.`);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={kind === "email" ? `Change email for ${a.name}` : `Reset password for ${a.name}`} onClose={onClose}>
      <form onSubmit={save} className="mt-5 space-y-4">
        {kind === "email" ? (
          <div><label htmlFor="email" className={label}>Email address</label><input id="email" type="email" value={value} onChange={(e) => setValue(e.target.value)} className={input} /></div>
        ) : <PasswordField value={value} onChange={setValue} min={settings.passwordMinLength} />}
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btn.secondary}>Cancel</button><button type="submit" disabled={busy} className={btn.primary}>{busy ? "Saving…" : "Save"}</button></div>
      </form>
    </Modal>
  );
}

function CreateDialog({ kind, onClose, onCreated }: { kind: "staff" | "student"; onClose: () => void; onCreated: (text: string) => void }) {
  const settings = useSettings();
  const [password, setPassword] = useState(() => generatePassword(settings.passwordMinLength + 2));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (kind === "staff") {
        const created = await apiRequest<{ name: string; email: string }>("/users/staff", { method: "POST", body: JSON.stringify({ name: String(form.get("name")).trim(), email: String(form.get("email")).trim(), role: String(form.get("role")), password }) });
        onCreated(`Created ${created.name} (${created.email}). Temporary password: ${password}`);
      } else {
        const created = await apiRequest<{ name: string; registrationNumber: string }>("/users/students", { method: "POST", body: JSON.stringify({ registrationNumber: String(form.get("registrationNumber")).trim(), phone: String(form.get("phone")).trim(), password }) });
        onCreated(`Created a student account for ${created.name} (${created.registrationNumber}). Temporary password: ${password}`);
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={kind === "staff" ? "Add a staff account" : "Create a student account"}
      description={kind === "staff" ? "Election officers run elections and review applicants. Administrators have full control." : "The student must be on the eligibility list. Their name, email and academic details come from the registry."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="mt-5 space-y-4">
        {kind === "staff" ? (
          <>
            <div><label htmlFor="name" className={label}>Full name</label><input id="name" name="name" required className={input} /></div>
            <div><label htmlFor="email" className={label}>Staff email</label><input id="email" name="email" type="email" required className={input} placeholder="name@ur.ac.rw" /></div>
            <div><label htmlFor="role" className={label}>Role</label><select id="role" name="role" className={input} defaultValue="ELECTION_OFFICER"><option value="ELECTION_OFFICER">Election officer</option><option value="SYSTEM_ADMINISTRATOR">System administrator</option></select></div>
          </>
        ) : (
          <>
            <div><label htmlFor="registrationNumber" className={label}>Registration number</label><input id="registrationNumber" name="registrationNumber" required className={`${input} font-mono uppercase`} placeholder="2024/BUS/0388" /></div>
            <div><label htmlFor="phone" className={label}>Phone number</label><input id="phone" name="phone" type="tel" required className={input} placeholder="+250 7xx xxx xxx" /></div>
          </>
        )}
        <PasswordField value={password} onChange={setPassword} min={settings.passwordMinLength} />
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={btn.secondary}>Cancel</button><button type="submit" disabled={busy} className={btn.primary}>{busy ? "Creating…" : "Create account"}</button></div>
      </form>
    </Modal>
  );
}
