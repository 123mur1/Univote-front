"use client";

import { DEMO_STUDENT_REG, type Election } from "./data";
import { createStore } from "./local-store";
import { findInRegistry, isEligible, voterChecks, type Check, type RegistryStudent } from "./registry";
import { useRegistry } from "./registry-store";
import { useSession } from "./session";
import { useSettings } from "./settings";

// One ballot per registry student per election, keyed by registration number so a second account
// (or a re-created one) can never vote twice.
const votesStore = createStore<Record<string, string>>("univote.cast-votes.v2", {});

export const useVotes = votesStore.use;

export function voteKey(electionId: string, regNumber: string) {
  return `${electionId}:${regNumber.toUpperCase()}`;
}

export function recordVote(electionId: string, regNumber: string): boolean {
  const all = votesStore.read();
  const key = voteKey(electionId, regNumber);
  if (all[key]) return false;
  votesStore.write({ ...all, [key]: new Date().toISOString() });
  return true;
}

export function useCurrentStudent(): { regNumber: string; record?: RegistryStudent; signedIn: boolean } {
  const session = useSession();
  const registry = useRegistry();
  const regNumber = session?.role === "student" && session.regNumber ? session.regNumber : DEMO_STUDENT_REG;
  return { regNumber, record: findInRegistry(registry, regNumber), signedIn: session?.role === "student" };
}

export type VoterStatus = { eligible: boolean; voted: boolean; checks: Check[] };

export function useVoterStatus(election: Pick<Election, "id" | "eligibility" | "closesOn">): VoterStatus {
  const { regNumber, record } = useCurrentStudent();
  const settings = useSettings();
  const votes = useVotes();
  const checks = voterChecks(record, { scope: election.eligibility, closesOn: election.closesOn }, settings.academicYear);
  const voted = Boolean(votes[voteKey(election.id, regNumber)]);
  return {
    eligible: isEligible(checks) && !voted,
    voted,
    checks: [...checks, { id: "voted", label: "Has not voted yet", detail: voted ? "A ballot was already cast from this registration number." : "No ballot cast yet.", pass: !voted }],
  };
}
