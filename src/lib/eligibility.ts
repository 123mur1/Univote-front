import { MIN_CANDIDATE_GPA, type CandidateApplication } from "./data";
import { scopeLabel } from "./registry";

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
  const scope = a.electionEligibility;
  const location = a.candidateLocation;
  let scopePass = true;
  let scopeDetail = "University-wide position.";
  if (scope && location) {
    const unitMatches = scope.level === "university"
      || (scope.level === "campus" && location.campus === scope.value)
      || (scope.level === "college" && (location.collegeCode === scope.value || location.college === scope.value))
      || (scope.level === "school" && location.school === scope.value)
      || (scope.level === "department" && location.department === scope.value);
    const yearMatches = !scope.yearOfStudy || location.yearOfStudy === scope.yearOfStudy;
    scopePass = unitMatches && yearMatches;
    scopeDetail = `Required: ${scopeLabel(scope)}. Registry: ${location.department}, ${location.school}, ${location.campus} campus, Year ${location.yearOfStudy}.`;
  } else if (a.electionFaculty) {
    // Older locally saved applications stored a display string here instead of the election's structured scope.
    const match = a.electionFaculty.match(/^(.*?)(?:\s+students)?(?:\s*·\s*Year\s+(\d+))?$/);
    const requiredUnit = match?.[1]?.trim();
    const requiredYear = match?.[2];
    const unitMatches = !requiredUnit || requiredUnit === r.faculty || requiredUnit === r.program;
    const yearMatches = !requiredYear || requiredYear === r.year.replace(/^Year\s*/i, "");
    scopePass = unitMatches && yearMatches;
    scopeDetail = `Required: ${a.electionFaculty}. Registry faculty: ${r.faculty}; programme: ${r.program}; year: ${r.year}.`;
  }
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
      label: "Matches the election voter group",
      detail: scopeDetail,
      pass: scopePass,
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
