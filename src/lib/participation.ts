// Simulated participation for the prototype: which registry students have accounts and which have
// voted. Deterministic, so every page and chart agrees. The backend will supply the real figures.

import { DEFAULT_ACADEMIC_YEAR, isEligible, voterChecks, type AcademicYear, type ElectionScope, type RegistryStudent } from "./registry";

function unit(seed: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 4294967296;
}

// Share of eligible students who have voted so far in each open election.
const TURNOUT: Record<string, number> = { "sug-2026": 0.43, "sci-assoc-2026": 0.34 };

// Students used in demo sign-ins never count as having voted, so they can try voting.
const DEMO_NOT_VOTED = new Set(["2024/BUS/0388", "2023/ICT/0142", "2023/SCI/0219", "2022/ENG/0077"]);

export function eligibleFor(s: RegistryStudent, e: { eligibility: ElectionScope; closesOn: string }, ay: AcademicYear = DEFAULT_ACADEMIC_YEAR) {
  return isEligible(voterChecks(s, { scope: e.eligibility, closesOn: e.closesOn }, ay));
}

export function simulatedVoted(regNumber: string, electionId: string) {
  const rate = TURNOUT[electionId] ?? 0;
  return rate > 0 && !DEMO_NOT_VOTED.has(regNumber) && unit(`${regNumber}|${electionId}`) < rate;
}

// Hour of the day (8–17) a simulated ballot was cast, peaking late morning.
export function simulatedVoteHour(regNumber: string, electionId: string) {
  const u = unit(`${electionId}|hour|${regNumber}`);
  const weights = [6, 12, 16, 14, 11, 9, 8, 10, 8, 6];
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    if (u < acc) return 8 + i;
  }
  return 17;
}

// ISO date a simulated account was created, or undefined if the student has none.
export function simulatedAccountCreated(s: RegistryStudent): string | undefined {
  if (DEMO_NOT_VOTED.has(s.regNumber)) return "2026-09-20";
  const current = s.enrolment === "Active" && s.registeredAcademicYear === DEFAULT_ACADEMIC_YEAR.label;
  const u = unit(`account|${s.regNumber}`);
  if (u > (current ? 0.72 : 0.35)) return undefined;
  // Sign-ups cluster after term opens (Sep 1) and before voting (Nov 3).
  const start = Date.UTC(2026, 8, 1);
  const end = Date.UTC(2026, 10, 3);
  const skew = Math.pow(unit(`created|${s.regNumber}`), 0.7);
  const created = current ? start + skew * (end - start) : Date.UTC(2025, 9, 1) + skew * 200 * 86_400_000;
  return new Date(created).toISOString().slice(0, 10);
}
