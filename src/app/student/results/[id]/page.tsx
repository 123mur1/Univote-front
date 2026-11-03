import { Suspense } from "react";
import Link from "next/link";
import { elections } from "@/lib/data";
import { ResultDetails } from "@/components/views/result-details";
import { ArrowLeftIcon } from "@/components/icons";

export function generateStaticParams() {
  return elections.filter((e) => e.status === "published").map((e) => ({ id: e.id }));
}

export default function ResultPage({ params }: PageProps<"/student/results/[id]">) {
  return (
    <>
      <Link href="/student/results" className="inline-flex items-center gap-1.5 text-sm font-medium text-urblue hover:underline">
        <ArrowLeftIcon width={16} height={16} /> All results
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-xl bg-urblue-50" />}>
        <ResultDetails params={params} base="/student" />
      </Suspense>
    </>
  );
}
