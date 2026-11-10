"use client";

// Security and administration events (sign-ins, failures, timeouts, blocked votes, admin changes).
// The election audit log of ballots stays separate and hash-chained.

import { createStore } from "./local-store";
import { demoMode } from "./runtime-mode";
import type { Role } from "./settings";

export type ActivityType =
  | "login"
  | "login_failed"
  | "logout"
  | "timeout"
  | "signup"
  | "signup_blocked"
  | "vote"
  | "vote_blocked"
  | "account"
  | "settings"
  | "registry"
  | "nomination"
  | "review"
  | "election";

export type Activity = {
  id: string;
  at: string;
  actor: string;
  role: Role | "anonymous";
  type: ActivityType;
  severity: "info" | "warning" | "critical";
  detail: string;
  before?: string;
  after?: string;
};

const MAX = 1000;
const store = createStore<Activity[]>("univote.activity.v1", []);

// With the backend, the server records activity; this browser log only exists in the offline demo.
const NONE: Activity[] = [];
export const useActivity: () => Activity[] = demoMode ? store.use : () => NONE;
export const readActivity = store.read;

export function logActivity(e: Omit<Activity, "id" | "at">) {
  if (!demoMode) return;
  const entry: Activity = { ...e, id: crypto.randomUUID(), at: new Date().toISOString() };
  try {
    store.write([entry, ...store.read()].slice(0, MAX));
  } catch {
    // Storage full: drop the event rather than break the user's action.
  }
}

export function clearActivity() {
  store.clear();
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  login: "Signed in",
  login_failed: "Failed sign-in",
  logout: "Signed out",
  timeout: "Session timed out",
  signup: "Student signed up",
  signup_blocked: "Sign-up refused",
  vote: "Ballot cast",
  vote_blocked: "Vote refused",
  account: "Account change",
  settings: "Settings change",
  registry: "Registry update",
  nomination: "Candidate nomination",
  review: "Candidate review",
  election: "Election change",
};
