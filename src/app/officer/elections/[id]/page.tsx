import { Suspense } from "react";
import Link from "next/link";
import { elections, staticParamsFor } from "@/lib/data";
import { ElectionDetails } from "@/components/views/election-details";
import { ArrowLeftIcon } from "@/components/icons";

export function generateStaticParams() {
  return staticParamsFor(elections.map((e) => e.id));
}

export default async function OfficerElectionPage({ params }: PageProps<"/officer/elections/[id]">) {
  const { id } = await params;
  return (
    <>
      <Link href="/officer/elections" className="inline-flex items-center gap-1.5 text-sm font-medium text-urblue hover:underline">
        <ArrowLeftIcon width={16} height={16} /> Back to elections
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-xl bg-urblue-50" />}>
        <ElectionDetails id={id} base="/officer" />
      </Suspense>
    </>
  );
}
