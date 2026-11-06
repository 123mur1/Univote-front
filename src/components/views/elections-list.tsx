import Link from "next/link";
import { elections } from "@/lib/data";
import { Card, PageHeader, StatusBadge, formatNumber } from "@/components/ui";
import { ArrowRightIcon, CalendarIcon, UsersIcon } from "@/components/icons";

// Shared by the public site (base "") and the student portal (base "/student").
export function ElectionsList({ base = "" }: { base?: string }) {
  return (
    <>
      <PageHeader
        title="Elections"
        description="All student government elections run on UniVote, including contests, candidates and voting windows."
      />
      <div className="space-y-4">
        {elections.map((e) => (
          <Card key={e.id} className="p-6">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <StatusBadge status={e.status} />
                <h2 className="mt-3 text-lg font-semibold">{e.title}</h2>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon width={16} height={16} className="text-urblue" />
                    {e.opens} – {e.closes}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon width={16} height={16} className="text-urblue" />
                    {formatNumber(e.eligibleVoters)} eligible · {e.scope}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700"><span className="font-medium">Positions:</span> {e.contests.map((contest) => contest.title).join(" · ")}</p>
                <p className="mt-1 text-xs text-slate-500">{e.contests.reduce((total, contest) => total + contest.candidates.length, 0)} listed candidates</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`${base}/elections/${e.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline"
                >
                  View positions & candidates <ArrowRightIcon width={16} height={16} />
                </Link>
                {e.status === "published" && (
                  <Link
                    href={`${base}/results/${e.id}`}
                    className="ml-4 inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline"
                  >
                    Results <ArrowRightIcon width={16} height={16} />
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
