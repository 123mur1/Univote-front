"use client";

import { createStore } from "./local-store";
import { seedRegistry, type RegistryStudent } from "./registry";

type Imported = { students: RegistryStudent[]; importedAt: string; source: string; mode: "replace" | "merge" };

const store = createStore<Imported | null>("univote.registry.v1", null);

export const SEED_SOURCE = "Registry office list, 2026/2027 opening (built in)";

export function useRegistryImport() {
  return store.use();
}

export function useRegistry(): RegistryStudent[] {
  return store.use()?.students ?? seedRegistry;
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
