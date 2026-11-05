import { MIN_CANDIDATE_GPA, type CandidateApplication } from "./data";

export type Check = { id: string; label: string; detail: string; pass: boolean };

export type FieldComparison = {
  label: string;
  declared: string;
  registry: string;
  match: boolean;
};

// Automatic checks against the registrar record. They apply the same rules to every candidate.
export function eligibilityChecks(a: CandidateApplication): Check[] {
  const r = a.registry;
  return [
    {
      id: "enrolment",
      label: "Currently enrolled",
      detail: `Registry status: ${r.enrolment}.`,
      pass: r.enrolment === "Active",
    },
    {
      id: "gpa",
      label: `Cumulative GPA of at least ${MIN_CANDIDATE_GPA.toFixed(1)}`,
      detail: `Registry GPA: ${r.gpa.toFixed(2)}.`,
      pass: r.gpa >= MIN_CANDIDATE_GPA,
    },
    {
      id: "faculty",
      label: "Member of the faculty for this position",
      detail: a.electionFaculty ? `Registry faculty: ${r.faculty}; position requires ${a.electionFaculty}.` : "University-wide position.",
      pass: !a.electionFaculty || r.faculty === a.electionFaculty,
    },
    {
      id: "discipline",
      label: "No open disciplinary case",
      detail: r.disciplinaryCase ? "An open case is on record with the Dean of Students." : "No cases on record.",
      pass: !r.disciplinaryCase,
    },
  ];
}

// What the candidate typed on the form versus what the registrar holds.
export function compareDetails(a: CandidateApplication): FieldComparison[] {
  const d = a.declared;
  const r = a.registry;
  return [
    { label: "Full name", declared: d.name, registry: r.name, match: d.name === r.name },
    { label: "Student ID", declared: d.studentId, registry: r.studentId, match: d.studentId === r.studentId },
    { label: "Faculty", declared: d.faculty, registry: r.faculty, match: d.faculty === r.faculty },
    { label: "Programme", declared: d.program, registry: r.program, match: d.program === r.program },
    { label: "Year of study", declared: d.year, registry: r.year, match: d.year === r.year },
  ];
}
