"use client";

import Link from "next/link";
import type { CandidateApplication } from "@/lib/data";
import { effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { Card } from "@/components/ui";
import { ArrowRightIcon, UserPlusIcon } from "@/components/icons";

export function PendingApplicantsCard({ seeded }: { seeded: CandidateApplication[] }) {
  const reviews = useReviews();
  const submissions = useSubmissions();
  const pending = [...submissions, ...seeded].filter((a) => effectiveStatus(a, reviews[a.id]) === "pending").length;

  return (
    <Link href="/officer/candidates" className="group">
      <Card className="h-full p-5 transition group-hover:border-urblue-300 group-hover:shadow-md">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-600">Applicants to review</p>
          <span className="rounded-lg bg-urblue-50 p-2 text-urblue"><UserPlusIcon /></span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{pending}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-urblue">
          Review now <ArrowRightIcon width={14} height={14} />
        </p>
      </Card>
    </Link>
  );
}
