"use client";

import { useEffect, useState } from "react";
import { addManagedOfficer, hashPassword, managedOfficers, registeredStudents, updateManagedOfficer, type ManagedOfficer, type RegisteredStudent } from "@/lib/accounts";
import { Card, btn, input, label, StatCard } from "@/components/ui";

export function UserManagement() {
  const [students, setStudents] = useState<RegisteredStudent[]>([]);
  const [officers, setOfficers] = useState<ManagedOfficer[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  function refresh() { setStudents(registeredStudents()); setOfficers(managedOfficers()); }
  useEffect(() => {
    refresh();
    try { setIsAdmin(JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null")?.role === "admin"); } catch {}
  }, []);

  async function createOfficer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const passwordHash = await hashPassword(password);
    const error = addManagedOfficer({ name, email, passwordHash, active: true });
    if (error) { setMessage(error); return; }
    setMessage("Election officer account created. Share the temporary password securely.");
    event.currentTarget.reset();
    refresh();
  }

  if (!isAdmin) return <Card className="p-5"><p className="font-semibold">Administrator access required</p><p className="mt-1 text-sm text-slate-600">Officer account management is reserved for administrators.</p></Card>;

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2"><StatCard label="Student accounts" value={String(students.length)} hint="Available after registration" /><StatCard label="Election officers" value={String(officers.filter((officer) => officer.active).length)} hint="Created by an administrator" /></div>
    <Card className="p-5 sm:p-6"><h2 className="font-semibold">Student accounts</h2><p className="mt-1 text-sm text-slate-600">Student accounts are available after registration. Sign-in checks the email or registration number and password.</p><div className="mt-4 divide-y divide-slate-100">
      {students.length === 0 && <p className="py-5 text-sm text-slate-500">No student registrations yet.</p>}
      {students.map((student) => <div key={student.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{student.firstName} {student.lastName}</p><p className="text-sm text-slate-600">{student.registrationNumber} · {student.email}</p><p className="text-xs text-slate-500">{student.department}, {student.school}, {student.programme} · {student.college} · {student.campus} · {student.year}</p><p className="text-xs text-slate-500">Expected completion: {student.studyEndDate}</p></div></div>)}
    </div></Card>
    <Card className="p-5 sm:p-6"><h2 className="font-semibold">Add election officer</h2><p className="mt-1 text-sm text-slate-600">Officers cannot create their own accounts. The administrator provisions each account here.</p><form onSubmit={createOfficer} className="mt-4 grid gap-4 sm:grid-cols-3"><div><label className={label} htmlFor="officer-name">Full name</label><input className={input} id="officer-name" name="name" required /></div><div><label className={label} htmlFor="officer-email">Staff email</label><input className={input} type="email" id="officer-email" name="email" required /></div><div><label className={label} htmlFor="officer-password">Temporary password</label><input className={input} type="password" id="officer-password" name="password" minLength={10} required /></div><div className="sm:col-span-3"><button className={btn.primary}>Create officer account</button></div></form>{message && <p role="status" className="mt-3 text-sm text-urblue">{message}</p>}<div className="mt-5 divide-y divide-slate-100">{officers.map((officer) => <div key={officer.email} className="flex items-center justify-between py-3"><div><p className="font-medium">{officer.name}</p><p className="text-sm text-slate-600">{officer.email}</p></div><button className={btn.secondary} onClick={() => { updateManagedOfficer(officer.email, { active: !officer.active }); refresh(); }}>{officer.active ? "Suspend" : "Reactivate"}</button></div>)}</div></Card>
    <p className="text-xs text-amber-800">Prototype limitation: accounts and uploaded cards are stored in this browser. For real operation, move these records to a secured database and enforce authentication and voting eligibility on the backend.</p>
  </div>;
}
