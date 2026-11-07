"use client";

import { createStore } from "./local-store";

const initial = ["by-election-2026"];
const store = createStore<string[]>("univote.published-results.v1", initial);
export const usePublishedResults = store.use;
export const readPublishedResults = store.read;
export function publishResults(electionId: string) {
  const current = store.read();
  if (!current.includes(electionId)) store.write([...current, electionId]);
}
