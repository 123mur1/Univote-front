"use client";

import type { Election } from "./data";
import { createStore } from "./local-store";

const store = createStore<Election[]>("univote.created-elections.v1", []);

export const useCreatedElections = store.use;

export function addCreatedElection(election: Election) {
  const existing = store.read();
  store.write([election, ...existing.filter((item) => item.id !== election.id)]);
}

export function removeCreatedElection(electionId: string) {
  store.write(store.read().filter((election) => election.id !== electionId));
}
