import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { VoterTable } from "../../officer/voters/voter-table";

export const metadata: Metadata = { title: "Voter roll" };

export default function AdminVotersPage() {
  return (
    <>
      <PageHeader title="Voter roll" description="Eligible students and turnout by election. Vote choices remain secret." />
      <VoterTable elections={[]} allowExport />
    </>
  );
}
