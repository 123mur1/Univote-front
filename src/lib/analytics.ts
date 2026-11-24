"use client";

import { useMemo } from "react";
import { useRegisteredStudents } from "./accounts";
import type { Election } from "./data";
import { eligibleFor, simulatedAccountCreated, simulatedVoted, simulatedVoteHour } from "./participation";
import type { AcademicYear, RegistryStudent } from "./registry";
import { useRegistry } from "./registry-store";
import { useSettings } from "./settings";
import { useVotes, voteKey } from "./student-context";

// Why a student can or can't vote this academic year (first failing rule wins).
export type Standing = "Eligible" | "Not re-registered" | "Study period ended" | "Deferred" | "Suspended" | "Graduated" | "Withdrawn";

export const STANDINGS: Standing[] = ["Eligible", "Not re-registered", "Study period ended", "Deferred", "Suspended", "Graduated", "Withdrawn"];

export function standingOf(s: RegistryStudent, ay: AcademicYear, today: string): Standing {
  if (s.enrolment === "Graduated") return "Graduated";
  if (s.enrolment === "Withdrawn") return "Withdrawn";
  if (s.enrolment === "Suspended") return "Suspended";
  if (s.enrolment === "Deferred") return "Deferred";
  if (s.studyEnd < today) return "Study period ended";
  if (s.registeredAcademicYear !== ay.label) return "Not re-registered";
  return "Eligible";
}

export type StudentRow = RegistryStudent & {
  standing: Standing;
  account: "Registered here" | "Has account" | "No account";
  accountCreated?: string;
  accountSuspended: boolean;
};

export function useStudentRows(): StudentRow[] {
  const registry = useRegistry();
  const settings = useSettings();
  const accounts = useRegisteredStudents();
  return useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const byReg = new Map(accounts.map((a) => [a.regNumber.toUpperCase(), a]));
    return registry.map((s) => {
      const real = byReg.get(s.regNumber.toUpperCase());
      const simulated = real ? undefined : simulatedAccountCreated(s);
      return {
        ...s,
        standing: standingOf(s, settings.academicYear, today),
        account: real ? "Registered here" : simulated ? "Has account" : "No account",
        accountCreated: real ? real.createdAt.slice(0, 10) : simulated,
        accountSuspended: Boolean(real?.suspended),
      };
    });
  }, [registry, settings.academicYear, accounts]);
}

// Electorate and turnout for one election, from the registry plus real and simulated ballots.
export function useElectionStats(election: Election | undefined, rows: StudentRow[]) {
  const votes = useVotes();
  const settings = useSettings();
  return useMemo(() => {
    if (!election) return { electorate: [] as StudentRow[], voters: [] as StudentRow[], hours: [] as number[] };
    const electorate = rows.filter((s) => eligibleFor(s, election, settings.academicYear));
    const voters = electorate.filter((s) => simulatedVoted(s.regNumber, election.id) || Boolean(votes[voteKey(election.id, s.regNumber)]));
    const hours = voters.map((s) => {
      const real = votes[voteKey(election.id, s.regNumber)];
      return real ? new Date(real).getHours() : simulatedVoteHour(s.regNumber, election.id);
    });
    return { electorate, voters, hours };
  }, [election, rows, votes, settings.academicYear]);
}

export function countBy<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return m;
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
