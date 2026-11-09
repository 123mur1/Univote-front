"use client";

import { useEffect, useState } from "react";
import type { Election, ElectionStatus } from "./data";
import { apiBase, reportApiError } from "./api-client";

type ApiCandidate = { id: string; name: string; photoUrl?: string | null; programme?: string | null; year?: string | null; manifesto: string; publishedVotes?: number | null };
type ApiElection = {
  id: string; title: string; description?: string | null; scopeLevel: string; scopeValue?: string | null;
  closesOn: string; nominationsClose?: string | null; status: string; opensAt: string; closesAt: string; resultHash?: string | null;
  eligibleCount?: number; publicKey?: string | null;
  bulletinRoot?: string | null; contests: { id: string; title: string; description: string; candidates: ApiCandidate[] }[];
  _count?: { encryptedBallots?: number; voterParticipations?: number };
};

function mapElection(row: ApiElection): Election {
  const level = row.scopeLevel.toLowerCase() as "university" | "college" | "school" | "department" | "campus";
  const scope = level === "university" ? "University-wide" : row.scopeValue ?? level;
  const opensAt = new Date(row.opensAt);
  const closesAt = new Date(row.closesAt);
  const status = row.status.toLowerCase() as ElectionStatus;
  return {
    id: row.id,
    title: row.title,
    scope,
    eligibility: level === "university" ? { level } : { level, value: row.scopeValue ?? "" },
    closesOn: row.closesOn.slice(0, 10),
    ...(row.nominationsClose ? { nominationsClose: row.nominationsClose.slice(0, 10) } : {}),
    status,
    opens: opensAt.toLocaleString("en-GB"),
    closes: closesAt.toLocaleString("en-GB"),
    opensAtIso: row.opensAt,
    closesAtIso: row.closesAt,
    eligibleVoters: row.eligibleCount ?? 0,
    ballotsCast: row._count?.voterParticipations ?? row._count?.encryptedBallots ?? 0,
    contests: row.contests.map((contest) => ({
      id: contest.id,
      title: contest.title,
      description: contest.description,
      candidates: contest.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        photo: candidate.photoUrl ?? undefined,
        program: candidate.programme ?? "",
        year: candidate.year ?? "",
        manifesto: candidate.manifesto,
        ...(candidate.publishedVotes == null ? {} : { votes: candidate.publishedVotes }),
      })),
    })),
    ...(row.resultHash ? { resultHash: row.resultHash } : {}),
    ...(row.bulletinRoot ? { bulletinRoot: row.bulletinRoot } : {}),
    ...(row.publicKey ? { publicKey: row.publicKey } : {}),
  };
}

export function useApiElections() {
  const [elections, setElections] = useState<Election[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = () => fetch(`${apiBase}/elections`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Election API returned ${response.status}`);
        return response.json() as Promise<ApiElection[]>;
      })
      .then((rows) => { if (active && Array.isArray(rows)) setElections(rows.map(mapElection)); })
      .catch((cause) => { if (active) reportApiError(cause); });
    void refresh();
    window.addEventListener("univote:elections-updated", refresh);
    return () => { active = false; window.removeEventListener("univote:elections-updated", refresh); };
  }, []);
  return elections;
}
