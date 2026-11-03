import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify my vote" };

export default function VerifyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Verify your ballot"
        description="Enter the receipt code you got after voting. We check that your encrypted ballot is on the public bulletin board and was included in the tally. The receipt reveals nothing about who you voted for."
      />
      <VerifyForm />
    </div>
  );
}
