"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, btn, input, label } from "@/components/ui";
import { CheckCircleIcon, PlusIcon, XIcon } from "@/components/icons";
import { logActivity } from "@/lib/activity";
import { readSession } from "@/lib/session";
import { allUrCampuses, urColleges } from "@/lib/ur-structure";
import { addCreatedElection } from "@/lib/election-store";
import type { Election } from "@/lib/data";
import { scopeLabel, type ElectionScope, seedRegistry } from "@/lib/registry";
import { eligibleFor } from "@/lib/participation";

type ContestDraft = { key: number; title: string; seats: number };
type ScopeLevel = "UNIVERSITY" | "CAMPUS" | "COLLEGE" | "SCHOOL" | "DEPARTMENT";

export function NewElectionForm() {
  const [scopeLevel, setScopeLevel] = useState<ScopeLevel>("UNIVERSITY");
  const [campus, setCampus] = useState("");
  const [collegeCode, setCollegeCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [studyLevel, setStudyLevel] = useState("ALL");
  const [contests, setContests] = useState<ContestDraft[]>([{ key: 1, title: "President", seats: 1 }]);
  const [nextKey, setNextKey] = useState(2);
  const [saved, setSaved] = useState(false);
  const [createdElectionId, setCreatedElectionId] = useState("");
  const [formError, setFormError] = useState("");
  const collegesAtCampus = urColleges.filter((college) => college.campuses.includes(campus));
  const selectedCollege = urColleges.find((college) => college.code === collegeCode);
  const selectedSchool = selectedCollege?.schools.find((school) => school.name === schoolName);

  function updateContest(key: number, patch: Partial<ContestDraft>) {
    setContests(contests.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  if (saved) {
    return (
      <Card className="max-w-xl p-8">
        <CheckCircleIcon width={40} height={40} className="text-urblue" />
        <h2 className="mt-4 text-xl font-bold">Election created</h2>
        <p className="mt-2 text-sm text-slate-600">
          Voters can view this election now. Students can submit nominations until the nomination deadline, and voting starts on the scheduled date.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/officer/elections" className={btn.primary}>Back to elections</Link>
          <Link href={`/officer/elections/${createdElectionId}`} className={btn.secondary}>View election</Link>
          <Link href="/student/apply" className={btn.secondary}>Open nominations</Link>
        </div>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const session = readSession();
        const title = String(form.get("title") ?? "Untitled election");
        const opensAt = new Date(String(form.get("opens") ?? ""));
        const closesAt = new Date(String(form.get("closes") ?? ""));
        const nominationsClose = String(form.get("nominations") ?? "");
        const now = new Date();
        if (Number.isNaN(opensAt.getTime()) || Number.isNaN(closesAt.getTime()) || closesAt <= now || opensAt >= closesAt) {
          setFormError("Choose a voting window that starts before it closes and ends in the future.");
          return;
        }
        if (!nominationsClose || new Date(`${nominationsClose}T23:59:59`) < now) {
          setFormError("Choose a nomination deadline today or later so applicants can start.");
          return;
        }
        const yearOfStudy = studyLevel === "ALL" ? undefined : Number(studyLevel);
        const scopeValue = scopeLevel === "UNIVERSITY" ? null : scopeLevel === "CAMPUS" ? campus : scopeLevel === "COLLEGE" ? collegeCode : scopeLevel === "SCHOOL" ? schoolName : departmentName;
        const eligibility: ElectionScope = scopeLevel === "UNIVERSITY"
          ? { level: "university", ...(yearOfStudy ? { yearOfStudy } : {}) }
          : { level: scopeLevel.toLowerCase() as "campus" | "college" | "school" | "department", value: scopeValue ?? "", ...(yearOfStudy ? { yearOfStudy } : {}) };
        const closesOn = closesAt.toISOString().slice(0, 10);
        const electionId = `election-${crypto.randomUUID()}`;
        const createdElection: Election = {
          id: electionId,
          title,
          scope: scopeLabel(eligibility),
          eligibility,
          closesOn,
          nominationsClose,
          status: opensAt > now ? "upcoming" : "open",
          opens: opensAt.toLocaleString("en-GB"),
          closes: closesAt.toLocaleString("en-GB"),
          eligibleVoters: seedRegistry.filter((student) => eligibleFor(student, { eligibility, closesOn })).length,
          ballotsCast: 0,
          contests: contests.map((contest) => ({ id: `position-${contest.key}`, title: contest.title, description: "", candidates: [] })),
        };
        addCreatedElection(createdElection);
        setCreatedElectionId(electionId);
        setFormError("");
        logActivity({ actor: session?.detail ?? session?.name ?? "election officer", role: "officer", type: "election", severity: "info", detail: `Created election: ${title}.`, before: "No election", after: JSON.stringify({ id: electionId, title, opens: form.get("opens"), closes: form.get("closes"), scopeLevel, scopeValue, campus: campus || null, collegeCode: collegeCode || null, school: schoolName || null, department: departmentName || null, yearOfStudy: yearOfStudy ?? null, contests: contests.map(({ title: contestTitle, seats }) => ({ title: contestTitle, seats })), trustees: form.get("trustees") }) });
        setSaved(true);
      }}
      className="space-y-6"
    >
      {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>}
      <Card className="p-6">
        <h2 className="font-semibold">Details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={label}>Election title</label>
            <input id="title" name="title" className={input} placeholder="e.g. Student Union General Elections 2027" required />
          </div>
          <div>
            <label htmlFor="opens" className={label}>Voting opens</label>
            <input id="opens" name="opens" type="datetime-local" className={input} required onChange={() => setFormError("")} />
          </div>
          <div>
            <label htmlFor="closes" className={label}>Voting closes</label>
            <input id="closes" name="closes" type="datetime-local" className={input} required onChange={() => setFormError("")} />
          </div>
          <div>
            <label htmlFor="nominations" className={label}>Nominations close</label>
            <input id="nominations" name="nominations" type="date" className={input} required onChange={() => setFormError("")} />
          </div>
          <div>
            <label htmlFor="trustees" className={label}>Decryption trustees</label>
            <select id="trustees" name="trustees" className={input} defaultValue="2-of-3">
              <option value="2-of-3">2 of 3 trustees</option>
              <option value="3-of-5">3 of 5 trustees</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Who can vote</h2>
        <p className="mt-1 text-sm text-slate-600">Choose the voter group included in this election.</p>
        <div className="mt-4 max-w-xl">
          <label htmlFor="scope-level" className={label}>Eligible voter group</label>
          <select id="scope-level" name="scopeLevel" className={input} value={scopeLevel} onChange={(event) => setScopeLevel(event.target.value as ScopeLevel)}>
            <option value="UNIVERSITY">Whole university</option>
            <option value="CAMPUS">Whole campus (all colleges)</option>
            <option value="COLLEGE">One college / faculty</option>
            <option value="SCHOOL">One school</option>
            <option value="DEPARTMENT">One department</option>
          </select>
        </div>

        {scopeLevel !== "UNIVERSITY" && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="campus" className={label}>Campus</label>
              <select id="campus" name="campus" className={input} value={campus} required onChange={(event) => { setCampus(event.target.value); setCollegeCode(""); setSchoolName(""); setDepartmentName(""); }}>
                <option value="">Select a campus</option>
                {allUrCampuses.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            {(scopeLevel === "COLLEGE" || scopeLevel === "SCHOOL" || scopeLevel === "DEPARTMENT") && (
              <div>
                <label htmlFor="college" className={label}>College / faculty</label>
                <select id="college" name="collegeCode" className={input} value={collegeCode} required onChange={(event) => { setCollegeCode(event.target.value); setSchoolName(""); setDepartmentName(""); }} disabled={!campus || collegesAtCampus.length === 0}>
                  <option value="">Select a college</option>
                  {collegesAtCampus.map((college) => <option key={college.code} value={college.code}>{college.name}</option>)}
                </select>
                {campus && collegesAtCampus.length === 0 && <p className="mt-1 text-xs text-amber-700">No colleges are listed for this campus yet.</p>}
              </div>
            )}

            {(scopeLevel === "SCHOOL" || scopeLevel === "DEPARTMENT") && (
              <div>
                <label htmlFor="school" className={label}>School</label>
                <select id="school" name="school" className={input} value={schoolName} required onChange={(event) => { setSchoolName(event.target.value); setDepartmentName(""); }} disabled={!selectedCollege}>
                  <option value="">Select a school</option>
                  {selectedCollege?.schools.map((school) => <option key={school.name} value={school.name}>{school.name}</option>)}
                </select>
              </div>
            )}

            {scopeLevel === "DEPARTMENT" && (
              <div>
                <label htmlFor="department" className={label}>Department</label>
                <select id="department" name="department" className={input} value={departmentName} required onChange={(event) => setDepartmentName(event.target.value)} disabled={!selectedSchool}>
                  <option value="">Select a department</option>
                  {selectedSchool?.departments.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {scopeLevel === "CAMPUS" && campus && (
          <div className="mt-4 rounded-lg bg-urblue-50 p-4">
            <p className="text-sm font-semibold text-urblue">All colleges at {campus} are included</p>
            {collegesAtCampus.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">{collegesAtCampus.map((college) => <li key={college.code} className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-urblue-100">{college.name}</li>)}</ul>
            ) : <p className="mt-1 text-xs text-slate-600">No colleges are listed for this campus yet.</p>}
          </div>
        )}

        <div className="mt-5 max-w-xl">
          <label htmlFor="study-level" className={label}>Year of study</label>
          <select id="study-level" name="yearOfStudy" className={input} value={studyLevel} onChange={(event) => setStudyLevel(event.target.value)}>
            <option value="ALL">All years of study</option>
            {[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Year {year}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">Choose a year to limit this election to that class. Leave all years selected to include the full scope.</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Contests</h2>
          <button
            type="button"
            onClick={() => {
              setContests([...contests, { key: nextKey, title: "", seats: 1 }]);
              setNextKey(nextKey + 1);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline"
          >
            <PlusIcon width={16} height={16} /> Add contest
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {contests.map((c, i) => (
            <li key={c.key} className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor={`contest-${c.key}`} className={label}>Position {i + 1}</label>
                <input
                  id={`contest-${c.key}`}
                  value={c.title}
                  onChange={(e) => updateContest(c.key, { title: e.target.value })}
                  className={input}
                  placeholder="e.g. Vice President"
                  required
                />
              </div>
              <div className="w-24">
                <label htmlFor={`seats-${c.key}`} className={label}>Seats</label>
                <input
                  id={`seats-${c.key}`}
                  type="number"
                  min={1}
                  value={c.seats}
                  onChange={(e) => updateContest(c.key, { seats: Number(e.target.value) })}
                  className={input}
                />
              </div>
              <button
                type="button"
                onClick={() => setContests(contests.filter((x) => x.key !== c.key))}
                disabled={contests.length === 1}
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                aria-label={`Remove position ${i + 1}`}
              >
                <XIcon width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/officer/elections" className={btn.secondary}>Cancel</Link>
        <button type="submit" className={btn.primary}>Save election</button>
      </div>
    </form>
  );
}
