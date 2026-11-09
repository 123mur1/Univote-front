"use client";

import { useEffect, useState } from "react";
import type { CandidateApplication, ApplicationDocument, ApplicationStatus } from "./data";
import { apiRequest, reportApiError } from "./api-client";
import { readSession } from "./session";

type ApiNomination = {
  id: string; electionId: string; studentRegistrationNo: string; name: string; email: string; phone: string;
  slogan: string; manifesto: string; electionFaculty?: string | null; declaredSnapshot: Record<string, string>;
  registrySnapshot: Record<string, unknown>; status: string; decisionNote?: string | null; submittedAt: string;
  documents: { id: string; kind: string; name: string; storageKey: string; sizeBytes?: number | null; uploadedAt: string; reviews?: { status: string; note?: string | null; reviewedAt: string }[] }[];
  contest: { id: string; title: string }; election: { id: string; title: string; scopeLevel: string; scopeValue?: string | null };
};

function mapNomination(row: ApiNomination): CandidateApplication {
  const declared = row.declaredSnapshot ?? {};
  const registry = row.registrySnapshot ?? {};
  const registryText = (key: string) => typeof registry[key] === "string" ? registry[key] as string : "";
  const status = row.status.toLowerCase() as ApplicationStatus;
  const docs: ApplicationDocument[] = row.documents.map((document) => {
    const review = document.reviews?.at(-1);
    const kind = document.kind.toLowerCase().replace("_", "-") as ApplicationDocument["kind"];
    return {
      id: document.id, kind, name: document.name, file: document.storageKey,
      size: document.sizeBytes ? `${Math.round(document.sizeBytes / 1024)} KB` : "—",
      uploaded: new Date(document.uploadedAt).toLocaleString(),
      ...(review ? { reviewStatus: review.status.toLowerCase() as "verified" | "flagged", reviewNote: review.note ?? undefined } : {}),
    };
  });
  const scope = row.election.scopeLevel === "UNIVERSITY" ? "University-wide" : row.election.scopeValue ?? row.election.scopeLevel;
  const scopeLevel = row.election.scopeLevel.toLowerCase() as "university" | "college" | "school" | "department" | "campus";
  const programme = declared.program ?? declared.programme ?? registryText("programme") ?? registryText("department") ?? "";
  const year = declared.year ?? (registryText("yearOfStudy") ? `Year ${registryText("yearOfStudy")}` : "Not supplied");
  return {
    id: row.id, name: row.name, studentId: row.studentRegistrationNo, contest: row.contest.title,
    electionId: row.electionId, election: row.election.title, electionFaculty: row.electionFaculty ?? scope,
    electionEligibility: scopeLevel === "university" ? { level: scopeLevel } : { level: scopeLevel, value: row.election.scopeValue ?? "" },
    submitted: new Date(row.submittedAt).toLocaleDateString("en-GB"), status, decisionNote: row.decisionNote ?? undefined,
    photo: docs.find((doc) => doc.kind === "photo")?.file, email: row.email, phone: row.phone, slogan: row.slogan,
    manifesto: row.manifesto,
    declared: { name: declared.name ?? row.name, studentId: row.studentRegistrationNo, faculty: declared.faculty ?? registryText("school"), program: programme, year },
    registry: { name: `${registryText("firstName")} ${registryText("lastName")}`.trim() || row.name, studentId: row.studentRegistrationNo,
      faculty: registryText("school"), program: programme, year, enrolment: registryText("enrolment") === "ACTIVE" ? "Active" : "Suspended",
      gpa: Number(registry.cumulativeGpa ?? 0), disciplinaryCase: registry.openDisciplinaryCase !== false && registry.openDisciplinaryCase !== "false" },
    documents: docs, apiManaged: true,
  };
}

export function useApiNominations(mine = false) {
  const [items, setItems] = useState<CandidateApplication[]>([]);
  const token = readSession()?.accessToken;
  useEffect(() => {
    if (!token) return;
    apiRequest<ApiNomination[]>(mine ? "/nominations/mine" : "/nominations")
      .then((rows) => setItems(rows.map(mapNomination)))
      .catch(reportApiError);
  }, [token, mine]);
  return items;
}
