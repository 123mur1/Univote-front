"use client";

// Prototype-only stores kept in this browser's localStorage so the student's nomination,
// the officer's review queue and the review page all agree. The backend will own this later.

import { useSyncExternalStore } from "react";
import type { ApplicationDocument, ApplicationStatus, CandidateApplication } from "./data";

function createStore<T>(key: string, empty: T) {
  const listeners = new Set<() => void>();
  let cache: T | null = null;

  function read(): T {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : empty;
    } catch {
      cache = empty;
    }
    return cache;
  }

  // Throws if the browser refuses to store it (e.g. quota exceeded); the in-memory copy is unchanged then.
  function write(next: T) {
    localStorage.setItem(key, JSON.stringify(next));
    cache = next;
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        cache = null;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  return {
    read,
    write,
    use: () => useSyncExternalStore(subscribe, read, () => empty),
  };
}

// ---- Officer reviews -------------------------------------------------------------------

export type DocStatus = "verified" | "flagged";

export type Review = {
  status?: ApplicationStatus;
  note?: string;
  decidedAt?: string;
  decidedBy?: string;
  docs: Record<string, { status: DocStatus; note?: string }>;
};

const reviewStore = createStore<Record<string, Review>>("univote.candidate-reviews.v1", {});

export const useReviews = reviewStore.use;

export function updateReview(id: string, change: (r: Review) => Review) {
  const all = reviewStore.read();
  try {
    reviewStore.write({ ...all, [id]: change(all[id] ?? { docs: {} }) });
  } catch {
    // Storage unavailable; the decision simply isn't persisted in the demo.
  }
}

export function resetReviews() {
  try {
    reviewStore.write({});
  } catch {}
}

export function effectiveStatus(a: CandidateApplication, r?: Review): ApplicationStatus {
  return r?.status ?? a.status;
}

// Applications decided before this session count their documents as already verified.
export function docStatus(a: CandidateApplication, doc: ApplicationDocument, r?: Review): DocStatus | undefined {
  return r?.docs[doc.id]?.status ?? (a.status !== "pending" && !r?.status ? "verified" : undefined);
}

// ---- Student nominations -----------------------------------------------------------------

const submissionStore = createStore<CandidateApplication[]>("univote.submissions.v1", []);

export const useSubmissions = submissionStore.use;

export function addSubmission(a: CandidateApplication): string | null {
  try {
    submissionStore.write([a, ...submissionStore.read()]);
    return null;
  } catch {
    return "Your files are too large to keep in this demo browser. Use smaller images or PDFs and try again.";
  }
}

export function resetSubmissions() {
  try {
    submissionStore.write([]);
  } catch {}
}
