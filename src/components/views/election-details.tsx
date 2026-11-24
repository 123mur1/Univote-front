"use client";

import Link from "next/link";
import { getElection } from "@/lib/data";
import { useCreatedElections } from "@/lib/election-store";
import { effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { CandidatePhoto, EmptyState, Ring, Skeleton, StatusBadge, btn, formatNumber } from "@/components/ui";
import { ArrowRightIcon, BallotIcon, CalendarIcon, ChartIcon, UsersIcon } from "@/components/icons";
import { InlineElectionBallot } from "@/app/student/elections/[id]/inline-election-ballot";
import { useApiElectionsState } from "@/lib/election-api";
import { Manifesto } from "@/components/manifesto";

// Shared by the public site (base "") and the student portal (base "/student").
export function ElectionDetails({ id, base = "" }: { id: string; base?: string }) {
  const created = useCreatedElections();
  const { elections: fromApi, loaded } = useApiElectionsState();
  const reviews = useReviews();
  const submissions = useSubmissions();
  const createdElection = created.find((item) => item.id === id);
  const apiElection = fromApi.find((item) => item.id === id);
  const electionBase = apiElection ?? getElection(id) ?? createdElection;
  const election = electionBase && createdElection && !apiElection ? {
    ...electionBase,
    contests: electionBase.contests.map((contest) => ({
      ...contest,
      candidates: submissions
        .filter((application) => application.electionId === electionBase.id && application.contest === contest.title && effectiveStatus(application, reviews[application.id]) === "approved")
        .map((application) => ({
          id: application.id,
          name: application.name,
          photo: application.photo,
          program: application.declared.program,
          year: application.declared.year,
          manifesto: application.manifesto,
        })),
    })),
  } : electionBase;
  if (!election && !loaded) {
    return (
      <div className="mt-6 space-y-6" aria-busy="true">
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid gap-4 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
      </div>
    );
  }
  if (!election) return <EmptyState className="mt-6" icon={<BallotIcon width={26} height={26} />} title="Election not found" text="This election may have been removed, or the link is incorrect." />;

  const candidates = election.contests.reduce((s, c) => s + c.candidates.length, 0);

  return (
    <>
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-urblue via-urblue-dark to-urblue-deep p-6 text-white shadow-[var(--shadow-brand)] sm:p-9">
        <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div aria-hidden="true" className="univote-rope pointer-events-none absolute -right-16 -top-16 size-64 text-white/10" />
        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-0.5 py-0.5"><StatusBadge status={election.status} /></span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">{election.scope}</span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{election.title}</h1>
            <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm text-urblue-100">
              <div className="flex items-center gap-2"><CalendarIcon width={17} height={17} /><dt className="sr-only">Dates</dt><dd>{election.opens} – {election.closes}</dd></div>
              <div className="flex items-center gap-2"><BallotIcon width={17} height={17} /><dt className="sr-only">Positions</dt><dd>{election.contests.length} position{election.contests.length === 1 ? "" : "s"}</dd></div>
              <div className="flex items-center gap-2"><UsersIcon width={17} height={17} /><dt className="sr-only">Candidates</dt><dd>{candidates} candidate{candidates === 1 ? "" : "s"}</dd></div>
            </dl>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            {(election.status === "open" || election.status === "closed") && (
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-3 pr-5 ring-1 ring-white/15 backdrop-blur">
                <span className="rounded-full bg-white p-1"><Ring value={election.ballotsCast} max={election.eligibleVoters} size={56} stroke={6} /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-urblue-200">Turnout</p>
                  <p className="text-lg font-extrabold tabular-nums">{formatNumber(election.ballotsCast)} <span className="text-sm font-medium text-urblue-200">/ {formatNumber(election.eligibleVoters)}</span></p>
                </div>
              </div>
            )}
            {election.status === "open" && base === "/student" && <a href="#ballot" className={`${btn.inverse} px-6!`}>Start voting <ArrowRightIcon width={17} height={17} /></a>}
            {election.status === "open" && base !== "/student" && base !== "/officer" && <Link href="/login" className={`${btn.inverse} px-6!`}>Sign in to vote <ArrowRightIcon width={17} height={17} /></Link>}
            {election.status === "published" && <Link href={`${base === "/officer" ? "" : base}/results/${election.id}`} className={`${btn.inverse} px-6!`}><ChartIcon width={17} height={17} /> View results</Link>}
          </div>
        </div>
      </div>

      {base === "/student" && election.status === "open" ? (
        <InlineElectionBallot election={election} />
      ) : (
        <div className="mt-10 space-y-12">
          {election.contests.map((contest, index) => (
            <section key={contest.id}>
              <div className="mb-5 flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-urblue-50 text-sm font-extrabold text-urblue ring-1 ring-urblue-100">{index + 1}</span>
                <div>
                  <h2 className="text-xl font-bold">{contest.title}</h2>
                  {contest.description && <p className="mt-1 text-sm text-slate-600">{contest.description}</p>}
                </div>
              </div>
              {contest.candidates.length === 0 ? (
                <EmptyState icon={<UsersIcon width={24} height={24} />} title="No approved candidates yet" text="Candidates appear here once the Electoral Commission approves their applications." />
              ) : (
                <div className="univote-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {contest.candidates.map((c) => (
                    <article key={c.id} className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(11,34,48,.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-urblue-200 hover:shadow-[var(--shadow-lift)]">
                      <div className="flex items-center gap-4">
                        <CandidatePhoto name={c.name} photo={c.photo} size="lg" className="transition-transform duration-300 group-hover:scale-105" />
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">{c.name}</h3>
                          <p className="text-xs text-slate-500">{c.program}</p>
                          <p className="mt-1 inline-flex rounded-full bg-urblue-50 px-2 py-0.5 text-[11px] font-semibold text-urblue">{c.year}</p>
                        </div>
                      </div>
                      <Manifesto text={c.manifesto} />
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
