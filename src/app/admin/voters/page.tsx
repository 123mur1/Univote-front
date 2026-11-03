import type { Metadata } from "next";
import { PageHeader, btn } from "@/components/ui";
import { voters } from "@/lib/data";
import { VoterTable } from "./voter-table";

export const metadata: Metadata = { title: "Voter roll" };

export default function VotersPage() {
  return (
    <>
      <PageHeader
        title="Voter roll"
        description="Eligibility is computed from the registrar's enrolment data. Officers can see whether a student has voted, never how they voted."
        actions={<button type="button" className={btn.secondary}>Sync from registry</button>}
      />
      <VoterTable voters={voters} />
    </>
  );
}
