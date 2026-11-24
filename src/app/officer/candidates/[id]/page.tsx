import { Suspense } from "react";
import Link from "next/link";
import { applications, getApplication, staticParamsFor } from "@/lib/data";
import { ArrowLeftIcon } from "@/components/icons";
import { ApplicationReview } from "./application-review";
import { SubmittedReview } from "./submitted-review";

export function generateStaticParams() {
  return staticParamsFor(applications.map((a) => a.id));
}

export default function ReviewPage({ params }: PageProps<"/officer/candidates/[id]">) {
  return (
    <>
      <Link href="/officer/candidates" className="inline-flex items-center gap-1.5 text-sm font-medium text-urblue hover:underline">
        <ArrowLeftIcon width={16} height={16} /> All nominations
      </Link>
      <Suspense fallback={<div className="mt-6 h-96 animate-pulse rounded-xl bg-urblue-100/60" />}>
        <ReviewContent params={params} />
      </Suspense>
    </>
  );
}

async function ReviewContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = getApplication(id);
  if (application) return <ApplicationReview application={application} />;
  return <SubmittedReview id={id} />;
}
