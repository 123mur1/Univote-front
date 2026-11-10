import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, btn } from "@/components/ui";
import { VoterTable } from "./voter-table";

export const metadata: Metadata = { title: "Voter roll" };

export default function VotersPage() {
  return (
    <>
      <PageHeader
        title="Voter roll"
        description="Eligible students for each election and whether they have voted. How anyone voted is never shown."
        actions={<Link href="/officer/registry" className={btn.secondary}>Eligibility list</Link>}
      />
      <VoterTable elections={[]} />
    </>
  );
}
