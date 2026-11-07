import { Suspense } from "react";
import Link from "next/link";
import { elections } from "@/lib/data";
import { ElectionDetails } from "@/components/views/election-details";
import { ArrowLeftIcon } from "@/components/icons";

export function generateStaticParams() {
  return elections.map((e) => ({ id: e.id }));
}

export default async function ElectionPage({ params }: PageProps<"/student/elections/[id]">) {
  const { id } = await params;
  return (
    <>
      <Link href="/student/elections" className="inline-flex items-center gap-1.5 text-sm font-medium text-urblue hover:underline">
        <ArrowLeftIcon width={16} height={16} /> All elections
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-xl bg-urblue-50" />}>
        <ElectionDetails id={id} base="/student" />
      </Suspense>
    </>
  );
}
