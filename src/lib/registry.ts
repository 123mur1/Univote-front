// The registry office's student list is the single source of truth for who is a student, where they
// study and until when. Accounts never store academic details the student typed; every eligibility
// decision is re-computed from the registry record at the time it is needed.

import { allUrCampuses, urColleges } from "./ur-structure";

export type EnrolmentStatus = "Active" | "Deferred" | "Suspended" | "Graduated" | "Withdrawn";

export type RegistryStudent = {
  regNumber: string;
  firstName: string;
  lastName: string;
  gender: "F" | "M" | "";
  dateOfBirth: string; // ISO date, used to confirm identity at sign-up
  email: string;
  collegeCode: string;
  college: string;
  school: string;
  department: string;
  programme: string;
  campus: string;
  level: "Undergraduate" | "Postgraduate" | "";
  yearOfStudy: number;
  enrolment: EnrolmentStatus;
  registeredAcademicYear: string; // last academic year the student completed registration for
  studyStart: string; // ISO date
  studyEnd: string; // ISO date: the student's time on campus ends here
  cumulativeGpa?: number;
  openDisciplinaryCase?: boolean;
  testingImport?: true;
};

export type AcademicYear = { label: string; start: string; end: string };

export const DEFAULT_ACADEMIC_YEAR: AcademicYear = { label: "2026/2027", start: "2026-09-01", end: "2027-08-31" };

export type ElectionScope = (
  | { level: "university" }
  | { level: "college" | "school" | "department" | "campus"; value: string }
) & { yearOfStudy?: number };

export function scopeLabel(scope: ElectionScope) {
  const label = scope.level === "university" ? "All registered students" : scope.level === "campus" ? `${scope.value} campus students` : `${scope.value} students`;
  return scope.yearOfStudy ? `${label} · Year ${scope.yearOfStudy}` : label;
}

export function inScope(s: RegistryStudent, scope: ElectionScope) {
  const matchesUnit = (() => { switch (scope.level) {
    case "university":
      return true;
    case "college":
      return s.collegeCode === scope.value || s.college === scope.value;
    case "school":
      return s.school === scope.value;
    case "department":
      return s.department === scope.value;
    case "campus":
      return s.campus === scope.value;
  } })();
  return matchesUnit && (!scope.yearOfStudy || s.yearOfStudy === scope.yearOfStudy);
}

export type Check = { id: string; label: string; detail: string; pass: boolean };

// Every rule is checked against the registry at the moment of the check, so an account created in an
// earlier academic year cannot carry eligibility forward.
export function voterChecks(
  s: RegistryStudent | undefined,
  election: { scope: ElectionScope; closesOn: string },
  academicYear: AcademicYear,
): Check[] {
  if (!s) {
    return [{ id: "registry", label: "Listed by the registry office", detail: "This registration number is not on the registry list.", pass: false }];
  }
  if (s.testingImport) {
    return [{
      id: "registry",
      label: "Added to the testing voter list",
      detail: "An election officer added this registration number to the testing list.",
      pass: true,
    }];
  }
  return [
    { id: "registry", label: "Listed by the registry office", detail: `${s.regNumber} found in the registry.`, pass: true },
    {
      id: "enrolment",
      label: "Enrolment is active",
      detail: s.enrolment === "Active" ? "Registry status: Active." : `Registry status: ${s.enrolment}.`,
      pass: s.enrolment === "Active",
    },
    {
      id: "academic-year",
      label: `Registered for ${academicYear.label}`,
      detail:
        s.registeredAcademicYear === academicYear.label
          ? `Registration completed for ${academicYear.label}.`
          : `Last registered for ${s.registeredAcademicYear}. Registration for ${academicYear.label} is missing.`,
      pass: s.registeredAcademicYear === academicYear.label,
    },
    {
      id: "study-period",
      label: "Still a student when voting closes",
      detail:
        s.studyEnd >= election.closesOn
          ? `Study period runs until ${formatDate(s.studyEnd)}.`
          : `Study period ended on ${formatDate(s.studyEnd)}, before voting closes.`,
      pass: s.studyEnd >= election.closesOn,
    },
    {
      id: "scope",
      label: scopeLabel(election.scope),
      detail: inScope(s, election.scope)
        ? `${s.school}, ${s.campus} campus.`
        : `Registry shows ${s.school} (${s.campus} campus), which is outside this election.`,
      pass: inScope(s, election.scope),
    },
  ];
}

export function isEligible(checks: Check[]) {
  return checks.every((c) => c.pass);
}

// Account-level standing: whether the student may hold an account this academic year at all.
export function accountChecks(s: RegistryStudent | undefined, academicYear: AcademicYear, today: string): Check[] {
  if (!s) return voterChecks(undefined, { scope: { level: "university" }, closesOn: today }, academicYear);
  return voterChecks(s, { scope: { level: "university" }, closesOn: today }, academicYear).filter((c) => c.id !== "scope");
}

export function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fullName(s: Pick<RegistryStudent, "firstName" | "lastName">) {
  return `${s.firstName} ${s.lastName}`;
}

// ---- Seed registry -----------------------------------------------------------------------
// Named students are referenced elsewhere in the demo (accounts, candidates, nominators).

type Seed = Omit<RegistryStudent, "college" | "collegeCode" | "level"> & { collegeCode: string; level?: RegistryStudent["level"] };

const named: Seed[] = [
  { regNumber: "2024/BUS/0388", firstName: "Moses", lastName: "Hakizimana", gender: "M", dateOfBirth: "2004-03-14", email: "m.hakizimana@stud.ur.ac.rw", collegeCode: "CBE", school: "School of Business", department: "Marketing and Human Resources", programme: "Marketing and Human Resources", campus: "Huye", yearOfStudy: 2, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2024-09-01", studyEnd: "2028-06-30" },
  { regNumber: "2023/ICT/0142", firstName: "Diane", lastName: "Uwineza", gender: "F", dateOfBirth: "2003-07-22", email: "d.uwineza@stud.ur.ac.rw", collegeCode: "CST", school: "School of ICT", department: "Computer Science", programme: "BSc (Hons) Computer Science", campus: "Nyarugenge", yearOfStudy: 3, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2023-09-01", studyEnd: "2027-06-30" },
  { regNumber: "2023/SCI/0219", firstName: "Patrick", lastName: "Nshuti", gender: "M", dateOfBirth: "2003-01-09", email: "p.nshuti@stud.ur.ac.rw", collegeCode: "CST", school: "School of Science", department: "Physics", programme: "Physics", campus: "Nyarugenge", yearOfStudy: 3, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2023-09-01", studyEnd: "2027-06-30" },
  { regNumber: "2022/ENG/0077", firstName: "Eric", lastName: "Mugenzi", gender: "M", dateOfBirth: "2001-11-30", email: "e.mugenzi@stud.ur.ac.rw", collegeCode: "CST", school: "School of Engineering", department: "Civil Engineering", programme: "Civil Engineering", campus: "Nyarugenge", yearOfStudy: 4, enrolment: "Graduated", registeredAcademicYear: "2025/2026", studyStart: "2022-09-01", studyEnd: "2026-06-30" },
  { regNumber: "2024/LAW/0310", firstName: "Grace", lastName: "Ingabire", gender: "F", dateOfBirth: "2004-05-02", email: "g.ingabire@stud.ur.ac.rw", collegeCode: "CASS", school: "School of Law", department: "Public Law", programme: "Public Law", campus: "Huye", yearOfStudy: 2, enrolment: "Active", registeredAcademicYear: "2025/2026", studyStart: "2024-09-01", studyEnd: "2028-06-30" },
  { regNumber: "2023/SCI/0101", firstName: "Amina", lastName: "Uwase", gender: "F", dateOfBirth: "2003-02-18", email: "a.uwase@stud.ur.ac.rw", collegeCode: "CST", school: "School of Science", department: "Mathematics", programme: "Mathematics", campus: "Nyarugenge", yearOfStudy: 3, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2023-09-01", studyEnd: "2027-06-30" },
  { regNumber: "2022/LAW/0044", firstName: "Jean-Paul", lastName: "Habimana", gender: "M", dateOfBirth: "2002-08-11", email: "jp.habimana@stud.ur.ac.rw", collegeCode: "CASS", school: "School of Law", department: "Private Law", programme: "Private Law", campus: "Huye", yearOfStudy: 4, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2022-09-01", studyEnd: "2027-06-30" },
  { regNumber: "2024/ART/0560", firstName: "Thierry", lastName: "Bizimana", gender: "M", dateOfBirth: "2004-12-03", email: "t.bizimana@stud.ur.ac.rw", collegeCode: "CASS", school: "School of Arts and Languages", department: "Modern Languages", programme: "Linguistics and Literature", campus: "Huye", yearOfStudy: 2, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2024-09-01", studyEnd: "2028-06-30" },
  { regNumber: "2025/EDU/0012", firstName: "Josiane", lastName: "Mukeshimana", gender: "F", dateOfBirth: "2006-04-27", email: "j.mukeshimana@stud.ur.ac.rw", collegeCode: "CE", school: "School of Educational Sciences", department: "Early Childhood and Special Education", programme: "Early Childhood and Special Education", campus: "Rukara", yearOfStudy: 1, enrolment: "Active", registeredAcademicYear: "2026/2027", studyStart: "2025-09-01", studyEnd: "2029-06-30" },
  { regNumber: "2021/MED/0219", firstName: "Esther", lastName: "Nyirahabimana", gender: "F", dateOfBirth: "2001-06-15", email: "e.nyirahabimana@stud.ur.ac.rw", collegeCode: "CMHS", school: "School of Medicine and Pharmacy", department: "General Medicine", programme: "Medicine", campus: "Remera", yearOfStudy: 5, enrolment: "Deferred", registeredAcademicYear: "2025/2026", studyStart: "2021-09-01", studyEnd: "2027-06-30" },
  { regNumber: "2022/SCI/0930", firstName: "Claude", lastName: "Ntwari", gender: "M", dateOfBirth: "2002-09-21", email: "c.ntwari@stud.ur.ac.rw", collegeCode: "CST", school: "School of Science", department: "Chemistry", programme: "Chemistry", campus: "Nyarugenge", yearOfStudy: 4, enrolment: "Suspended", registeredAcademicYear: "2026/2027", studyStart: "2022-09-01", studyEnd: "2027-06-30" },
  // Candidates and nominators in the School of Engineering election.
  ...[
    ["2023/ENG/0412", "Olivier", "Kayitare", "M", "Electrical and Electronic Engineering", 3],
    ["2024/ENG/0178", "Ange", "Uwera", "F", "Mechanical Engineering", 2],
    ["2023/ENG/0907", "Samuel", "Rukundo", "M", "Civil Engineering", 3],
    ["2025/ENG/0033", "Belyse", "Iradukunda", "F", "Electrical and Electronic Engineering", 1],
    ["2022/ENG/1120", "Fabrice", "Nkurunziza", "M", "Mechanical Engineering", 4],
    ["2023/ENG/0388", "Kevin", "Mutabazi", "M", "Civil Engineering", 3],
    ["2024/ENG/0102", "Aline", "Uwamahoro", "F", "Mechanical Engineering", 2],
    ["2024/ENG/0215", "Eric", "Habineza", "M", "Electrical and Electronic Engineering", 2],
    ["2023/ENG/0640", "Nadine", "Ishimwe", "F", "Civil Engineering", 3],
    ["2023/ENG/0511", "Pacifique", "Niyonsaba", "M", "Civil Engineering", 3],
    ["2024/ENG/0729", "Joyeuse", "Mukandayisenga", "F", "Mechanical Engineering", 2],
    ["2025/ENG/0061", "Gloria", "Uwase", "F", "Civil Engineering", 1],
    ["2022/ENG/1001", "Didier", "Mugabo", "M", "Mechanical Engineering", 4],
    ["2023/ENG/0150", "Clarisse", "Mukamurenzi", "F", "Electrical and Electronic Engineering", 3],
  ].map(([regNumber, firstName, lastName, gender, department, year]) => {
    const y = year as number;
    const start = 2027 - y;
    return {
      regNumber: regNumber as string,
      firstName: firstName as string,
      lastName: lastName as string,
      gender: gender as "F" | "M",
      dateOfBirth: `${start - 19}-0${(y % 9) + 1}-1${y}`,
      email: `${(firstName as string)[0].toLowerCase()}.${(lastName as string).toLowerCase()}@stud.ur.ac.rw`,
      collegeCode: "CST",
      school: "School of Engineering",
      department: department as string,
      programme: department as string,
      campus: "Nyarugenge",
      yearOfStudy: y,
      enrolment: "Active" as const,
      registeredAcademicYear: "2026/2027",
      studyStart: `${start - 1}-09-01`,
      studyEnd: `${start + 3}-06-30`,
    };
  }),
];

// Deterministic synthetic students so the analytics, filters and exports have realistic volume.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const femaleNames = ["Aline", "Divine", "Sandrine", "Clarisse", "Josiane", "Nadine", "Ange", "Gloria", "Diane", "Chantal", "Yvette", "Esther", "Alice", "Belyse", "Keza", "Ineza", "Teta", "Umutoni", "Mugisha", "Ishimwe"];
const maleNames = ["Eric", "Patrick", "Jean", "Olivier", "Samuel", "Kevin", "Didier", "Fabrice", "Yves", "Moses", "Thierry", "Emmanuel", "Innocent", "Claude", "Pacifique", "David", "Gilbert", "Bosco", "Arsene", "Elie"];
const surnames = ["Habimana", "Uwase", "Niyonzima", "Mukamana", "Nshimiyimana", "Ingabire", "Mugisha", "Uwimana", "Ndayisaba", "Umutoni", "Kayitare", "Uwera", "Iradukunda", "Nkurunziza", "Mutabazi", "Ishimwe", "Niyonsaba", "Mugabo", "Hakizimana", "Bizimana", "Ntwari", "Uwineza", "Nshuti", "Mugenzi", "Kamanzi", "Rukundo", "Munyaneza", "Tuyishime", "Irakoze", "Byiringiro"];

const schoolCodes: Record<string, string> = {
  "School of ICT": "ICT", "School of Science": "SCI", "School of Engineering": "ENG", "School of Business": "BUS", "School of Economics": "ECO",
  "School of Law": "LAW", "School of Governance": "GOV", "School of Arts and Languages": "ART", "School of Journalism and Communication": "JOC",
  "School of Medicine and Pharmacy": "MED", "School of Nursing and Midwifery": "NUR", "School of Public Health": "SPH", "School of Health Sciences": "SHS",
  "School of Dentistry": "DEN", "School of Educational Sciences": "EDU", "School of Mining and Geology": "MIN", "School of Architecture and Built Environment": "ARC",
};

function codeFor(school: string) {
  return schoolCodes[school] ?? school.replace(/^School of /, "").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

function synthetic(count: number): Seed[] {
  const rand = mulberry32(20261103);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const colleges = urColleges.flatMap((c) => c.schools.filter((s) => !s.name.startsWith("Other")).map((s) => ({ c, s })));
  const seq = new Map<string, number>();
  const out: Seed[] = [];
  for (let i = 0; i < count; i++) {
    const { c, s } = pick(colleges);
    const d = pick(s.departments);
    const programme = d.programmes[0] === "Other / not listed" ? d.name : pick(d.programmes);
    const gender = rand() < 0.48 ? "F" : "M";
    const firstName = pick(gender === "F" ? femaleNames : maleNames);
    const lastName = pick(surnames);
    const duration = c.code === "CMHS" && s.name.includes("Medicine") ? 6 : 4;
    const yearOfStudy = 1 + Math.floor(rand() * duration);
    const startYear = 2027 - yearOfStudy;
    const r = rand();
    let enrolment: EnrolmentStatus = "Active";
    if (r > 0.97) enrolment = "Withdrawn";
    else if (r > 0.95) enrolment = "Suspended";
    else if (r > 0.91) enrolment = "Deferred";
    else if (r > 0.86) enrolment = "Graduated";
    const graduated = enrolment === "Graduated";
    const notReregistered = enrolment === "Active" && rand() < 0.06;
    const code = codeFor(s.name);
    const key = `${graduated ? startYear - 1 : startYear}/${code}`;
    const n = (seq.get(key) ?? 1000) + 1 + Math.floor(rand() * 3);
    seq.set(key, n);
    out.push({
      regNumber: `${key}/${String(n).padStart(4, "0")}`,
      firstName,
      lastName,
      gender,
      dateOfBirth: `${startYear - 19 + Math.floor(rand() * 3)}-${String(1 + Math.floor(rand() * 12)).padStart(2, "0")}-${String(1 + Math.floor(rand() * 28)).padStart(2, "0")}`,
      email: `${firstName[0].toLowerCase()}.${lastName.toLowerCase()}${n}@stud.ur.ac.rw`,
      collegeCode: c.code,
      school: s.name,
      department: d.name,
      programme,
      campus: pick(c.campuses),
      level: rand() < 0.08 ? "Postgraduate" : "Undergraduate",
      yearOfStudy,
      enrolment,
      registeredAcademicYear: graduated || notReregistered || enrolment === "Deferred" ? "2025/2026" : "2026/2027",
      studyStart: `${graduated ? startYear - 1 : startYear}-09-01`,
      studyEnd: graduated ? "2026-06-30" : `${startYear + duration}-06-30`,
    });
  }
  return out;
}

function complete(s: Seed): RegistryStudent {
  const college = urColleges.find((c) => c.code === s.collegeCode);
  return { ...s, college: college?.name ?? s.collegeCode, level: s.level ?? "Undergraduate" };
}

export const seedRegistry: RegistryStudent[] = [...named, ...synthetic(1180)].map(complete);

export function findInRegistry(list: RegistryStudent[], regNumber: string) {
  const id = regNumber.trim().toUpperCase();
  return list.find((s) => s.regNumber.toUpperCase() === id);
}

// ---- CSV import / export -------------------------------------------------------------------

export const REGISTRY_COLUMNS: (keyof RegistryStudent)[] = [
  "regNumber", "firstName", "lastName", "gender", "dateOfBirth", "email", "collegeCode", "college", "school", "department",
  "programme", "campus", "level", "yearOfStudy", "enrolment", "registeredAcademicYear", "studyStart", "studyEnd",
];

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: (keyof T)[]) {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n");
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const STATUSES: EnrolmentStatus[] = ["Active", "Deferred", "Suspended", "Graduated", "Withdrawn"];

// Returns parsed students and a list of row errors; rows with errors are skipped.
export function registryFromCsv(text: string): { students: RegistryStudent[]; errors: string[] } {
  return registryFromRows(parseCsv(text));
}

// Converts the small UniVote import template (or a registry workbook with common header names)
// into registry records. Optional source columns are kept when present; the template itself only
// requires identity and academic-unit fields.
export function registryFromSystemRows(rows: string[][], academicYear: AcademicYear): { students: RegistryStudent[]; errors: string[] } {
  const normalize = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const headerRow = rows.slice(0, 20).findIndex((row) => row.some((cell) => ["registrationnumber", "registrationno", "regnumber", "regno", "studentid", "studentnumber"].includes(normalize(cell))));
  if (headerRow < 0) return { students: [], errors: rows.length ? ["Could not find a registration number heading in the first 20 rows."] : ["The workbook is empty."] };
  const header = rows[headerRow];
  const data = rows.slice(headerRow + 1);
  const normalized = header.map(normalize);
  const findColumn = (...aliases: string[]) => {
    for (const alias of aliases) {
      const found = normalized.findIndex((value) => value === normalize(alias));
      if (found >= 0) return found;
    }
    return -1;
  };
  const columns = {
    regNumber: findColumn("Registration Number", "Registration No", "Reg Number", "Reg No", "RegNumber", "Student ID", "Student Number"),
    firstName: findColumn("First Name", "Given Name"),
    lastName: findColumn("Last Name", "Surname", "Family Name"),
    fullName: findColumn("Name", "Names", "Full Name", "Student Name"),
    campus: findColumn("Campus"),
    college: findColumn("College", "College Name", "College Code"),
    school: findColumn("School", "Faculty"),
    department: findColumn("Department", "Department Name"),
    email: findColumn("Email", "Email Address", "University Email"),
    gender: findColumn("Gender", "Sex"),
    dateOfBirth: findColumn("Date Of Birth", "Date Of Birth DOB", "DOB"),
    yearOfStudy: findColumn("Year Of Study", "Study Year", "Year"),
    currentYear: findColumn("Current Year"),
    enrolment: findColumn("Enrolment", "Enrollment", "Enrolment Status", "Status"),
    registeredAcademicYear: findColumn("Registered Academic Year", "Academic Year", "Current Academic Year"),
    studyStart: findColumn("Study Start", "Study Start Date"),
    studyEnd: findColumn("Study End", "Study End Date", "Expected Graduation Date"),
    programme: findColumn("Programme", "Program", "Degree Programme"),
    level: findColumn("Level", "Study Level"),
    cumulativeGpa: findColumn("Cumulative GPA", "GPA", "Grade Point Average"),
    openDisciplinaryCase: findColumn("Open Disciplinary Case", "Disciplinary Case"),
  };
  const required = ["regNumber", "campus", "college", "school", "department"] as const;
  const missing = required.filter((key) => columns[key] < 0);
  if (missing.length) return { students: [], errors: [`Missing columns: ${missing.join(", ")}. Download the UniVote Excel template and transfer the registry data into it.`] };
  if (columns.fullName < 0 && (columns.firstName < 0 || columns.lastName < 0)) return { students: [], errors: ["Include a Name column, or both First Name and Last Name columns."] };

  const get = (row: string[], column: number) => column < 0 ? "" : (row[column] ?? "").trim();
  const allowedCampuses = new Set(allUrCampuses.map(normalize));
  const allowedColleges = new Map(urColleges.flatMap((college) => [[normalize(college.name), college], [normalize(college.code), college]]));
  const students: RegistryStudent[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  data.forEach((row, i) => {
    if (row.every((cell) => !cell.trim())) return;
    const line = i + 2;
    const regNumber = get(row, columns.regNumber).toUpperCase();
    const rawFullName = get(row, columns.fullName);
    const firstName = columns.firstName >= 0 ? get(row, columns.firstName) : rawFullName.split(/\s+/)[0] ?? "";
    const lastName = columns.lastName >= 0 ? get(row, columns.lastName) : rawFullName.split(/\s+/).slice(1).join(" ");
    const campus = get(row, columns.campus);
    const collegeText = get(row, columns.college);
    const schoolText = get(row, columns.school);
    const departmentText = get(row, columns.department);
    if (!regNumber || !firstName || !lastName) { errors.push(`Row ${line}: registration number and full student name are required.`); return; }
    if (seen.has(regNumber)) { errors.push(`Row ${line}: duplicate registration number ${regNumber}.`); return; }
    const college = allowedColleges.get(normalize(collegeText));
    if (!college) { errors.push(`Row ${line}: college “${collegeText}” is not in the UniVote list.`); return; }
    const school = college.schools.find((candidate) => normalize(candidate.name) === normalize(schoolText));
    if (!school) { errors.push(`Row ${line}: school/faculty “${schoolText}” does not belong to ${college.name}.`); return; }
    const department = school.departments.find((candidate) => normalize(candidate.name) === normalize(departmentText));
    if (!department) { errors.push(`Row ${line}: department “${departmentText}” does not belong to ${school.name}.`); return; }
    if (!allowedCampuses.has(normalize(campus)) || !college.campuses.some((value) => normalize(value) === normalize(campus))) { errors.push(`Row ${line}: campus “${campus}” is not a campus for ${college.name}.`); return; }
    const statusText = get(row, columns.enrolment);
    const status = (["Active", "Deferred", "Suspended", "Graduated", "Withdrawn"] as const).find((value) => normalize(value) === normalize(statusText));
    if (statusText && !status) { errors.push(`Row ${line}: invalid enrolment status “${statusText}”.`); return; }
    const gpaText = get(row, columns.cumulativeGpa);
    const cumulativeGpa = gpaText ? Number(gpaText) : undefined;
    if (gpaText && (cumulativeGpa === undefined || !Number.isFinite(cumulativeGpa) || cumulativeGpa < 0 || cumulativeGpa > 4)) { errors.push(`Row ${line}: cumulative GPA must be between 0 and 4.`); return; }
    const disciplineText = get(row, columns.openDisciplinaryCase).toLowerCase();
    const openDisciplinaryCase = disciplineText ? ["yes", "true", "1", "open"].includes(disciplineText) : undefined;
    if (disciplineText && !["yes", "true", "1", "open", "no", "false", "0", "none"].includes(disciplineText)) { errors.push(`Row ${line}: disciplinary case must be Yes or No.`); return; }
    const dob = get(row, columns.dateOfBirth);
    const start = get(row, columns.studyStart);
    const end = get(row, columns.studyEnd);
    const genderValue = get(row, columns.gender).toUpperCase();
    const currentYearText = get(row, columns.currentYear);
    const studyYearText = get(row, columns.yearOfStudy) || (/^\s*(?:year\s*)?\d{1,2}\s*$/i.test(currentYearText) ? currentYearText : "");
    const parsedYearOfStudy = Number(studyYearText.match(/\d+/)?.[0]);
    if (studyYearText && (!Number.isInteger(parsedYearOfStudy) || parsedYearOfStudy < 1 || parsedYearOfStudy > 5)) { errors.push(`Row ${line}: year of study must be between 1 and 5.`); return; }
    const academicYearParts = currentYearText.match(/^(\d{4})\s*\/\s*(\d{2}|\d{4})$/);
    const currentAcademicYear = academicYearParts ? `${academicYearParts[1]}/${academicYearParts[2].length === 2 ? `${academicYearParts[1].slice(0, 2)}${academicYearParts[2]}` : academicYearParts[2]}` : "";
    seen.add(regNumber);
    students.push({
      regNumber,
      firstName,
      lastName,
      gender: genderValue === "F" ? "F" : genderValue === "M" ? "M" : "",
      dateOfBirth: dob,
      email: get(row, columns.email),
      collegeCode: college.code,
      college: college.name,
      school: school.name,
      department: department.name,
      programme: get(row, columns.programme) || department.name,
      campus: college.campuses.find((value) => normalize(value) === normalize(campus))!,
      level: normalize(get(row, columns.level)) === "postgraduate" ? "Postgraduate" : normalize(get(row, columns.level)) === "undergraduate" ? "Undergraduate" : "",
      yearOfStudy: Number.isFinite(parsedYearOfStudy) && parsedYearOfStudy > 0 ? parsedYearOfStudy : 0,
      enrolment: status ?? "Active",
      registeredAcademicYear: get(row, columns.registeredAcademicYear) || currentAcademicYear || academicYear.label,
      studyStart: start || academicYear.start,
      studyEnd: end || academicYear.end,
      ...(cumulativeGpa !== undefined ? { cumulativeGpa } : {}),
      ...(openDisciplinaryCase !== undefined ? { openDisciplinaryCase } : {}),
    });
  });
  return { students, errors };
}

export function registryFromRows(rows: string[][]): { students: RegistryStudent[]; errors: string[] } {
  const [header, ...data] = rows;
  const errors: string[] = [];
  if (!header) return { students: [], errors: ["The file is empty."] };
  const idx = (k: string) => header.findIndex((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase() === k.toLowerCase());
  const required: (keyof RegistryStudent)[] = ["regNumber", "firstName", "lastName", "dateOfBirth", "school", "campus", "enrolment", "registeredAcademicYear", "studyEnd"];
  const missing = required.filter((k) => idx(k) < 0);
  if (missing.length) return { students: [], errors: [`Missing columns: ${missing.join(", ")}.`] };

  const students: RegistryStudent[] = [];
  const seen = new Set<string>();
  data.forEach((r, i) => {
    const get = (k: keyof RegistryStudent) => (idx(k) >= 0 ? (r[idx(k)] ?? "").trim() : "");
    const line = i + 2;
    const enrolment = get("enrolment") as EnrolmentStatus;
    const regNumber = get("regNumber").toUpperCase();
    const yearOfStudyText = get("yearOfStudy");
    const yearOfStudy = yearOfStudyText ? Number(yearOfStudyText) : 0;
    if (!regNumber) return errors.push(`Row ${line}: missing regNumber.`);
    if (seen.has(regNumber)) return errors.push(`Row ${line}: duplicate regNumber ${regNumber}.`);
    if (!get("firstName") || !get("lastName")) return errors.push(`Row ${line}: firstName and lastName are required.`);
    if (!isIsoDate(get("dateOfBirth"))) return errors.push(`Row ${line}: dateOfBirth must be a valid YYYY-MM-DD date.`);
    if (!STATUSES.includes(enrolment)) return errors.push(`Row ${line}: enrolment must be one of ${STATUSES.join(", ")}.`);
    if (!get("registeredAcademicYear")) return errors.push(`Row ${line}: registeredAcademicYear is required.`);
    if (!isIsoDate(get("studyEnd"))) return errors.push(`Row ${line}: studyEnd must be a valid YYYY-MM-DD date.`);
    if (yearOfStudyText && (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 5)) return errors.push(`Row ${line}: yearOfStudy must be an integer from 1 to 5.`);
    if (!get("school") || !get("campus")) return errors.push(`Row ${line}: school and campus are required.`);
    seen.add(regNumber);
    const school = get("school");
    const college = urColleges.find((c) => c.code === get("collegeCode") || c.schools.some((s) => s.name === school));
    students.push({
      regNumber,
      firstName: get("firstName"),
      lastName: get("lastName"),
      gender: get("gender") === "F" ? "F" : "M",
      dateOfBirth: get("dateOfBirth"),
      email: get("email"),
      collegeCode: college?.code ?? get("collegeCode"),
      college: college?.name ?? get("college"),
      school,
      department: get("department"),
      programme: get("programme") || get("department"),
      campus: get("campus"),
      level: get("level") === "Postgraduate" ? "Postgraduate" : "Undergraduate",
      yearOfStudy,
      enrolment,
      registeredAcademicYear: get("registeredAcademicYear"),
      studyStart: get("studyStart") || get("studyEnd"),
      studyEnd: get("studyEnd"),
    });
  });
  return { students, errors };
}

export function registryFromRegistrationNumbers(
  rows: string[][],
  columnIndex: number,
  firstDataRow: number,
  academicYear: string,
): RegistryStudent[] {
  const records = new Map<string, RegistryStudent>();
  const data = rows.slice(firstDataRow);
  for (const row of data) {
    const regNumber = (row[columnIndex] ?? "").trim().toUpperCase();
    if (!regNumber || records.has(regNumber)) continue;
    records.set(regNumber, {
      regNumber,
      firstName: "Testing student",
      lastName: regNumber,
      gender: "M",
      dateOfBirth: "",
      email: `test-${regNumber.replace(/[^A-Z0-9]/g, "").toLowerCase()}@testing.univote.local`,
      collegeCode: "",
      college: "Testing",
      school: "Testing",
      department: "Testing",
      programme: "Testing",
      campus: "Testing",
      level: "Undergraduate",
      yearOfStudy: 1,
      enrolment: "Active",
      registeredAcademicYear: academicYear,
      studyStart: "2000-01-01",
      studyEnd: "9999-12-31",
      testingImport: true,
    });
  }
  return [...records.values()];
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
