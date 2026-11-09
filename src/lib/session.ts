"use client";

import { createStore } from "./local-store";
import type { Role } from "./settings";

export type Session = {
  role: Role;
  name: string;
  detail: string;
  regNumber?: string;
  registeredStudentId?: string;
  email?: string;
  accessToken?: string;
  signedInAt: string;
};

const store = createStore<Session | null>("univote.active-session.v1", null);

export const useSession = store.use;
export const readSession = store.read;

export function startSession(s: Omit<Session, "signedInAt">) {
  store.write({ ...s, signedInAt: new Date().toISOString() });
}

export function endSession() {
  store.clear();
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/student";
}
