import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ApplyForm } from "./apply-form";

export const metadata: Metadata = { title: "Run for office" };

export default function ApplyPage() {
  return (
    <>
      <PageHeader
        title="Run for office"
        description="Submit your nomination. The Electoral Commission checks your eligibility and approves or rejects it. Every decision is recorded in the audit log."
      />
      <ApplyForm />
    </>
  );
}
