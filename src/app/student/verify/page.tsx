import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { VerifyForm } from "@/app/(public)/verify/verify-form";

export const metadata: Metadata = { title: "Verify my ballot" };

export default function StudentVerifyPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Verify your ballot"
        description="Enter the receipt code you got after voting. We check that your encrypted ballot is on the public bulletin board and was included in the tally. The receipt reveals nothing about who you voted for."
      />
      <VerifyForm />
    </div>
  );
}
