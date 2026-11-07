import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NewElectionForm } from "./new-election-form";

export const metadata: Metadata = { title: "New election" };

export default function NewElectionPage() {
  return (
    <>
      <PageHeader
        title="Create an election"
        description="Create the election immediately. Students can nominate until the deadline, and voting opens on schedule."
      />
      <NewElectionForm />
    </>
  );
}
