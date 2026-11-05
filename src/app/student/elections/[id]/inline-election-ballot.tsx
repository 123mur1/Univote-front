"use client";

import { useState } from "react";
import Link from "next/link";
import type { Election } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { findInRegistry, isEligible, voterChecks } from "@/lib/registry";
import { readRegistry } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { readSettings } from "@/lib/settings";
import { recordVote, useCurrentStudent, useVoterStatus } from "@/lib/student-context";
import { CandidatePhoto, Card, btn } from "@/components/ui";
import { CheckCircleIcon, CheckIcon, EyeOffIcon, LockIcon } from "@/components/icons";
import { EligibilityList } from "@/components/eligibility-panel";

const ABSTAIN = "abstain";

function makeReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export function InlineElectionBallot({ election }: { election: Election }) {
  const hydrated = useHydrated();
  const { regNumber } = useCurrentStudent();
  const status = useVoterStatus(election);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const canChoose = status.eligible && election.status === "open" && !receipt;
  const complete = election.contests.every((contest) => Boolean(choices[contest.id]));

  function choose(contestId: string, candidateId: string) {
    setChoices((current) => ({ ...current, [contestId]: candidateId }));
    setConfirmed(false);
    setError("");
  }

  function submit() {
    const session = readSession();
    const student = findInRegistry(readRegistry(), regNumber);
    const checks = voterChecks(student, { scope: election.eligibility, closesOn: election.closesOn }, readSettings().academicYear);
    if (session?.role !== "student" || !isEligible(checks) || !recordVote(election.id, regNumber)) {
      setError("We couldn't accept this ballot. Your eligibility may have changed, or a ballot may already have been cast.");
      return;
    }

    logActivity({
      actor: regNumber,
      role: "student",
      type: "vote",
      severity: "info",
      detail: `Ballot cast in ${election.title}.`,
    });
    setReceipt(makeReceipt());
    setReviewing(false);
  }

  if (!hydrated) return <div id="ballot" className="mt-10 h-96 animate-pulse rounded-xl bg-urblue-100/60" />;

  return (
    <div id="ballot" className="mt-10 scroll-mt-24 space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-urblue">Meet the candidates</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">Choose on this page</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Review every candidate below, then select one candidate or abstain in each contest. Review your choices before submitting.
        </p>
        <p className="mt-3 max-w-3xl rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Prototype mode: this demo records participation in this browser only. Do not use it to run a real election; secure server-side ballot handling is not connected yet.
        </p>
      </div>

      {status.voted && !receipt && (
        <Card className="flex items-center gap-3 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircleIcon className="shrink-0" /> You have already cast a ballot in this election.
        </Card>
      )}
      {!status.eligible && !status.voted && (
        <Card className="p-5">
          <h3 className="font-semibold">You can review candidates, but can&apos;t vote in this election</h3>
          <div className="mt-3">
            <EligibilityList checks={status.checks.filter((check) => !check.pass && check.id !== "voted")} compact />
          </div>
          <p className="mt-3 text-xs text-slate-500">If your registry record is wrong, contact the Registry Office.</p>
        </Card>
      )}

      {election.contests.map((contest) => (
        <section key={contest.id}>
          <div className="mb-4">
            <h3 className="text-xl font-bold">{contest.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{contest.description}</p>
          </div>
          {contest.candidates.length === 0 && (
            <p className="mb-4 rounded-lg border border-dashed border-urblue-200 bg-urblue-50 p-4 text-sm text-slate-600">
              No approved candidates are listed for this contest.
            </p>
          )}
          <fieldset>
            <legend className="sr-only">Select one candidate for {contest.title}</legend>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contest.candidates.map((candidate) => {
                const selected = choices[contest.id] === candidate.id;
                return (
                  <label
                    key={candidate.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border-2 bg-white p-4 transition ${
                      selected ? "border-urblue ring-4 ring-urblue/10" : "border-slate-200 hover:border-urblue-300"
                    } ${!canChoose ? "cursor-default opacity-75" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`contest-${contest.id}`}
                      value={candidate.id}
                      checked={selected}
                      disabled={!canChoose || reviewing}
                      onChange={() => choose(contest.id, candidate.id)}
                      className="sr-only"
                    />
                    <CandidatePhoto name={candidate.name} photo={candidate.photo} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{candidate.name}</p>
                      <p className="text-xs text-slate-500">{candidate.program} · {candidate.year}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">{candidate.manifesto}</p>
                    </div>
                    <span className={`mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? "border-urblue bg-urblue text-white" : "border-slate-300"
                    }`}>
                      {selected && <CheckIcon width={14} height={14} strokeWidth={3} />}
                    </span>
                  </label>
                );
              })}
            </div>
            {canChoose && (
              <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 text-sm transition ${
                choices[contest.id] === ABSTAIN ? "border-urblue bg-urblue-50 text-urblue" : "border-slate-200 text-slate-600 hover:border-urblue-300"
              }`}>
                <input
                  type="radio"
                  name={`contest-${contest.id}`}
                  value={ABSTAIN}
                  checked={choices[contest.id] === ABSTAIN}
                  disabled={reviewing}
                  onChange={() => choose(contest.id, ABSTAIN)}
                  className="sr-only"
                />
                Abstain in this contest
              </label>
            )}
          </fieldset>
        </section>
      ))}

      {reviewing && (
        <Card className="p-5">
          <h3 className="font-semibold">Review your choices</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {election.contests.map((contest) => {
              const candidate = contest.candidates.find((item) => item.id === choices[contest.id]);
              return (
                <li key={contest.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span className="text-slate-600">{contest.title}</span>
                  <span className="text-right font-semibold">{candidate?.name ?? "Abstained"}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 flex gap-2 rounded-lg bg-urblue-50 p-3 text-sm text-slate-700">
            <EyeOffIcon className="shrink-0 text-urblue" /> Your choices are shown here only for your review and are not saved by this browser prototype.
          </p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-urblue"
            />
            I confirm these are my choices and that I am casting my own vote.
          </label>
        </Card>
      )}

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {receipt ? (
        <Card className="max-w-2xl p-6">
          <CheckCircleIcon width={32} height={32} className="text-emerald-700" />
          <h3 className="mt-3 text-lg font-bold">Your ballot has been recorded</h3>
          <p className="mt-2 text-sm text-slate-600">Keep this receipt code to check your ballot status. It does not show your selections.</p>
          <p className="mt-3 rounded-lg border-2 border-dashed border-urblue-300 bg-urblue-50 py-3 text-center font-mono text-xl font-bold tracking-widest text-urblue">{receipt}</p>
          <Link href="/student/verify" className={`${btn.secondary} mt-4`}>Verify my ballot</Link>
        </Card>
      ) : canChoose && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {reviewing ? (
            <>
              <button type="button" onClick={() => setReviewing(false)} className={btn.secondary}>Back to candidates</button>
              <button type="button" onClick={submit} disabled={!confirmed} className={btn.primary}>
                <LockIcon width={18} height={18} /> Cast ballot
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setReviewing(true)} disabled={!complete} className={`${btn.primary} ml-auto`}>
              Review ballot
            </button>
          )}
        </div>
      )}
    </div>
  );
}
