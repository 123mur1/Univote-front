"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Election } from "@/lib/data";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { findInRegistry, isEligible, voterChecks } from "@/lib/registry";
import { readRegistry } from "@/lib/registry-store";
import { readSession } from "@/lib/session";
import { readSettings } from "@/lib/settings";
import { recordVote, useCurrentStudent, useVoterStatus } from "@/lib/student-context";
import { CandidatePhoto, Callout, Card, Ring, Skeleton, Spinner, btn } from "@/components/ui";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CheckCircleIcon, CheckIcon, CopyIcon, EyeOffIcon, LockIcon, ShieldIcon, XIcon } from "@/components/icons";
import { EligibilityList } from "@/components/eligibility-panel";
import { Manifesto } from "@/components/manifesto";
import { toast } from "@/components/toast";
import { apiRequest } from "@/lib/api-client";
import { encryptBallot } from "@/lib/ballot-crypto";
import { notifyDataChanged } from "@/lib/use-api";
import type { Check } from "@/lib/registry";

const ABSTAIN = "abstain";

function makeReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const code = Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

function scrollToContest(id: string) {
  document.getElementById(`contest-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function InlineElectionBallot({ election }: { election: Election }) {
  const hydrated = useHydrated();
  const { regNumber } = useCurrentStudent();
  const status = useVoterStatus(election);
  const [serverStatus, setServerStatus] = useState<{ eligible: boolean; voted: boolean; checks: Check[] } | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [error, setError] = useState("");
  const serverSession = readSession();
  useEffect(() => {
    if (!serverSession?.accessToken || serverSession.role !== "student") return;
    apiRequest<{ eligible: boolean; voted: boolean; checks: Check[] }>(`/elections/${election.id}/eligibility`)
      .then(setServerStatus)
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not check server eligibility."));
  }, [election.id, serverSession?.accessToken, serverSession?.role]);
  const effectiveStatus = serverSession?.accessToken ? serverStatus : status;
  const canChoose = Boolean(effectiveStatus?.eligible && election.status === "open" && !receipt && (!serverSession?.accessToken || election.publicKey));
  const chosenCount = election.contests.filter((contest) => Boolean(choices[contest.id])).length;
  const complete = chosenCount === election.contests.length;

  // Close the review sheet with Escape.
  useEffect(() => {
    if (!reviewing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !submitting) setReviewing(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reviewing, submitting]);

  function choose(contestId: string, candidateId: string) {
    const isNew = !choices[contestId];
    const next = { ...choices, [contestId]: candidateId };
    setChoices(next);
    setConfirmed(false);
    setError("");
    // Guide the voter to the next position they haven't filled in yet.
    if (isNew) {
      const index = election.contests.findIndex((c) => c.id === contestId);
      const upcoming = [...election.contests.slice(index + 1), ...election.contests.slice(0, index)].find((c) => !next[c.id]);
      if (upcoming) window.setTimeout(() => scrollToContest(upcoming.id), 350);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      await cast();
    } finally {
      setSubmitting(false);
    }
  }

  async function cast() {
    const session = readSession();
    if (session?.accessToken) {
      if (session.role !== "student" || !election.publicKey) {
        setError("This election does not have a ballot encryption key. Contact the election officer.");
        return;
      }
      try {
        const encryptedPayload = await encryptBallot(election.publicKey, election.id, choices);
        const accepted = await apiRequest<{ accepted: boolean; receipt: string }>(`/elections/${election.id}/ballots`, {
          method: "POST", body: JSON.stringify({ encryptedPayload }),
        });
        if (!accepted.accepted || !accepted.receipt) throw new Error("The server did not confirm this ballot.");
        setReceipt(accepted.receipt);
        notifyDataChanged();
        setServerStatus((current) => current ? { ...current, eligible: false, voted: true, checks: current.checks.map((check) => check.id === "voted" ? { ...check, pass: false, detail: "A ballot was recorded." } : check) } : current);
        setReviewing(false);
        toast.success("Ballot recorded", "Thank you for voting. Keep your receipt code safe.");
        window.setTimeout(() => document.getElementById("ballot")?.scrollIntoView({ behavior: "smooth" }), 50);
        return;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "We couldn't submit this ballot.");
        return;
      }
    }
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
      before: "No accepted ballot",
      after: "Ballot recorded; vote choice remains secret",
    });
    setReceipt(makeReceipt());
    setReviewing(false);
    toast.success("Ballot recorded", "Thank you for voting. Keep your receipt code safe.");
    window.setTimeout(() => document.getElementById("ballot")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  if (!hydrated) return <Skeleton className="mt-10 h-96 rounded-3xl" />;

  if (receipt) return <BallotSuccess receipt={receipt} title={election.title} />;

  return (
    <div id="ballot" className="mt-10 scroll-mt-24 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-urblue">Your ballot</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Choose your leaders</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Tap a candidate to select them, or abstain, for each position. You&apos;ll review everything before your ballot is submitted.
          </p>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 lg:self-auto">
          <LockIcon width={14} height={14} />
          {serverSession?.accessToken ? "Encrypted on this device before sending" : "Demo mode · stored in this browser only"}
        </p>
      </div>

      {effectiveStatus?.voted && (
        <Callout tone="success" icon={<CheckCircleIcon width={20} height={20} />} title="You have already voted in this election">
          Thank you for taking part. You can check your ballot with your receipt code on the <Link href="/student/verify" className="font-semibold underline">Verify</Link> page.
        </Callout>
      )}
      {effectiveStatus && !effectiveStatus.eligible && !effectiveStatus.voted && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertIcon width={20} height={20} /></span>
            <div>
              <h3 className="font-bold">You can read about the candidates, but you can&apos;t vote in this election</h3>
              <div className="mt-3">
                <EligibilityList checks={effectiveStatus.checks.filter((check) => !check.pass && check.id !== "voted")} compact />
              </div>
              <p className="mt-3 text-xs text-slate-500">If your registry record is wrong, contact the Registry Office.</p>
            </div>
          </div>
        </Card>
      )}
      {serverSession?.accessToken && !serverStatus && !error && (
        <p role="status" className="inline-flex items-center gap-2 text-sm text-slate-500"><Spinner className="text-urblue" /> Checking your eligibility…</p>
      )}
      {serverSession?.accessToken && !election.publicKey && (
        <Callout tone="warning" icon={<AlertIcon width={20} height={20} />}>This election has no encryption key configured, so online ballot submission is unavailable.</Callout>
      )}

      {/* Sticky progress tracker */}
      {canChoose && (
        <div className="sticky top-[72px] z-30">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[var(--shadow-lift)] backdrop-blur-xl sm:p-4">
            <Ring value={chosenCount} max={election.contests.length} size={48} stroke={5} label={`${chosenCount}/${election.contests.length}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900">{complete ? "All positions chosen" : `${election.contests.length - chosenCount} position${election.contests.length - chosenCount === 1 ? "" : "s"} left`}</p>
              <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
                {election.contests.map((contest) => {
                  const done = Boolean(choices[contest.id]);
                  return (
                    <button
                      key={contest.id}
                      type="button"
                      onClick={() => scrollToContest(contest.id)}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${done ? "bg-urblue text-white" : "bg-slate-100 text-slate-600 hover:bg-urblue-50 hover:text-urblue"}`}
                    >
                      {done && <CheckIcon width={11} height={11} strokeWidth={3} />}
                      {contest.title}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={() => setReviewing(true)} disabled={!complete} className={`${btn.primary} shrink-0`}>
              <span className="hidden sm:inline">Review ballot</span><span className="sm:hidden">Review</span> <ArrowRightIcon width={16} height={16} />
            </button>
          </div>
        </div>
      )}

      {election.contests.map((contest, index) => {
        const chosen = choices[contest.id];
        return (
          <section key={contest.id} id={`contest-${contest.id}`} className="scroll-mt-48">
            <div className="mb-4 flex items-start gap-4">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold transition-all duration-300 ${chosen ? "bg-urblue text-white shadow-[var(--shadow-brand)]" : "bg-urblue-50 text-urblue ring-1 ring-urblue-100"}`}>
                {chosen ? <CheckIcon width={18} height={18} strokeWidth={3} /> : index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xl font-bold">{contest.title}</h3>
                {contest.description && <p className="mt-0.5 text-sm text-slate-600">{contest.description}</p>}
                {canChoose && <p className="mt-1 text-xs font-semibold text-slate-400">Choose one candidate or abstain</p>}
              </div>
            </div>
            {contest.candidates.length === 0 && (
              <p className="mb-4 rounded-2xl border border-dashed border-urblue-200 bg-urblue-25 p-4 text-sm text-slate-600">
                No approved candidates are listed for this position.
              </p>
            )}
            <fieldset>
              <legend className="sr-only">Select one candidate for {contest.title}</legend>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contest.candidates.map((candidate) => {
                  const selected = chosen === candidate.id;
                  const dimmed = Boolean(chosen) && !selected;
                  return (
                    <label
                      key={candidate.id}
                      className={`group relative flex flex-col rounded-2xl border-2 bg-white p-5 transition-all duration-300 ${
                        selected
                          ? "border-urblue shadow-[0_0_0_5px_rgba(0,98,139,.12),var(--shadow-lift)]"
                          : "border-slate-200/80 hover:-translate-y-0.5 hover:border-urblue-300 hover:shadow-[var(--shadow-lift)]"
                      } ${canChoose ? "cursor-pointer" : "cursor-default"} ${dimmed ? "opacity-70 hover:opacity-100" : ""} has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-urblue/25`}
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
                      <div className="flex items-start gap-4">
                        <CandidatePhoto name={candidate.name} photo={candidate.photo} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900">{candidate.name}</p>
                          <p className="text-xs text-slate-500">{candidate.program}</p>
                          <p className="mt-1 inline-flex rounded-full bg-urblue-50 px-2 py-0.5 text-[11px] font-semibold text-urblue">{candidate.year}</p>
                        </div>
                        {canChoose && (
                          <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${selected ? "scale-110 border-urblue bg-urblue text-white" : "border-slate-300 group-hover:border-urblue-300"}`}>
                            {selected && <CheckIcon width={15} height={15} strokeWidth={3} className="[animation:univote-pop_.35s_both]" />}
                          </span>
                        )}
                      </div>
                      <Manifesto text={candidate.manifesto} />
                      {selected && <span className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-urblue px-3 py-1 text-xs font-bold text-white [animation:univote-pop_.35s_both]"><CheckIcon width={12} height={12} strokeWidth={3} /> Your choice</span>}
                    </label>
                  );
                })}
              </div>
              {canChoose && (
                <label className={`mt-3 flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-sm font-semibold transition-all ${
                  chosen === ABSTAIN ? "border-urblue bg-urblue-50 text-urblue" : "border-slate-200 text-slate-500 hover:border-urblue-300 hover:text-urblue"
                } has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-urblue/25`}>
                  <input
                    type="radio"
                    name={`contest-${contest.id}`}
                    value={ABSTAIN}
                    checked={chosen === ABSTAIN}
                    disabled={reviewing}
                    onChange={() => choose(contest.id, ABSTAIN)}
                    className="sr-only"
                  />
                  <span className={`flex size-6 items-center justify-center rounded-full border-2 ${chosen === ABSTAIN ? "border-urblue bg-urblue text-white" : "border-slate-300"}`}>
                    {chosen === ABSTAIN && <CheckIcon width={13} height={13} strokeWidth={3} />}
                  </span>
                  Abstain for {contest.title}
                </label>
              )}
            </fieldset>
          </section>
        );
      })}

      {error && !reviewing && <Callout tone="danger" icon={<AlertIcon width={20} height={20} />}>{error}</Callout>}

      {canChoose && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-urblue-200 bg-urblue-25 p-6 text-center sm:p-8">
          <p className="text-sm font-semibold text-slate-700">{complete ? "You're ready. Check your choices before submitting." : `Choose for every position to continue (${chosenCount} of ${election.contests.length} done).`}</p>
          <button type="button" onClick={() => setReviewing(true)} disabled={!complete} className={`${btn.primary} px-8! py-3.5!`}>
            Review my ballot <ArrowRightIcon width={17} height={17} />
          </button>
        </div>
      )}

      {/* Review sheet */}
      {reviewing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-urblue-deep/60 p-0 backdrop-blur-sm [animation:univote-fade_.2s_ease_both] sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="review-title">
          <div className="univote-sheet univote-scroll max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-urblue">Final step</p>
                <h3 id="review-title" className="mt-1 text-xl font-extrabold">Review your ballot</h3>
                <p className="mt-1 text-sm text-slate-500">{election.title}</p>
              </div>
              <button type="button" onClick={() => setReviewing(false)} disabled={submitting} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Close review">
                <XIcon width={20} height={20} />
              </button>
            </div>
            <ul className="mt-5 space-y-2">
              {election.contests.map((contest) => {
                const candidate = contest.candidates.find((item) => item.id === choices[contest.id]);
                return (
                  <li key={contest.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    {candidate ? <CandidatePhoto name={candidate.name} photo={candidate.photo} size="md" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-200 text-xs font-bold text-slate-500">—</span>}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{contest.title}</p>
                      <p className={`truncate font-bold ${candidate ? "text-slate-900" : "text-slate-500"}`}>{candidate?.name ?? "Abstained"}</p>
                    </div>
                    <button type="button" disabled={submitting} onClick={() => { setReviewing(false); window.setTimeout(() => scrollToContest(contest.id), 50); }} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-urblue transition hover:bg-urblue-50">
                      Change
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 flex gap-2.5 rounded-2xl bg-urblue-50 p-3.5 text-xs leading-5 text-urblue-darker">
              <EyeOffIcon width={18} height={18} className="shrink-0 text-urblue" /> Your choices are only shown to you here. Once submitted, nobody can link this ballot to you.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-3.5 text-sm transition hover:border-urblue-300 has-[:checked]:border-urblue has-[:checked]:bg-urblue-25">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 size-4 accent-urblue"
              />
              <span className="font-medium text-slate-700">I confirm these are my choices and that I am casting my own vote. I understand a submitted ballot is final.</span>
            </label>
            {error && <Callout tone="danger" icon={<AlertIcon width={20} height={20} />} className="mt-4">{error}</Callout>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button type="button" onClick={() => setReviewing(false)} disabled={submitting} className={btn.secondary}>
                <ArrowLeftIcon width={16} height={16} /> Back to candidates
              </button>
              <button type="button" onClick={submit} disabled={!confirmed || submitting} className={`${btn.primary} px-6!`}>
                {submitting ? <><Spinner /> Encrypting &amp; sending…</> : <><LockIcon width={17} height={17} /> Cast my ballot</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CONFETTI_COLORS = ["#00628b", "#4fb3dc", "#b8d8e6", "#ffffff", "#003650", "#7fb6cf"];

function BallotSuccess({ receipt, title }: { receipt: string; title: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(receipt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy", "Select the code and copy it manually.");
    }
  }
  return (
    <div id="ballot" className="relative mt-10 scroll-mt-24 overflow-hidden rounded-[2rem] bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep p-6 text-center text-white shadow-[var(--shadow-brand)] sm:p-12">
      <div className="univote-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-0">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-sm"
            style={{
              left: `${(i * 37) % 100}%`,
              width: 6 + (i % 3) * 2,
              height: 10 + (i % 4) * 2,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animation: `univote-confetti ${1.8 + (i % 5) * 0.35}s ${(i % 7) * 0.08}s cubic-bezier(.2,.6,.4,1) both`,
              ["--dx" as string]: `${((i * 53) % 120) - 60}px`,
              ["--rot" as string]: `${360 + ((i * 97) % 540)}deg`,
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto max-w-lg">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-white text-urblue shadow-2xl [animation:univote-pop_.5s_both]">
          <svg className="univote-check" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
        </span>
        <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">Your vote is in!</h2>
        <p className="mt-3 text-urblue-100">Your ballot for <span className="font-semibold text-white">{title}</span> has been securely recorded. Thank you for making your voice heard.</p>

        <div className="mt-8 rounded-3xl bg-white p-5 text-left text-slate-900 shadow-xl sm:p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-urblue">
            <ShieldIcon width={16} height={16} /> Your receipt code
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-2xl border-2 border-dashed border-urblue-200 bg-urblue-25 p-2 pl-4">
            <p className="flex-1 select-all break-all font-mono text-lg font-bold tracking-[0.18em] text-urblue sm:text-xl">{receipt}</p>
            <button type="button" onClick={copy} className={`${btn.primary} shrink-0 px-3! py-2!`} aria-label="Copy receipt code">
              {copied ? <><CheckIcon width={15} height={15} strokeWidth={3} /> Copied</> : <><CopyIcon width={15} height={15} /> Copy</>}
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">Save this code. It lets you confirm your ballot was counted. It does not reveal who you voted for.</p>
        </div>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/student/verify" className={btn.inverse}><ShieldIcon width={17} height={17} /> Verify my ballot</Link>
          <Link href="/student" className={btn.ghostInverse}>Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}
