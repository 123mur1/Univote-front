"use client";

import Link from "next/link";
import { elections as demoElections } from "@/lib/data";
import { usePublishedResults } from "@/lib/published-results";
import { useApiElectionsState } from "@/lib/election-api";
import { CandidatePhoto, Card, HashText, PageHeader, StatusBadge, formatNumber, percent } from "@/components/ui";
import { ArrowRightIcon, TrophyIcon } from "@/components/icons";

// Shared by the public site (base "") and the student portal (base "/student").
export function ResultsList({ base = "" }: { base?: string }) {
  const publishedIds = usePublishedResults();
  const { elections: fromApi, loaded } = useApiElectionsState();
  const apiIds = new Set(fromApi.map((item) => item.id));
  const all = [...fromApi, ...demoElections.filter((item) => !apiIds.has(item.id))];
  const published = all.filter((e) => publishedIds.includes(e.id) || e.status === "published");
  const pending = all.filter((e) => !publishedIds.includes(e.id) && e.status !== "published");

  return (
    <>
      <PageHeader title="Published results" description="Official results with the result hash and bulletin-board root, so anyone can recount from the encrypted ballots." />

      {!loaded && all.length === 0 && <div className="grid gap-5 md:grid-cols-2">{[0, 1].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-urblue-100/50" />)}</div>}

      {loaded && published.length === 0 && (
        <Card className="flex flex-col items-center border-dashed p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue"><TrophyIcon width={26} height={26} /></span>
          <p className="mt-3 font-semibold">No results published yet</p>
          <p className="mt-1 text-sm text-slate-500">Results appear here as soon as the Electoral Commission publishes them.</p>
        </Card>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {published.map((e) => (
          <Link key={e.id} href={`${base}/results/${e.id}`} className="group">
            <Card className="h-full p-6 transition group-hover:-translate-y-0.5 group-hover:border-urblue-300 group-hover:shadow-md">
              <div className="flex items-center justify-between"><StatusBadge status={e.status} /><span className="text-xs text-slate-500">Closed {e.closes}</span></div>
              <h2 className="mt-4 text-lg font-semibold group-hover:text-urblue">{e.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {e.contests.map((contest) => {
                  const winner = [...contest.candidates].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0];
                  return winner ? (
                    <li key={contest.id} className="flex items-center gap-3 rounded-xl bg-urblue-50/60 px-3 py-2">
                      <CandidatePhoto name={winner.name} photo={winner.photo} size="sm" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{winner.name}</p><p className="truncate text-xs text-slate-500">{contest.title}</p></div>
                      <TrophyIcon width={16} height={16} className="shrink-0 text-amber-500" />
                    </li>
                  ) : null;
                })}
              </ul>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-slate-500">Ballots counted</dt><dd className="text-lg font-semibold">{formatNumber(e.ballotsCast)}</dd></div>
                <div><dt className="text-slate-500">Turnout</dt><dd className="text-lg font-semibold">{percent(e.ballotsCast, e.eligibleVoters)}</dd></div>
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">Result hash {e.resultHash && <HashText value={e.resultHash} size={8} />}</span>
                <ArrowRightIcon width={18} height={18} className="text-urblue" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {pending.length > 0 && (
        <>
          <h2 className="mt-12 text-lg font-semibold">Not yet published</h2>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {pending.map((e) => (
              <li key={e.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center">
                <div><p className="font-medium">{e.title}</p><p className="text-sm text-slate-500">Voting closes {e.closes}</p></div>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
