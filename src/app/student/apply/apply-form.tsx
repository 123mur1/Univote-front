"use client";

import { useState } from "react";
import Link from "next/link";
import {
  currentStudent,
  currentStudentRecord,
  electionFaculty,
  elections,
  studentRecordFor,
  type ApplicationDocument,
  type CandidateApplication,
} from "@/lib/data";
import { MAX_UPLOAD_BYTES, fileToDataUrl, formatSize, isPdf } from "@/lib/files";
import { fullName } from "@/lib/registry";
import { addSubmission } from "@/lib/review-store";
import { logActivity } from "@/lib/activity";
import { readSession } from "@/lib/session";
import { useCurrentStudent } from "@/lib/student-context";
import { CandidatePhoto, Card, btn, input, label } from "@/components/ui";
import { AlertIcon, CheckCircleIcon, CheckIcon } from "@/components/icons";

const MANIFESTO_LIMIT = 600;

type Upload = { file: string; size: string; fileName: string };
type DocKind = ApplicationDocument["kind"];

const requiredDocs: { kind: DocKind; name: string; hint: string; accept: string }[] = [
  { kind: "photo", name: "Candidate photo", hint: "Clear, recent passport-style photo. Voters see it on the ballot.", accept: "image/png,image/jpeg,image/webp" },
  { kind: "cv", name: "Curriculum vitae (CV)", hint: "Upload your current CV as an image or PDF.", accept: "image/*,application/pdf" },
  { kind: "cover-letter", name: "Cover letter", hint: "Explain why you are applying for this position and what you would bring.", accept: "image/*,application/pdf" },
];

// Sample files for trying the flow without real documents.
const sampleDocs: Record<DocKind, Upload> = {
  photo: { file: "/candidates/sample-applicant.svg", size: "184 KB", fileName: "photo.jpg" },
  cv: { file: "/documents/sample-cv.svg", size: "412 KB", fileName: "cv.pdf" },
  "cover-letter": { file: "/documents/sample-cover-letter.svg", size: "305 KB", fileName: "cover-letter.pdf" },
};

export function ApplyForm() {
  const { record } = useCurrentStudent();
  const me = record
    ? { name: fullName(record), studentId: record.regNumber, faculty: record.school, program: record.programme || record.department, year: record.yearOfStudy ? `Year ${record.yearOfStudy}` : "Not supplied", email: record.email }
    : currentStudent;
  const meRecord = record ? studentRecordFor(record) : currentStudentRecord;
  const nominating = elections.filter((e) => e.status === "upcoming");
  const [electionId, setElectionId] = useState(nominating[0]?.id ?? "");
  const election = nominating.find((e) => e.id === electionId);
  const [contestId, setContestId] = useState(election?.contests[0]?.id ?? "");
  const contest = election?.contests.find((c) => c.id === contestId) ?? election?.contests[0];

  const [phone, setPhone] = useState("");
  const [slogan, setSlogan] = useState("");
  const [manifesto, setManifesto] = useState("");
  const [uploads, setUploads] = useState<Partial<Record<DocKind, Upload>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<DocKind, string>>>({});
  const [busy, setBusy] = useState<DocKind | null>(null);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const faculty = election ? electionFaculty(election) : undefined;
  const wrongFaculty = faculty && faculty !== me.faculty;
  const missingDocs = requiredDocs.filter((d) => !uploads[d.kind]);

  async function onFile(kind: DocKind, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadErrors((x) => ({ ...x, [kind]: undefined }));
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadErrors((x) => ({ ...x, [kind]: "Files must be 5 MB or smaller." }));
      return;
    }
    if (kind === "photo" && !file.type.startsWith("image/")) {
      setUploadErrors((x) => ({ ...x, [kind]: "The photo must be an image (JPG, PNG or WebP)." }));
      return;
    }
    setBusy(kind);
    try {
      const data = await fileToDataUrl(file, kind === "photo" ? 600 : 1400);
      setUploads((x) => ({ ...x, [kind]: { file: data, size: formatSize(file.size), fileName: file.name } }));
    } catch (err) {
      setUploadErrors((x) => ({ ...x, [kind]: err instanceof Error ? err.message : "Could not read this file." }));
    } finally {
      setBusy(null);
    }
  }

  function fillSample() {
    setUploads(sampleDocs);
    setUploadErrors({});
    setPhone((p) => p || "+250 788 123 456");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!election || !contest) return;
    if (missingDocs.length > 0) {
      setFormError(`Upload all required documents: ${missingDocs.map((d) => d.name.toLowerCase()).join(", ")}.`);
      return;
    }
    const now = new Date();
    const uploaded = now.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const id = `sub-${now.getTime()}`;
    const documents: ApplicationDocument[] = requiredDocs.map((d) => ({
      id: `${id}-${d.kind}`,
      kind: d.kind,
      name: d.name,
      file: uploads[d.kind]!.file,
      size: uploads[d.kind]!.size,
      uploaded,
    }));
    const application: CandidateApplication = {
      id,
      name: me.name,
      studentId: me.studentId,
      contest: contest.title,
      election: election.title,
      electionFaculty: faculty,
      submitted: now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      status: "pending",
      photo: uploads.photo!.file,
      email: me.email,
      phone,
      slogan,
      manifesto,
      declared: {
        name: me.name,
        studentId: me.studentId,
        faculty: me.faculty,
        program: me.program,
        year: me.year,
      },
      registry: meRecord,
      documents,
    };
    const error = addSubmission(application);
    if (error) {
      setFormError(error);
      return;
    }
    logActivity({ actor: readSession()?.regNumber ?? me.studentId, role: "student", type: "nomination", severity: "info", detail: `Submitted nomination for ${me.name} to ${contest.title}.`, before: "No nomination submitted", after: "Nomination submitted for officer review" });
    setSubmitted(true);
  }

  const preview = (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <CandidatePhoto name={me.name} photo={uploads.photo?.file} size="xl" />
        <div>
          <h3 className="font-semibold">{me.name}</h3>
          <p className="text-xs text-slate-500">{me.program} · {me.year}</p>
          {contest && <p className="mt-1 text-xs font-medium text-urblue">{contest.title}</p>}
        </div>
      </div>
      <p className="mt-4 border-l-2 border-urblue pl-3 text-sm leading-relaxed text-slate-700">
        {manifesto || <span className="text-slate-400">Your manifesto will appear here.</span>}
      </p>
    </Card>
  );

  if (submitted) {
    return (
      <Card className="max-w-xl p-8">
        <CheckCircleIcon width={40} height={40} className="text-urblue" />
        <h2 className="mt-4 text-xl font-bold">Nomination submitted for review</h2>
        <p className="mt-2 text-sm text-slate-600">
          Your nomination for <strong>{contest?.title}</strong> in {election?.title} has been sent to the
          Electoral Commission. An election officer will verify your documents and details, then approve or
          reject it. You can follow the status on your dashboard.
        </p>
        <div className="mt-5">{preview}</div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/student" className={btn.primary}>Track status on dashboard</Link>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card className="space-y-5 p-6">
          <h2 className="font-semibold">Position</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="election" className={label}>Election</label>
              <select
                id="election"
                value={electionId}
                onChange={(e) => {
                  setElectionId(e.target.value);
                  setContestId(nominating.find((x) => x.id === e.target.value)?.contests[0]?.id ?? "");
                }}
                className={input}
              >
                {nominating.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="contest" className={label}>Position</label>
              <select id="contest" value={contestId} onChange={(e) => setContestId(e.target.value)} className={input} required>
                {election?.contests.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>
          {wrongFaculty && (
            <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertIcon width={18} height={18} className="shrink-0" />
              This election is for the Faculty of {faculty}. You are in {me.faculty}, so the officer will
              have to reject it. Choose a university-wide election instead.
            </p>
          )}
        </Card>

        <Card className="space-y-5 p-6">
          <h2 className="font-semibold">Your details</h2>
          <div>
            <label htmlFor="phone" className={label}>Phone number</label>
            <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={input} placeholder="+250 7xx xxx xxx" required />
          </div>
          <div>
            <label htmlFor="slogan" className={label}>Campaign slogan</label>
            <input id="slogan" value={slogan} onChange={(e) => setSlogan(e.target.value)} className={input} maxLength={80} placeholder="A short line voters will remember" required />
          </div>
          <div>
            <label htmlFor="manifesto" className={label}>Manifesto</label>
            <textarea
              id="manifesto"
              rows={6}
              value={manifesto}
              onChange={(e) => setManifesto(e.target.value.slice(0, MANIFESTO_LIMIT))}
              className={input}
              placeholder="What will you do if elected?"
              required
            />
            <p className="mt-1 text-right text-xs text-slate-500">{manifesto.length}/{MANIFESTO_LIMIT}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Supporting documents</h2>
              <p className="text-sm text-slate-500">The election officer checks these before approving you. Images or PDF, up to 5 MB each.</p>
            </div>
            <button type="button" onClick={fillSample} className="text-sm font-semibold text-urblue hover:underline">
              Use sample documents
            </button>
          </div>
          <ul className="mt-5 space-y-3">
            {requiredDocs.map((d) => {
              const up = uploads[d.kind];
              const err = uploadErrors[d.kind];
              return (
                <li key={d.kind} className={`flex flex-col gap-3 rounded-xl border-2 p-4 sm:flex-row sm:items-center ${up ? "border-emerald-200" : err ? "border-red-200" : "border-dashed border-slate-200"}`}>
                  <div className="flex flex-1 items-center gap-3">
                    <DocThumb upload={up} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{d.name} <span className="text-red-600">*</span></p>
                      <p className={`text-xs ${err ? "text-red-600" : "text-slate-500"}`}>
                        {err ?? (up ? `${up.fileName} · ${up.size}` : d.hint)}
                      </p>
                    </div>
                  </div>
                  <label className={`${up ? btn.secondary : btn.primary} cursor-pointer`}>
                    {busy === d.kind ? "Processing…" : up ? "Replace" : "Upload"}
                    <input type="file" accept={d.accept} onChange={(e) => onFile(d.kind, e)} className="sr-only" disabled={busy !== null} />
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-6">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input type="checkbox" required className="mt-0.5 size-4 accent-urblue" />
            I have read the election rules and campaign code of conduct, and the information and documents above are true.
          </label>
          {formError && (
            <p role="alert" className="mt-4 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertIcon width={18} height={18} className="shrink-0" /> {formError}
            </p>
          )}
          <button type="submit" className={`${btn.primary} mt-5`} disabled={busy !== null}>
            Submit nomination for review
          </button>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">How voters will see you</h2>
          {preview}
        </div>
        <Card className="p-6">
          <h2 className="font-semibold">Applying as</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-slate-500">Name</dt><dd className="font-medium">{me.name}</dd></div>
            <div><dt className="text-slate-500">Student ID</dt><dd className="font-mono">{me.studentId}</dd></div>
            <div><dt className="text-slate-500">Programme</dt><dd>{me.program}, {me.year}</dd></div>
          </dl>
        </Card>
        <Card className="bg-urblue-50 p-6">
          <h2 className="font-semibold text-urblue">How your nomination is reviewed</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-700">
            {[
              "An election officer opens each document and verifies it.",
              "Your details are compared with the registrar's record.",
              "Eligibility is checked against the registry record, including enrolment, academic standing and faculty.",
              "The officer approves or rejects with a reason. You see the result on your dashboard.",
            ].map((s) => (
              <li key={s} className="flex gap-2">
                <CheckIcon width={16} height={16} className="mt-0.5 shrink-0 text-urblue" /> {s}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </form>
  );
}

function DocThumb({ upload }: { upload?: Upload }) {
  if (!upload) {
    return <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">—</span>;
  }
  if (isPdf(upload.file)) {
    return <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-md bg-red-50 text-xs font-bold text-red-700 ring-1 ring-red-100">PDF</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- local data: URL preview, nothing to optimize
    <img src={upload.file} alt="" className="h-14 w-12 shrink-0 rounded-md object-cover object-top ring-1 ring-slate-200" />
  );
}
