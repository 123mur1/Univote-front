import type { ElectionScope, RegistryStudent } from "./registry";
import { fullName, seedRegistry } from "./registry";
import { eligibleFor, simulatedVoted } from "./participation";
import { demoMode } from "./runtime-mode";

export type ElectionStatus = "upcoming" | "open" | "closed" | "published";

export type Candidate = {
  id: string;
  name: string;
  photo?: string;
  program: string;
  year: string;
  manifesto: string;
  votes?: number;
};

export type Contest = {
  id: string;
  title: string;
  description: string;
  candidates: Candidate[];
};

export type Election = {
  id: string;
  title: string;
  scope: string;
  // Who may vote, checked exactly against the registry record.
  eligibility: ElectionScope;
  closesOn: string; // ISO date; students must still be within their study period on this day
  nominationsClose?: string;
  status: ElectionStatus;
  opens: string;
  closes: string;
  opensAtIso?: string;
  closesAtIso?: string;
  eligibleVoters: number;
  ballotsCast: number;
  contests: Contest[];
  resultHash?: string;
  bulletinRoot?: string;
  publicKey?: string;
};

export type AuditEntry = {
  seq: number;
  time: string;
  actor: string;
  role: "System" | "Election Officer" | "Administrator" | "Auditor" | "Voter";
  action: string;
  hash: string;
  prevHash: string;
};

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type ApplicationDocument = {
  id: string;
  kind: "photo" | "cv" | "cover-letter";
  name: string;
  file: string;
  size: string;
  uploaded: string;
  reviewStatus?: "verified" | "flagged";
  reviewNote?: string;
};

// What the student entered on the form, checked against the registrar record.
export type StudentRecord = {
  name: string;
  studentId: string;
  faculty: string;
  program: string;
  year: string;
  enrolment: "Active" | "Suspended" | "Deferred";
  gpa: number;
  disciplinaryCase: boolean;
};

export type CandidateApplication = {
  id: string;
  name: string;
  studentId: string;
  contest: string;
  electionId?: string;
  election: string;
  electionFaculty?: string;
  electionEligibility?: ElectionScope;
  candidateLocation?: Pick<RegistryStudent, "collegeCode" | "college" | "school" | "department" | "campus" | "yearOfStudy">;
  submitted: string;
  status: ApplicationStatus;
  decisionNote?: string;
  photo?: string;
  email: string;
  phone: string;
  slogan: string;
  manifesto: string;
  declared: Omit<StudentRecord, "enrolment" | "disciplinaryCase" | "gpa">;
  registry: StudentRecord;
  documents: ApplicationDocument[];
  apiManaged?: boolean;
};

export const MIN_CANDIDATE_GPA = 2.5;


// Deterministic pseudo-hash so the mock data looks like real SHA-256 output.
export function mockHash(seed: string) {
  let h1 = 0x811c9dc5;
  let out = "";
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < seed.length; i++) {
      h1 ^= seed.charCodeAt(i) + round * 31;
      h1 = Math.imul(h1, 0x01000193) >>> 0;
    }
    out += h1.toString(16).padStart(8, "0");
  }
  return out;
}

export function shortHash(hash: string, size = 10) {
  return `${hash.slice(0, size)}…${hash.slice(-4)}`;
}

const demoElections: Election[] = [
  {
    id: "sug-2026",
    title: "Student Union General Elections 2026",
    scope: "University-wide",
    eligibility: { level: "university" },
    closesOn: "2026-11-05",
    status: "open",
    opens: "3 Nov 2026, 08:00",
    closes: "5 Nov 2026, 18:00",
    eligibleVoters: 12480,
    ballotsCast: 5214,
    contests: [
      {
        id: "president",
        title: "President",
        description: "Leads the Student Union and represents students on the University Council.",
        candidates: [
          {
            id: "c1",
            photo: "/candidates/c1.svg",
            name: "Amina Uwase",
            program: "BSc Computer Science",
            year: "Year 3",
            manifesto: "Open budgets, 24-hour library access and a student welfare hotline.",
          },
          {
            id: "c2",
            photo: "/candidates/c2.svg",
            name: "Jean-Paul Habimana",
            program: "LLB Law",
            year: "Year 4",
            manifesto: "Fair academic appeals, legal aid clinic for students and transparent fees.",
          },
          {
            id: "c3",
            photo: "/candidates/c3.svg",
            name: "Grace Mutoni",
            program: "BBA Finance",
            year: "Year 3",
            manifesto: "Internship partnerships, campus jobs and affordable meal plans.",
          },
        ],
      },
      {
        id: "vice-president",
        title: "Vice President",
        description: "Supports the President and coordinates faculty representatives.",
        candidates: [
          {
            id: "c4",
            photo: "/candidates/c4.svg",
            name: "Eric Nshimiyimana",
            program: "BEng Civil Engineering",
            year: "Year 3",
            manifesto: "Safer hostels, better lighting and reliable campus transport.",
          },
          {
            id: "c5",
            photo: "/candidates/c5.svg",
            name: "Diane Ingabire",
            program: "BA Mass Communication",
            year: "Year 2",
            manifesto: "Weekly town halls and a student newsletter on union decisions.",
          },
        ],
      },
      {
        id: "secretary-general",
        title: "Secretary General",
        description: "Keeps union records and publishes meeting minutes.",
        candidates: [
          {
            id: "c6",
            photo: "/candidates/c6.svg",
            name: "Patrick Mugisha",
            program: "BSc Statistics",
            year: "Year 3",
            manifesto: "All minutes online within 48 hours of every meeting.",
          },
          {
            id: "c7",
            photo: "/candidates/c7.svg",
            name: "Claudine Uwimana",
            program: "BA Education",
            year: "Year 4",
            manifesto: "A searchable archive of union resolutions since 2020.",
          },
        ],
      },
      {
        id: "finance",
        title: "Finance Secretary",
        description: "Manages the union budget and reports spending each term.",
        candidates: [
          {
            id: "c8",
            photo: "/candidates/c8.svg",
            name: "Kevin Ndayisaba",
            program: "BCom Accounting",
            year: "Year 4",
            manifesto: "Quarterly published accounts and an independent audit every year.",
          },
          {
            id: "c9",
            photo: "/candidates/c9.svg",
            name: "Sandrine Umutoni",
            program: "BSc Economics",
            year: "Year 3",
            manifesto: "Club funding by open application with published criteria.",
          },
        ],
      },
    ],
  },
  {
    id: "sci-assoc-2026",
    title: "School of Science Students' Association 2026",
    scope: "School of Science",
    eligibility: { level: "school", value: "School of Science" },
    closesOn: "2026-11-07",
    status: "open",
    opens: "4 Nov 2026, 08:00",
    closes: "7 Nov 2026, 17:00",
    eligibleVoters: 1840,
    ballotsCast: 612,
    contests: [
      {
        id: "sci-president",
        title: "Association President",
        description: "Leads the School of Science Students' Association and sits on the School Council.",
        candidates: [
          { id: "c14", name: "Amina Uwase", photo: "/candidates/c14.svg", program: "Mathematics", year: "Year 3", manifesto: "Open lab hours for every department and a peer tutoring scheme for first years." },
          { id: "c15", name: "Patrick Nshuti", photo: "/candidates/c15.svg", program: "Physics", year: "Year 3", manifesto: "Field trips each semester and a science fair open to the whole university." },
        ],
      },
      {
        id: "sci-academic",
        title: "Academic Affairs Secretary",
        description: "Represents students on exams, timetables and course quality.",
        candidates: [
          { id: "c16", name: "Divine Umutoni", photo: "/candidates/c16.svg", program: "Chemistry", year: "Year 2", manifesto: "Exam timetables published four weeks ahead, with no clashes." },
          { id: "c17", name: "Yves Irakoze", photo: "/candidates/c17.svg", program: "Biology", year: "Year 4", manifesto: "Course feedback results shared with students every term." },
        ],
      },
    ],
  },
  {
    id: "eng-reps-2026",
    title: "School of Engineering Representatives 2026",
    scope: "School of Engineering",
    eligibility: { level: "school", value: "School of Engineering" },
    closesOn: "2026-11-18",
    status: "upcoming",
    opens: "17 Nov 2026, 08:00",
    closes: "18 Nov 2026, 17:00",
    eligibleVoters: 2310,
    ballotsCast: 0,
    contests: [
      {
        id: "faculty-rep",
        title: "School Representative",
        description: "Represents engineering students at the School Board.",
        candidates: [
          {
            id: "c10",
            photo: "/candidates/c10.svg",
            name: "Olivier Kayitare",
            program: "BEng Electrical Engineering",
            year: "Year 3",
            manifesto: "Lab access on weekends and updated equipment.",
          },
          {
            id: "c11",
            photo: "/candidates/c11.svg",
            name: "Ange Uwera",
            program: "BEng Mechanical Engineering",
            year: "Year 2",
            manifesto: "Mentoring between senior and first-year students.",
          },
        ],
      },
    ],
  },
  {
    id: "halls-2026",
    title: "Halls of Residence Council 2026",
    scope: "University-wide",
    eligibility: { level: "university" },
    closesOn: "2026-11-25",
    status: "upcoming",
    opens: "24 Nov 2026, 08:00",
    closes: "25 Nov 2026, 17:00",
    eligibleVoters: 12480,
    ballotsCast: 0,
    contests: [
      {
        id: "halls-president",
        title: "Halls Council President",
        description: "Represents residents to university housing and chairs the halls council.",
        candidates: [],
      },
      {
        id: "welfare-officer",
        title: "Welfare Officer",
        description: "Handles residents' welfare, safety and accommodation complaints.",
        candidates: [],
      },
    ],
  },
  {
    id: "by-election-2026",
    title: "Student Union By-Election 2026",
    scope: "University-wide",
    eligibility: { level: "university" },
    closesOn: "2026-05-13",
    status: "published",
    opens: "12 May 2026, 08:00",
    closes: "13 May 2026, 18:00",
    eligibleVoters: 11950,
    ballotsCast: 6873,
    resultHash: mockHash("by-election-2026-results"),
    bulletinRoot: mockHash("by-election-2026-bulletin"),
    contests: [
      {
        id: "sports",
        title: "Sports & Culture Secretary",
        description: "Coordinates sports teams, cultural events and inter-university games.",
        candidates: [
          {
            id: "c12",
            photo: "/candidates/c12.svg",
            name: "Yves Niyonzima",
            program: "BSc Sports Science",
            year: "Year 3",
            manifesto: "More inter-faculty tournaments and an annual culture week.",
            votes: 3912,
          },
          {
            id: "c13",
            photo: "/candidates/c13.svg",
            name: "Alice Mukamana",
            program: "BA Music",
            year: "Year 2",
            manifesto: "Funding for student bands, drama and art clubs.",
            votes: 2689,
          },
        ],
      },
    ],
  },
];

// Open and upcoming elections take their electorate and turnout from the registry, so the numbers on
// every page agree with who can actually vote. Published results keep their certified figures.
for (const e of demoElections) {
  if (e.status === "published") continue;
  const electorate = seedRegistry.filter((s) => eligibleFor(s, e));
  e.eligibleVoters = electorate.length;
  e.ballotsCast = e.status === "open" ? electorate.filter((s) => simulatedVoted(s.regNumber, e.id)).length : 0;
}

export const elections: Election[] = demoMode ? demoElections : [];

export function staticParamsFor(ids: string[]) {
  return ids.length ? ids.map((id) => ({ id })) : [{ id: "__univote_dynamic__" }];
}

export function getElection(id: string) {
  return elections.find((e) => e.id === id);
}

// The academic unit an election is limited to, if any (used for candidate eligibility).
export function electionFaculty(e: Election) {
  return e.eligibility.level === "university" ? undefined : e.eligibility.value;
}

export const auditLog: AuditEntry[] = (() => {
  const raw: Omit<AuditEntry, "seq" | "hash" | "prevHash">[] = [
    { time: "2026-10-01 09:12:04", actor: "registrar.sync", role: "System", action: "Voter roll imported from registry (12,480 eligible students)" },
    { time: "2026-10-01 09:15:40", actor: "j.kamanzi", role: "Election Officer", action: "Created election “Student Union General Elections 2026”" },
    { time: "2026-10-14 16:02:11", actor: "j.kamanzi", role: "Election Officer", action: "Approved 9 candidate nominations across 4 contests" },
    { time: "2026-10-20 10:30:00", actor: "commission", role: "Auditor", action: "Election public key published (2-of-3 threshold trustees)" },
    { time: "2026-11-02 18:00:00", actor: "a.mukiza", role: "Administrator", action: "Ballot configuration locked; changes now require commission sign-off" },
    { time: "2026-11-03 08:00:00", actor: "scheduler", role: "System", action: "Voting opened for “Student Union General Elections 2026”" },
    { time: "2026-11-03 08:41:27", actor: "auth.service", role: "System", action: "Blocked 3 repeated login attempts for one student ID (rate limit)" },
    { time: "2026-11-03 10:05:13", actor: "bulletin", role: "System", action: "Bulletin board checkpoint: 2,906 encrypted ballots" },
    { time: "2026-11-03 12:00:00", actor: "bulletin", role: "System", action: "Bulletin board checkpoint: 5,214 encrypted ballots" },
  ];
  let prev = "0".repeat(64);
  return demoMode ? raw.map((entry, i) => {
    const hash = mockHash(`${prev}|${entry.time}|${entry.actor}|${entry.action}`);
    const row = { ...entry, seq: i + 1, hash, prevHash: prev };
    prev = hash;
    return row;
  }) : [];
})();

const demoApplications: CandidateApplication[] = (() => {
  const election = "School of Engineering Representatives 2026";
  const contest = "School Representative";
  const docs = (id: string, photo: string, uploaded: string): ApplicationDocument[] => [
    { id: `${id}-photo`, kind: "photo", name: "Candidate photo", file: photo, size: "184 KB", uploaded },
    { id: `${id}-cv`, kind: "cv", name: "Curriculum vitae (CV)", file: "/documents/sample-cv.svg", size: "412 KB", uploaded },
    { id: `${id}-cover-letter`, kind: "cover-letter", name: "Cover letter", file: "/documents/sample-cover-letter.svg", size: "305 KB", uploaded },
  ];

  const rows: CandidateApplication[] = [
    {
      id: "app-1",
      name: "Olivier Kayitare",
      studentId: "2023/ENG/0412",
      contest,
      election,
      electionFaculty: "School of Engineering",
      submitted: "28 Oct 2026",
      status: "approved",
      decisionNote: "All documents verified against registry.",
      photo: "/candidates/c10.svg",
      email: "o.kayitare@students.univ.edu",
      phone: "+250 788 410 221",
      slogan: "Labs open when you need them",
      manifesto: "Lab access on weekends and updated equipment.",
      declared: { name: "Olivier Kayitare", studentId: "2023/ENG/0412", faculty: "School of Engineering", program: "BEng Electrical Engineering", year: "Year 3" },
      registry: { name: "Olivier Kayitare", studentId: "2023/ENG/0412", faculty: "School of Engineering", program: "BEng Electrical Engineering", year: "Year 3", enrolment: "Active", gpa: 3.4, disciplinaryCase: false },
      documents: docs("app-1", "/candidates/c10.svg", "28 Oct 2026, 14:02"),
    },
    {
      id: "app-2",
      name: "Ange Uwera",
      studentId: "2024/ENG/0178",
      contest,
      election,
      electionFaculty: "School of Engineering",
      submitted: "29 Oct 2026",
      status: "approved",
      decisionNote: "Eligible. Documents complete.",
      photo: "/candidates/c11.svg",
      email: "a.uwera@students.univ.edu",
      phone: "+250 789 552 019",
      slogan: "Seniors helping freshers",
      manifesto: "Mentoring between senior and first-year students.",
      declared: { name: "Ange Uwera", studentId: "2024/ENG/0178", faculty: "School of Engineering", program: "BEng Mechanical Engineering", year: "Year 2" },
      registry: { name: "Ange Uwera", studentId: "2024/ENG/0178", faculty: "School of Engineering", program: "BEng Mechanical Engineering", year: "Year 2", enrolment: "Active", gpa: 3.1, disciplinaryCase: false },
      documents: docs("app-2", "/candidates/c11.svg", "29 Oct 2026, 09:47"),
    },
    {
      id: "app-3",
      name: "Samuel Rukundo",
      studentId: "2023/ENG/0907",
      contest,
      election,
      electionFaculty: "School of Engineering",
      submitted: "30 Oct 2026",
      status: "pending",
      photo: "/candidates/app-3.svg",
      email: "s.rukundo@students.univ.edu",
      phone: "+250 785 300 774",
      slogan: "Your voice at the School Board",
      manifesto: "Publish School Board decisions within a week, push for fair exam timetables and run a termly feedback survey for every engineering programme.",
      declared: { name: "Samuel Rukundo", studentId: "2023/ENG/0907", faculty: "School of Engineering", program: "BEng Civil Engineering", year: "Year 3" },
      registry: { name: "Samuel Rukundo", studentId: "2023/ENG/0907", faculty: "School of Engineering", program: "BEng Civil Engineering", year: "Year 3", enrolment: "Active", gpa: 3.0, disciplinaryCase: false },
      documents: docs("app-3", "/candidates/app-3.svg", "30 Oct 2026, 16:21"),
    },
    {
      id: "app-4",
      name: "Belyse Iradukunda",
      studentId: "2025/ENG/0033",
      contest,
      election,
      electionFaculty: "School of Engineering",
      submitted: "31 Oct 2026",
      status: "pending",
      photo: "/candidates/app-4.svg",
      email: "b.iradukunda@students.univ.edu",
      phone: "+250 782 118 465",
      slogan: "First years deserve a seat too",
      manifesto: "A first-year orientation week run by students, study groups for core maths courses and a clear guide to choosing specialisations.",
      declared: { name: "Belyse Iradukunda", studentId: "2025/ENG/0033", faculty: "School of Engineering", program: "BEng Software Engineering", year: "Year 2" },
      registry: { name: "Belyse Iradukunda", studentId: "2025/ENG/0033", faculty: "School of Engineering", program: "BEng Software Engineering", year: "Year 1", enrolment: "Active", gpa: 2.3, disciplinaryCase: false },
      documents: docs("app-4", "/candidates/app-4.svg", "31 Oct 2026, 11:05"),
    },
    {
      id: "app-5",
      name: "Fabrice Nkurunziza",
      studentId: "2022/ENG/1120",
      contest,
      election,
      electionFaculty: "School of Engineering",
      submitted: "1 Nov 2026",
      status: "rejected",
      decisionNote: "Candidate has an open disciplinary case; not eligible under rule 4.2.",
      photo: "/candidates/app-5.svg",
      email: "f.nkurunziza@students.univ.edu",
      phone: "+250 784 902 337",
      slogan: "Engineering first",
      manifesto: "Better internships and industry visits for final-year students.",
      declared: { name: "Fabrice Nkurunziza", studentId: "2022/ENG/1120", faculty: "School of Engineering", program: "BEng Mining Engineering", year: "Year 4" },
      registry: { name: "Fabrice Nkurunziza", studentId: "2022/ENG/1120", faculty: "School of Engineering", program: "BEng Mining Engineering", year: "Year 4", enrolment: "Active", gpa: 2.9, disciplinaryCase: true },
      documents: docs("app-5", "/candidates/app-5.svg", "1 Nov 2026, 08:30"),
    },
  ];
  return rows;
})();

export const applications: CandidateApplication[] = demoMode ? demoApplications : [];

export function getApplication(id: string) {
  return applications.find((a) => a.id === id);
}

// Demo sign-in accounts for the prototype. The one-time code for every account is DEMO_OTP.
export const DEMO_OTP = "123456";

// Student demo accounts sign in with a registration number that exists in the registry.
const demoAccountData = [
  { role: "student" as const, label: "Student · School of Business", identifier: "2024/BUS/0388", password: "student123", name: "Moses Hakizimana", regNumber: "2024/BUS/0388" },
  { role: "student" as const, label: "Student · School of ICT", identifier: "2023/ICT/0142", password: "student123", name: "Diane Uwineza", regNumber: "2023/ICT/0142" },
  { role: "student" as const, label: "Student · School of Science", identifier: "2023/SCI/0219", password: "student123", name: "Patrick Nshuti", regNumber: "2023/SCI/0219" },
  { role: "student" as const, label: "Graduated student (not eligible)", identifier: "2022/ENG/0077", password: "student123", name: "Eric Mugenzi", regNumber: "2022/ENG/0077" },
  { role: "officer" as const, label: "Election officer", identifier: "officer@ur.ac.rw", password: "officer123", name: "Jeanne Kamanzi" },
  { role: "admin" as const, label: "System administrator (no code)", identifier: "admin", password: "admin123", name: "System Administrator" },
];

export const demoAccounts = demoMode ? demoAccountData : [];

export const DEMO_STUDENT_REG = "2024/BUS/0388";

// GPA comes from academic records, which the demo registry does not carry; derive a stable value.
function demoGpa(regNumber: string) {
  if (regNumber === DEMO_STUDENT_REG) return 3.2;
  return 2.4 + (parseInt(mockHash(regNumber).slice(0, 4), 16) % 15) / 10;
}

// Candidate-review view of a registry record.
export function studentRecordFor(r: RegistryStudent): StudentRecord {
  return {
    name: fullName(r),
    studentId: r.regNumber,
    faculty: r.school,
    program: r.programme || r.department,
    year: r.yearOfStudy ? `Year ${r.yearOfStudy}` : "Not supplied",
    enrolment: r.enrolment === "Active" ? "Active" : r.enrolment === "Deferred" ? "Deferred" : "Suspended",
    gpa: demoGpa(r.regNumber),
    disciplinaryCase: false,
  };
}

const demoStudent = seedRegistry.find((r) => r.regNumber === DEMO_STUDENT_REG)!;

// Fallback student shown before the session loads.
export const currentStudentRecord: StudentRecord = studentRecordFor(demoStudent);

export const currentStudent = {
  name: fullName(demoStudent),
  studentId: demoStudent.regNumber,
  faculty: demoStudent.school,
  program: demoStudent.programme,
  year: `Year ${demoStudent.yearOfStudy}`,
  email: demoStudent.email,
};
