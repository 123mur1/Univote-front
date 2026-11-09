"use client";

import { useEffect, useState } from "react";
import { createStore } from "./local-store";
import { seedRegistry, type RegistryStudent } from "./registry";
import { apiRequest, reportApiError } from "./api-client";
import { useSession } from "./session";

type Imported = { students: RegistryStudent[]; importedAt: string; source: string; mode: "replace" | "merge" };

const store = createStore<Imported | null>("univote.registry.v1", null);

export const SEED_SOURCE = "Registry office list, 2026/2027 opening (built in)";

export function useRegistryImport() {
  return store.use();
}

export function useRegistry(): RegistryStudent[] {
  const imported = store.use()?.students ?? seedRegistry;
  const session = useSession();
  const [serverRecord, setServerRecord] = useState<{ token: string; role: string; records: RegistryStudent[] } | null>(null);
  useEffect(() => {
    if (!session?.accessToken) return;
    const token = session.accessToken;
    const role = session.role;
    let active = true;
    const load = async () => {
      try {
        if (role === "student") {
          const row = await apiRequest<Record<string, unknown>>("/users/me/registry");
          if (active) setServerRecord({ token, role, records: [mapRegistryRecord(row)] });
          return;
        }
        const first = await apiRequest<{ items: Record<string, unknown>[]; total: number; pageSize: number }>("/registry?page=1&pageSize=200");
        const rows = [...first.items];
        for (let page = 2; rows.length < first.total; page++) {
          const next = await apiRequest<{ items: Record<string, unknown>[] }>(`/registry?page=${page}&pageSize=200`);
          if (!next.items.length) break;
          rows.push(...next.items);
        }
        if (active) setServerRecord({ token, role, records: rows.map(mapRegistryRecord) });
      } catch (cause) {
        if (active) {
          setServerRecord({ token, role, records: [] });
          reportApiError(cause);
        }
      }
    };
    const refresh = () => { void load(); };
    refresh();
    window.addEventListener("univote:registry-updated", refresh);
    return () => { active = false; window.removeEventListener("univote:registry-updated", refresh); };
  }, [session?.accessToken, session?.role]);
  if (session?.accessToken) {
    return serverRecord?.token === session.accessToken && serverRecord.role === session.role ? serverRecord.records : [];
  }
  return imported;
}

function mapRegistryRecord(row: Record<string, unknown>): RegistryStudent {
  return {
    regNumber: String(row.registrationNumber), firstName: String(row.firstName), lastName: String(row.lastName),
    gender: row.gender === "FEMALE" ? "F" : row.gender === "MALE" ? "M" : "",
    dateOfBirth: row.dateOfBirth ? String(row.dateOfBirth).slice(0, 10) : "", email: String(row.email ?? ""),
    collegeCode: String(row.collegeCode ?? ""), college: String(row.college), school: String(row.school), department: String(row.department),
    programme: String(row.programme ?? ""), campus: String(row.campus),
    level: row.level === "UNDERGRADUATE" ? "Undergraduate" : row.level === "POSTGRADUATE" ? "Postgraduate" : "",
    yearOfStudy: Number(row.yearOfStudy ?? 0), enrolment: String(row.enrolment).toLowerCase().replace(/^./, (c) => c.toUpperCase()) as RegistryStudent["enrolment"],
    ...(row.cumulativeGpa != null ? { cumulativeGpa: Number(row.cumulativeGpa) } : {}),
    ...(typeof row.openDisciplinaryCase === "boolean" ? { openDisciplinaryCase: row.openDisciplinaryCase } : {}),
    registeredAcademicYear: String(row.registeredAcademicYear ?? ""),
    studyStart: row.studyStart ? String(row.studyStart).slice(0, 10) : "", studyEnd: row.studyEnd ? String(row.studyEnd).slice(0, 10) : "",
  };
}

export function readRegistry(): RegistryStudent[] {
  return store.read()?.students ?? seedRegistry;
}

export function importRegistry(students: RegistryStudent[], mode: "replace" | "merge", source: string): string | null {
  const base = mode === "merge" ? readRegistry() : [];
  const byReg = new Map(base.map((s) => [s.regNumber.toUpperCase(), s]));
  students.forEach((s) => byReg.set(s.regNumber.toUpperCase(), s));
  try {
    store.write({ students: [...byReg.values()], importedAt: new Date().toISOString(), source, mode });
    return null;
  } catch {
    return "The registry file is too large to keep in this demo browser.";
  }
}

export function resetRegistry() {
  store.clear();
}
