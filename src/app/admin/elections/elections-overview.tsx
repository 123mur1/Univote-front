"use client";

import { useMemo } from "react";
import type { Election } from "@/lib/data";
import { STANDINGS, countBy, useElectionStats, useStudentRows, type StudentRow } from "@/lib/analytics";
import { useHydrated } from "@/lib/local-store";
import { inScope, scopeLabel } from "@/lib/registry";
import { Meter } from "@/components/charts";
import { Badge, Card, StatusBadge } from "@/components/ui";

export function ElectionsOverview({ elections }: { elections: Election[] }) {
  const hydrated = useHydrated();
  const rows = useStudentRows();
  if (!hydrated) return <div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {elections.map((e) => (
        <ElectionCard key={e.id} election={e} rows={rows} />
      ))}
    </div>
  );
}

function ElectionCard({ election: e, rows }: { election: Election; rows: StudentRow[] }) {
  const { electorate, voters } = useElectionStats(e, rows);
  // Students inside the election's unit who are still excluded, and why.
  const excluded = useMemo(() => {
    const inUnit = rows.filter((r) => inScope(r, e.eligibility));
    const c = countBy(inUnit.filter((r) => r.standing !== "Eligible"), (r) => r.standing);
    return STANDINGS.filter((s) => c.has(s)).map((s) => ({ label: s, value: c.get(s)! }));
  }, [rows, e.eligibility]);
  const published = e.status === "published";

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{e.title}</h2>
          <p className="text-sm text-slate-500">{e.opens} – {e.closes}</p>
        </div>
        <StatusBadge status={e.status} />
      </div>
      <div className="mt-4 rounded-lg bg-urblue-50 p-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-urblue">Eligibility rule</p>
        <p className="mt-1 text-slate-800">
          {scopeLabel(e.eligibility)}; enrolment active; registered for the current academic year; study period still running on{" "}
          {new Date(`${e.closesOn}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div><dt className="text-slate-500">Contests</dt><dd className="text-lg font-semibold">{e.contests.length}</dd></div>
        <div><dt className="text-slate-500">Eligible</dt><dd className="text-lg font-semibold tabular-nums">{(published ? e.eligibleVoters : electorate.length).toLocaleString("en-US")}</dd></div>
        <div><dt className="text-slate-500">Ballots</dt><dd className="text-lg font-semibold tabular-nums">{(published ? e.ballotsCast : voters.length).toLocaleString("en-US")}</dd></div>
      </dl>
      <div className="mt-4">
        <Meter label="Turnout" value={published ? e.ballotsCast : voters.length} max={published ? e.eligibleVoters : electorate.length} />
      </div>
      {!published && excluded.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-600">In this unit but excluded by registry rules</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {excluded.map((x) => <Badge key={x.label} tone="gray">{x.label}: {x.value}</Badge>)}
          </div>
        </div>
      )}
    </Card>
  );
}
