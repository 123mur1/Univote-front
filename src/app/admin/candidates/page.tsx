import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { applications } from "@/lib/data";
import { ApplicationsTable } from "./applications-table";

export const metadata: Metadata = { title: "Candidate nominations" };

export default function CandidatesPage() {
  return (
    <>
      <PageHeader
        title="Review applicants"
        description="Open each nomination to check the submitted documents and details against the registry before approving. Every decision is logged with your name."
      />
      <ApplicationsTable initial={applications} />
    </>
  );
}
