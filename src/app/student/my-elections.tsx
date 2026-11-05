"use client";

import Link from "next/link";
import type { Election } from "@/lib/data";
import { scopeLabel } from "@/lib/registry";
import { useHydrated } from "@/lib/local-store";
import { useVoterStatus } from "@/lib/student-context";
import { EligibilityList } from "@/components/eligibility-panel";
import { Card, StatusBadge, btn } from "@/components/ui";
import { ArrowRightIcon, CheckCircleIcon, LockIcon } from "@/components/icons";

export function MyElections({ open, upcoming }: { open: Election[]; upcoming?: Election[] }) {
  const hydrated = useHydrated();
  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-urblue-100/60" />;
  return (
    <div className="space-y-6">
      {open.map((e) => (
        <OpenElection key={e.id} election={e} />
      ))}
      {upcoming && (
      <Card className="p-6">
        <h2 className="font-semibold">Upcoming elections</h2>
        <ul className="mt-4 divide-y divide-slate-100">
          {upcoming.map((e) => (
            <UpcomingElection key={e.id} election={e} />
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          School and college elections are only open to students the registry lists in that unit.
        </p>
      </Card>
      )}
    </div>
  );
}

function OpenElection({ election: e }: { election: Election }) {
  const status = useVoterStatus(e);

  if (status.voted) {
    return (
      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <CheckCircleIcon width={36} height={36} className="shrink-0 text-emerald-600" />
        <div className="flex-1">
          <h2 className="font-semibold">{e.title}</h2>
          <p className="text-sm text-slate-600">You have voted. Thank you for taking part.</p>
        </div>
        <Link href="/student/verify" className={btn.secondary}>Verify my ballot</Link>
      </Card>
    );
  }

  if (!status.eligible) {
    return (
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            <LockIcon width={14} height={14} /> Not eligible
          </span>
          <span className="text-sm text-slate-500">{scopeLabel(e.eligibility)}</span>
        </div>
        <h2 className="mt-3 text-lg font-semibold">{e.title}</h2>
        <p className="mt-1 text-sm text-slate-600">You can follow this election, but the registry record doesn&apos;t allow you to vote in it:</p>
        <div className="mt-4">
          <EligibilityList checks={status.checks.filter((c) => !c.pass && c.id !== "voted")} compact />
        </div>
        <Link href={`/student/elections/${e.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline">
          See the candidates <ArrowRightIcon width={16} height={16} />
        </Link>
      </Card>
    );
  }

  return (
    <div className="rounded-2xl bg-urblue p-6 text-white shadow-lg shadow-urblue/20">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Action needed · you&apos;re eligible</span>
        <span className="text-sm text-urblue-100">Closes {e.closes}</span>
      </div>
      <h2 className="mt-4 text-xl font-bold">{e.title}</h2>
      <p className="mt-1 text-urblue-100">
        You haven&apos;t voted yet. {e.contests.length} contests on your ballot · {scopeLabel(e.eligibility)}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/student/elections/${e.id}`} className={btn.inverse}>
          Meet candidates & vote <ArrowRightIcon width={18} height={18} />
        </Link>
      </div>
    </div>
  );
}

function UpcomingElection({ election: e }: { election: Election }) {
  const status = useVoterStatus(e);
  const failed = status.checks.filter((c) => !c.pass && c.id !== "voted");
  return (
    <li className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
      <div>
        <p className="font-medium">{e.title}</p>
        <p className="text-sm text-slate-500">Opens {e.opens} · {scopeLabel(e.eligibility)}</p>
        {failed.length > 0 && <p className="mt-0.5 text-xs text-red-700">You won&apos;t be able to vote: {failed[0].detail}</p>}
      </div>
      <StatusBadge status={e.status} />
    </li>
  );
}
