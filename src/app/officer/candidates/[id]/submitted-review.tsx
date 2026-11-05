"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useSubmissions } from "@/lib/review-store";
import { Card, btn } from "@/components/ui";
import { ApplicationReview } from "./application-review";

const noop = () => () => {};

// Nominations students submit in this demo live in browser storage, so they are looked up client-side.
export function SubmittedReview({ id }: { id: string }) {
  const submissions = useSubmissions();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const application = submissions.find((s) => s.id === id);

  if (!hydrated) return <div className="mt-6 h-96 animate-pulse rounded-xl bg-urblue-100/60" />;

  if (!application) {
    return (
      <Card className="mt-6 max-w-lg p-8">
        <h1 className="text-lg font-bold">Nomination not found</h1>
        <p className="mt-2 text-sm text-slate-600">It may have been removed, or it was submitted in a different browser.</p>
        <Link href="/officer/candidates" className={`${btn.primary} mt-5`}>Back to nominations</Link>
      </Card>
    );
  }

  return <ApplicationReview application={application} />;
}
