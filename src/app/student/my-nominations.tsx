"use client";

import Link from "next/link";
import { docStatus, effectiveStatus, useReviews, useSubmissions } from "@/lib/review-store";
import { useCurrentStudent } from "@/lib/student-context";
import { Badge, Card } from "@/components/ui";
import { UserPlusIcon } from "@/components/icons";

const statusText = {
  pending: { tone: "amber", text: "Under review" },
  approved: { tone: "green", text: "Approved" },
  rejected: { tone: "red", text: "Rejected" },
} as const;

export function MyNominations() {
  const reviews = useReviews();
  const { regNumber } = useCurrentStudent();
  const mine = useSubmissions().filter((s) => s.studentId.toUpperCase() === regNumber.toUpperCase());

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <UserPlusIcon className="text-urblue" />
        <h2 className="font-semibold">My nominations</h2>
      </div>
      {mine.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          You haven&apos;t applied for any position.{" "}
          <Link href="/student/apply" className="font-medium text-urblue hover:underline">Run for office</Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {mine.map((a) => {
            const review = reviews[a.id];
            const status = effectiveStatus(a, review);
            const verified = a.documents.filter((d) => docStatus(a, d, review) === "verified").length;
            return (
              <li key={a.id} className="text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{a.contest}</p>
                    <p className="text-xs text-slate-500">{a.election} · submitted {a.submitted}</p>
                  </div>
                  <Badge tone={statusText[status].tone}>{statusText[status].text}</Badge>
                </div>
                {status === "pending" && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {verified}/{a.documents.length} documents verified by the officer so far
                  </p>
                )}
                {status !== "pending" && review?.note && (
                  <p className={`mt-1.5 rounded-md p-2 text-xs ${status === "approved" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                    Officer&apos;s note: {review.note}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
