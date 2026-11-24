"use client";

import { createStore } from "./local-store";
import { demoMode } from "./runtime-mode";

// Offline demo only. With the backend, an election's status says whether results are published.
const initial = ["by-election-2026"];
const store = createStore<string[]>("univote.published-results.v1", initial);
const NONE: string[] = [];
export const usePublishedResults: () => string[] = demoMode ? store.use : () => NONE;
export const readPublishedResults = store.read;
export function publishResults(electionId: string) {
  if (!demoMode) return;
  const current = store.read();
  if (!current.includes(electionId)) store.write([...current, electionId]);
}
