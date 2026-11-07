"use client";

import Link from "next/link";
import { getElection } from "@/lib/data";
import { useCreatedElections } from "@/lib/election-store";
import { effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { CandidatePhoto, Card, StatusBadge, btn, formatNumber } from "@/components/ui";
import { InlineElectionBallot } from "@/app/student/elections/[id]/inline-election-ballot";

// Shared by the public site (base "") and the student portal (base "/student").
export function ElectionDetails({ id, base = "" }: { id: string; base?: string }) {
  const created = useCreatedElections();
  const reviews = useReviews();
  const submissions = useSubmissions();
  const createdElection = created.find((item) => item.id === id);
  const electionBase = getElection(id) ?? createdElection;
  const election = electionBase && createdElection ? {
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
  if (!election) return <p className="mt-6 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">This election could not be found.</p>;

  return (
    <>
      <div className="mt-6 flex flex-col justify-between gap-6 rounded-2xl bg-urblue p-8 text-white md:flex-row md:items-end">
        <div>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{election.scope}</span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{election.title}</h1>
          <p className="mt-2 text-urblue-100">
            {election.opens} – {election.closes} · {formatNumber(election.eligibleVoters)} eligible voters
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <span className="rounded-full bg-white px-1 py-0.5"><StatusBadge status={election.status} /></span>
          {election.status === "open" && base === "/student" && <a href="#ballot" className={btn.inverse}>Vote on this page</a>}
          {election.status === "open" && base !== "/student" && base !== "/officer" && <Link href="/login" className={btn.inverse}>Sign in to vote</Link>}
          {election.status === "published" && <Link href={`${base === "/officer" ? "" : base}/results/${election.id}`} className={btn.inverse}>View results</Link>}
        </div>
      </div>

      {base === "/student" && election.status === "open" ? (
        <InlineElectionBallot election={election} />
      ) : (
      <div className="mt-10 space-y-10">
        {election.contests.map((contest) => (
          <section key={contest.id}>
            <h2 className="text-xl font-bold">{contest.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{contest.description}</p>
            {contest.candidates.length === 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-urblue-200 bg-urblue-50 p-4 text-sm text-slate-600">
                No approved candidates yet. Nominations are open until the Electoral Commission closes them.
              </p>
            )}
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contest.candidates.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-center gap-4">
                    <CandidatePhoto name={c.name} photo={c.photo} size="xl" />
                    <div>
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="text-xs text-slate-500">{c.program} · {c.year}</p>
                    </div>
                  </div>
                  <p className="mt-4 border-l-2 border-urblue pl-3 text-sm leading-relaxed text-slate-700">
                    {c.manifesto}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      )}
    </>
  );
}
