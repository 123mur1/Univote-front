"use client";

// Prototype-only stores kept in this browser's localStorage so the student's nomination,
// the officer's review queue and the review page all agree. The backend will own this later.

import { createStore } from "./local-store";
import type { ApplicationDocument, ApplicationStatus, CandidateApplication } from "./data";

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

export function deleteSubmissionsForElection(electionId: string) {
  const removedIds = new Set(submissionStore.read().filter((submission) => submission.electionId === electionId).map((submission) => submission.id));
  submissionStore.write(submissionStore.read().filter((submission) => !removedIds.has(submission.id)));
  if (removedIds.size) {
    const currentReviews = reviewStore.read();
    reviewStore.write(Object.fromEntries(Object.entries(currentReviews).filter(([id]) => !removedIds.has(id))));
  }
}
