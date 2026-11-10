"use client";

import type { Election } from "./data";
import { createStore } from "./local-store";
import { demoMode } from "./runtime-mode";

// Browser-only elections exist only in the offline demo. With the backend, elections live on the server.
const store = createStore<Election[]>("univote.created-elections.v1", []);
const NONE: Election[] = [];

export const useCreatedElections: () => Election[] = demoMode ? store.use : () => NONE;

export function addCreatedElection(election: Election) {
  if (!demoMode) return;
  const existing = store.read();
  store.write([election, ...existing.filter((item) => item.id !== election.id)]);
}

export function removeCreatedElection(electionId: string) {
  store.write(store.read().filter((election) => election.id !== electionId));
}
