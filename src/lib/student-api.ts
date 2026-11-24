"use client";

import { useApi } from "./use-api";

export type ApiStatus = "UPCOMING" | "OPEN" | "CLOSED" | "PUBLISHED";

export type StudentElection = {
  id: string;
  title: string;
  description: string | null;
  status: ApiStatus;
  scopeLevel: string;
  scopeValue: string | null;
  opensAt: string;
  closesAt: string;
  nominationsClose: string | null;
  inScope: boolean;
  canVote: boolean;
  voted: boolean;
  votedAt: string | null;
  ballotsCast: number;
  eligibleCount: number;
  resultHash: string | null;
  contests: {
    id: string;
    title: string;
    seats: number;
    candidates: { id: string; name: string; photoUrl: string | null; programme: string; year: string; manifesto: string; publishedVotes: number | null }[];
  }[];
};

export type RegistryRow = {
  registrationNumber: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  email: string | null;
  college: string;
  collegeCode: string | null;
  school: string;
  department: string;
  programme: string | null;
  campus: string;
  level: string | null;
  yearOfStudy: number | null;
  enrolment: string;
  registeredAcademicYear: string | null;
  studyStart: string | null;
  studyEnd: string | null;
  cumulativeGpa: string | null;
  openDisciplinaryCase: boolean | null;
};

export type StudentOverview = {
  academicYear: string;
  record: RegistryRow | null;
  standing: { ok: boolean; reasons: string[] };
  candidacy: { gpa: number | null; gpaOk: boolean; disciplinaryOk: boolean } | null;
  elections: StudentElection[];
  nominations: { id: string; contest: string; election: string; electionStatus: ApiStatus; status: "PENDING" | "APPROVED" | "REJECTED"; decisionNote: string | null; submittedAt: string; documents: number }[];
};

export function useStudentOverview() {
  return useApi<StudentOverview>("/stats/student", { pollMs: 60_000 });
}

export function scopeText(e: { scopeLevel: string; scopeValue: string | null }) {
  return e.scopeLevel === "UNIVERSITY" ? "University-wide" : `${e.scopeValue} (${e.scopeLevel.toLowerCase()})`;
}

export function nominationsOpen(e: Pick<StudentElection, "status" | "nominationsClose">) {
  if (e.status !== "UPCOMING" && e.status !== "OPEN") return false;
  if (!e.nominationsClose) return e.status === "UPCOMING";
  return e.nominationsClose.slice(0, 10) >= new Date().toISOString().slice(0, 10);
}

// "in 3 days", "in 5 hours", "2 days ago".
export function relativeTime(iso: string, now = Date.now()) {
  const diff = Date.parse(iso) - now;
  const abs = Math.abs(diff);
  const units: [number, string][] = [[86_400_000, "day"], [3_600_000, "hour"], [60_000, "minute"]];
  for (const [size, unit] of units) {
    if (abs >= size) {
      const value = Math.round(abs / size);
      const text = `${value} ${unit}${value === 1 ? "" : "s"}`;
      return diff >= 0 ? `in ${text}` : `${text} ago`;
    }
  }
  return diff >= 0 ? "in under a minute" : "just now";
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatDay(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
}
