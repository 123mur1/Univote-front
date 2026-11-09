"use client";

import Link from "next/link";
import { elections } from "@/lib/data";
import { usePublishedResults } from "@/lib/published-results";
import { Card, HashText, PageHeader, StatusBadge, formatNumber, percent } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { useApiElections } from "@/lib/election-api";

// Shared by the public site (base "") and the student portal (base "/student").
export function ResultsList({ base = "" }: { base?: string }) {
  const publishedIds = usePublishedResults();
  const fromApi = useApiElections();
  const apiIds = new Set(fromApi.map((item) => item.id));
  const all = [...fromApi, ...elections.filter((item) => !apiIds.has(item.id))];
  const published = all.filter((e) => publishedIds.includes(e.id) || e.status === "published");
  const pending = all.filter((e) => !publishedIds.includes(e.id) && e.status !== "published");

  return (
    <>
      <PageHeader
        title="Election results"
        description="Results are published with a signed result hash and the bulletin board root, so anyone can recount from the encrypted ballots."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {published.map((e) => (
          <Link key={e.id} href={`${base}/results/${e.id}`} className="group">
            <Card className="h-full p-6 transition group-hover:border-urblue-300 group-hover:shadow-md">
              <StatusBadge status={e.status} />
              <h2 className="mt-4 text-lg font-semibold group-hover:text-urblue">{e.title}</h2>
              <p className="mt-1 text-sm text-slate-500">Closed {e.closes}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Ballots counted</dt>
                  <dd className="text-lg font-semibold">{formatNumber(e.ballotsCast)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Turnout</dt>
                  <dd className="text-lg font-semibold">{percent(e.ballotsCast, e.eligibleVoters)}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">Result hash {e.resultHash && <HashText value={e.resultHash} size={8} />}</span>
                <ArrowRightIcon width={18} height={18} className="text-urblue" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 text-lg font-semibold">Not yet published</h2>
      <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {pending.map((e) => (
          <li key={e.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <p className="font-medium">{e.title}</p>
              <p className="text-sm text-slate-500">Voting closes {e.closes}</p>
            </div>
            <StatusBadge status={e.status} />
          </li>
        ))}
      </ul>
    </>
  );
}
