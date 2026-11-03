"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Election } from "@/lib/data";
import { CandidatePhoto, Card, btn } from "@/components/ui";
import { ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, CheckIcon, EyeOffIcon, LockIcon } from "@/components/icons";
import { registeredStudents } from "@/lib/accounts";
import { electionFaculty } from "@/lib/data";

const ABSTAIN = "abstain";

function makeReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function Ballot({ election }: { election: Election }) {
  const contests = election.contests;
  const [step, setStep] = useState(0); // 0..contests.length-1 = contests, contests.length = review
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const [phase, setPhase] = useState<"ballot" | "submitting" | "done">("ballot");
  const [receipt, setReceipt] = useState("");
  const [blocked, setBlocked] = useState("");

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null");
      if (session?.role !== "student") { setBlocked("Sign in with a student account to vote."); return; }
      const voted = JSON.parse(localStorage.getItem("univote.cast-votes.v1") ?? "{}");
      const voterKey = session.registeredStudentId ?? session.detail;
      if (voted[`${election.id}:${voterKey}`]) { setBlocked("A ballot has already been submitted for this account in this election."); return; }
      if (session.registeredStudentId) {
        const student = registeredStudents().find((item) => item.id === session.registeredStudentId);
        if (!student || student.studyEndDate < new Date().toISOString().slice(0, 10)) {
          setBlocked("Your student account is not eligible. The programme end date on the account has passed."); return;
        }
        const faculty = electionFaculty(election);
        const voterAcademicUnit = `${student.college} ${student.school} ${student.department} ${student.programme}`.toLowerCase();
        if (faculty && !voterAcademicUnit.includes(faculty.toLowerCase())) {
          setBlocked(`This election is limited to students in ${faculty}.`); return;
        }
      }
    } catch { setBlocked("Could not verify this account. Please sign in again."); }
  }, [election]);

  const reviewing = step === contests.length;
  const contest = contests[step];

  function submit() {
    const session = JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null");
    const voterKey = session?.registeredStudentId ?? session?.detail;
    const key = `${election.id}:${voterKey}`;
    const voted = JSON.parse(localStorage.getItem("univote.cast-votes.v1") ?? "{}");
    if (!session || voted[key]) { setBlocked("A ballot has already been submitted for this account in this election."); return; }
    localStorage.setItem("univote.cast-votes.v1", JSON.stringify({ ...voted, [key]: true }));
    setPhase("submitting");
    setTimeout(() => {
      setReceipt(makeReceipt());
      setPhase("done");
    }, 1800);
  }

  if (phase === "submitting") {
    return (
      <Card className="mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto flex size-14 animate-pulse items-center justify-center rounded-full bg-urblue text-white">
          <LockIcon width={28} height={28} />
        </span>
        <h1 className="mt-6 text-xl font-bold">Encrypting and casting your ballot…</h1>
        <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-sm text-slate-600">
          <li className="flex gap-2"><CheckIcon width={18} height={18} className="text-urblue" /> Encrypting choices on this device</li>
          <li className="flex gap-2"><CheckIcon width={18} height={18} className="text-urblue" /> Removing your identity from the ballot</li>
          <li className="flex gap-2"><CheckIcon width={18} height={18} className="text-urblue" /> Posting to the bulletin board</li>
        </ul>
      </Card>
    );
  }

  if (blocked) return <Card className="mx-auto max-w-xl p-8"><h1 className="text-xl font-bold">Voting unavailable</h1><p className="mt-2 text-sm text-slate-600">{blocked}</p><Link href="/student" className={`${btn.primary} mt-5`}>Back to dashboard</Link><p className="mt-4 text-xs text-amber-800">This prototype checks eligibility in browser storage. A live election must enforce this check in the backend.</p></Card>;

  if (phase === "done") {
    return (
      <Card className="mx-auto max-w-lg overflow-hidden">
        <div className="bg-urblue px-8 py-10 text-center text-white">
          <CheckCircleIcon width={48} height={48} className="mx-auto" />
          <h1 className="mt-4 text-2xl font-bold">Your vote has been cast</h1>
          <p className="mt-2 text-urblue-100">Thank you for taking part in {election.title}.</p>
        </div>
        <div className="p-8">
          <p className="text-sm font-medium text-slate-600">Your receipt code</p>
          <p className="mt-2 rounded-lg border-2 border-dashed border-urblue-300 bg-urblue-50 py-4 text-center font-mono text-2xl font-bold tracking-widest text-urblue">
            {receipt}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Write this down or take a screenshot. You can use it to check that your ballot was counted.
            It does not show who you voted for, so you can&apos;t be forced to prove your vote.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/student/verify" className={`${btn.primary} flex-1`}>Verify my ballot</Link>
            <Link href="/student" className={`${btn.secondary} flex-1`}>Back to dashboard</Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-sm font-medium text-urblue">{election.title}</p>
        <h1 className="text-2xl font-bold tracking-tight">{reviewing ? "Review your ballot" : contest.title}</h1>
      </div>

      <ol className="mb-8 flex gap-1.5" aria-label="Ballot progress">
        {[...contests, { id: "review", title: "Review" }].map((c, i) => (
          <li key={c.id} className="flex-1">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-urblue" : "bg-urblue-100"}`} />
            <p className={`mt-1.5 hidden truncate text-xs sm:block ${i === step ? "font-semibold text-urblue" : "text-slate-500"}`}>
              {c.title}
            </p>
          </li>
        ))}
      </ol>

      {!reviewing && (
        <fieldset>
          <legend className="mb-4 text-sm text-slate-600">
            {contest.description} Choose <strong>one</strong> candidate.
          </legend>
          <div className="space-y-3">
            {contest.candidates.map((c) => {
              const selected = choices[contest.id] === c.id;
              return (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 bg-white p-4 transition ${
                    selected ? "border-urblue ring-4 ring-urblue/10" : "border-slate-200 hover:border-urblue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={contest.id}
                    value={c.id}
                    checked={selected}
                    onChange={() => setChoices({ ...choices, [contest.id]: c.id })}
                    className="sr-only"
                  />
                  <CandidatePhoto name={c.name} photo={c.photo} size="lg" />
                  <div className="flex-1">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.program} · {c.year}</p>
                    <p className="mt-2 text-sm text-slate-700">{c.manifesto}</p>
                  </div>
                  <span
                    className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-urblue bg-urblue text-white" : "border-slate-300"
                    }`}
                  >
                    {selected && <CheckIcon width={14} height={14} strokeWidth={3} />}
                  </span>
                </label>
              );
            })}
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 text-sm transition ${
                choices[contest.id] === ABSTAIN ? "border-urblue bg-urblue-50 text-urblue" : "border-slate-200 text-slate-600 hover:border-urblue-300"
              }`}
            >
              <input
                type="radio"
                name={contest.id}
                value={ABSTAIN}
                checked={choices[contest.id] === ABSTAIN}
                onChange={() => setChoices({ ...choices, [contest.id]: ABSTAIN })}
                className="sr-only"
              />
              Abstain: leave this contest blank
            </label>
          </div>
        </fieldset>
      )}

      {reviewing && (
        <>
          <Card className="divide-y divide-slate-100">
            {contests.map((c, i) => {
              const pick = c.candidates.find((x) => x.id === choices[c.id]);
              return (
                <div key={c.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    {pick && <CandidatePhoto name={pick.name} photo={pick.photo} size="md" />}
                    <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{c.title}</p>
                    <p className="mt-1 font-semibold">{pick ? pick.name : <span className="text-slate-500">Abstained</span>}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep(i)} className="text-sm font-medium text-urblue hover:underline">
                    Change
                  </button>
                </div>
              );
            })}
          </Card>
          <div className="mt-6 flex gap-3 rounded-xl bg-urblue-50 p-4 text-sm text-slate-700">
            <EyeOffIcon className="shrink-0 text-urblue" />
            Your ballot is encrypted on this device and stored without your name. Once cast, it cannot be changed.
          </div>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 size-4 accent-urblue"
            />
            I confirm these are my choices and that I am casting my own vote.
          </label>
        </>
      )}

      <div className="mt-8 flex justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className={btn.secondary}
        >
          <ArrowLeftIcon width={18} height={18} /> Back
        </button>
        {reviewing ? (
          <button type="button" onClick={submit} disabled={!confirmed} className={btn.primary}>
            <LockIcon width={18} height={18} /> Cast my vote
          </button>
        ) : (
          <button type="button" onClick={() => setStep(step + 1)} disabled={!choices[contest.id]} className={btn.primary}>
            {step === contests.length - 1 ? "Review" : "Next"} <ArrowRightIcon width={18} height={18} />
          </button>
        )}
      </div>
    </div>
  );
}
