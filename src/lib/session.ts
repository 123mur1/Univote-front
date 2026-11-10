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
  userId?: string;
  accessToken?: string;
  // Renews the access token without asking for the password again.
  refreshToken?: string;
  // Epoch milliseconds when the access token stops working.
  accessExpiresAt?: number;
  // Set while an administrator is signed in as this user; holds the administrator's own session.
  impersonator?: { name: string; email?: string; session: Omit<Session, "impersonator"> };
  signedInAt: string;
};

const store = createStore<Session | null>("univote.active-session.v1", null);

export const useSession = store.use;
export const readSession = store.read;

export function startSession(s: Omit<Session, "signedInAt">) {
  store.write({ ...s, signedInAt: new Date().toISOString() });
}

export function updateSession(patch: Partial<Session>) {
  const current = store.read();
  if (current) store.write({ ...current, ...patch });
}

export function endSession() {
  store.clear();
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/student";
}

export type ApiUser = { id?: string; name: string; role: string; email?: string | null; registrationNumber?: string | null };
export type ApiTokens = { accessToken?: string; refreshToken?: string | null; expiresIn?: number; user?: ApiUser };

export function roleFromApi(role: string): Role {
  return role === "SYSTEM_ADMINISTRATOR" ? "admin" : role === "ELECTION_OFFICER" || role === "DISPUTE_RESOLUTION_COMMITTEE" ? "officer" : "student";
}

// Builds a session from a sign-in, refresh or impersonation response.
export function sessionFromAuth(payload: ApiTokens & { user: ApiUser; accessToken: string }, fallbackDetail = ""): Omit<Session, "signedInAt"> {
  const regNumber = payload.user.registrationNumber ?? undefined;
  return {
    role: roleFromApi(payload.user.role),
    name: payload.user.name,
    detail: regNumber ?? payload.user.email ?? fallbackDetail,
    regNumber,
    email: payload.user.email ?? undefined,
    userId: payload.user.id,
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken ?? undefined,
    accessExpiresAt: Date.now() + (payload.expiresIn ?? 1800) * 1000,
  };
}
