"use client";

import { useState } from "react";
import Link from "next/link";
import { elections as demoElections, type Election, type ElectionStatus } from "@/lib/data";
import { useCreatedElections } from "@/lib/election-store";
import { useApiElectionsState } from "@/lib/election-api";
import { CandidatePhoto, Card, PageHeader, StatusBadge, formatNumber, input } from "@/components/ui";
import { ArrowRightIcon, BallotIcon, CalendarIcon, SearchIcon, UsersIcon } from "@/components/icons";

const TABS: { key: "all" | ElectionStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "open", label: "Voting open" },
  { key: "upcoming", label: "Upcoming" },
  { key: "closed", label: "Counting" },
  { key: "published", label: "Results out" },
];

const ORDER: Record<ElectionStatus, number> = { open: 0, upcoming: 1, closed: 2, published: 3 };

// Shared by the public site (base "") and the student portal (base "/student").
export function ElectionsList({ base = "" }: { base?: string }) {
  const created = useCreatedElections();
  const { elections: fromApi, loaded } = useApiElectionsState();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");
  const [query, setQuery] = useState("");
  const apiIds = new Set(fromApi.map((e) => e.id));
  const all: Election[] = [...fromApi, ...created.filter((e) => !apiIds.has(e.id)), ...demoElections.filter((e) => !apiIds.has(e.id) && !created.some((item) => item.id === e.id))]
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const q = query.trim().toLowerCase();
  const visible = all.filter((e) => (tab === "all" || e.status === tab) && (!q || `${e.title} ${e.scope} ${e.contests.map((c) => `${c.title} ${c.candidates.map((x) => x.name).join(" ")}`).join(" ")}`.toLowerCase().includes(q)));

  return (
    <>
      <PageHeader title="Elections & candidates" description="Every student election on UniVote with its positions, approved candidates and voting window." />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter elections">
          {TABS.map((t) => {
            const count = t.key === "all" ? all.length : all.filter((e) => e.status === t.key).length;
            return (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${tab === t.key ? "bg-urblue text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-urblue-300"}`}>
                {t.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="relative md:w-72">
          <SearchIcon width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search elections or candidates" className={`${input} pl-9`} aria-label="Search elections or candidates" />
        </div>
      </div>

      {!loaded && all.length === 0 ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-urblue-100/50" />)}</div>
      ) : visible.length === 0 ? (
        <Card className="flex flex-col items-center border-dashed p-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue"><BallotIcon width={26} height={26} /></span>
          <p className="mt-3 font-semibold">{all.length === 0 ? "No elections yet" : "No elections match"}</p>
          <p className="mt-1 text-sm text-slate-500">{all.length === 0 ? "Elections will appear here once the Electoral Commission schedules them." : "Try another filter or search term."}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((e) => {
            const candidates = e.contests.flatMap((c) => c.candidates);
            return (
              <Card key={e.id} className="p-5 transition hover:border-urblue-200 hover:shadow-md sm:p-6">
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={e.status} /><span className="text-xs font-medium text-slate-500">{e.scope}</span></div>
                    <h2 className="mt-3 text-lg font-semibold">{e.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5"><CalendarIcon width={16} height={16} className="text-urblue" />{e.opens} – {e.closes}</span>
                      <span className="inline-flex items-center gap-1.5"><UsersIcon width={16} height={16} className="text-urblue" />{formatNumber(e.eligibleVoters)} eligible voters</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.contests.map((contest) => <span key={contest.id} className="rounded-md bg-urblue-50 px-2 py-0.5 text-xs font-medium text-urblue-dark">{contest.title} · {contest.candidates.length}</span>)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                    {candidates.length > 0 && (
                      <div className="flex -space-x-2">
                        {candidates.slice(0, 5).map((c) => <span key={c.id} className="rounded-xl ring-2 ring-white"><CandidatePhoto name={c.name} photo={c.photo} size="sm" /></span>)}
                        {candidates.length > 5 && <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 ring-2 ring-white">+{candidates.length - 5}</span>}
                      </div>
                    )}
                    <div className="flex gap-4">
                      <Link href={`${base}/elections/${e.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline">
                        {e.status === "open" && base === "/student" ? "Vote" : "Candidates"} <ArrowRightIcon width={16} height={16} />
                      </Link>
                      {e.status === "published" && <Link href={`${base}/results/${e.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline">Results <ArrowRightIcon width={16} height={16} /></Link>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
