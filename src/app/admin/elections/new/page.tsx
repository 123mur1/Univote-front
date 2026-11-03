import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NewElectionForm } from "./new-election-form";

export const metadata: Metadata = { title: "New election" };

export default function NewElectionPage() {
  return (
    <>
      <PageHeader
        title="Create an election"
        description="Set up the election, its contests and who can vote. Locking the ballot needs sign-off from a second commission member."
      />
      <NewElectionForm />
    </>
  );
}
