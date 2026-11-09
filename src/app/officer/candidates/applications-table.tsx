"use client";

import { useState } from "react";
import Link from "next/link";
import type { CandidateApplication } from "@/lib/data";
import { eligibilityChecks } from "@/lib/eligibility";
import { docStatus, effectiveStatus, resetReviews, resetSubmissions, useReviews, useSubmissions } from "@/lib/review-store";
import { Badge, CandidatePhoto, Card, btn } from "@/components/ui";
import { AlertIcon, ArrowRightIcon } from "@/components/icons";
import { useApiNominations } from "@/lib/nominations-api";
import { readSession } from "@/lib/session";

const filters = ["all", "pending", "approved", "rejected"] as const;
type Filter = (typeof filters)[number];

const tone = { pending: "amber", approved: "green", rejected: "red" } as const;

export function ApplicationsTable({ initial }: { initial: CandidateApplication[] }) {
  const reviews = useReviews();
  const submissions = useSubmissions();
  const apiNominations = useApiNominations();
  const isBackendSession = Boolean(readSession()?.accessToken);
  const [filter, setFilter] = useState<Filter>("all");

  // Newly submitted nominations first, then the seeded ones.
  const liveRows = apiNominations.length ? apiNominations : submissions;
  const rows = [...liveRows, ...(isBackendSession && apiNominations.length ? [] : initial)].map((a) => {
    const review = reviews[a.id];
    const states = a.documents.map((d) => docStatus(a, d, review));
    return {
      a,
      status: effectiveStatus(a, review),
      verified: states.filter((s) => s === "verified").length,
      flagged: states.filter((s) => s === "flagged").length,
      failedChecks: eligibilityChecks(a).filter((c) => !c.pass).length,
    };
  });
  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const count = f === "all" ? rows.length : rows.filter((r) => r.status === f).length;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition ${
                  filter === f ? "bg-urblue text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-urblue-300"
                }`}
              >
                {f} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        {(Object.keys(reviews).length > 0 || submissions.length > 0) && (
          <button
            type="button"
            onClick={() => {
              resetReviews();
              resetSubmissions();
            }}
            className="text-xs font-medium text-slate-500 hover:text-urblue hover:underline"
          >
            Reset demo data
          </button>
        )}
      </div>
      <Card className="divide-y divide-slate-100">
        {visible.length === 0 && <p className="p-6 text-sm text-slate-500">No nominations here.</p>}
        {visible.map(({ a, status, verified, flagged, failedChecks }) => (
          <div key={a.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3">
              <CandidatePhoto name={a.name} photo={a.photo} size="lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">{a.name}{a.id.startsWith("sub-") && <Badge tone="blue">New</Badge>}</p>
                <p className="text-xs text-slate-500">
                  <span className="font-mono">{a.studentId}</span> · {a.contest} · submitted {a.submitted}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone={verified === a.documents.length ? "green" : "gray"}>
                    {verified}/{a.documents.length} documents verified
                  </Badge>
                  {flagged > 0 && <Badge tone="red">{flagged} flagged</Badge>}
                  {failedChecks > 0 && status === "pending" && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                      <AlertIcon width={14} height={14} /> {failedChecks} eligibility {failedChecks === 1 ? "issue" : "issues"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={tone[status]}>{status}</Badge>
              <Link
                href={`/officer/candidates/${a.id}`}
                className={status === "pending" ? btn.primary : btn.secondary}
              >
                {status === "pending" ? "Review" : "View"} <ArrowRightIcon width={16} height={16} />
              </Link>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
