import type { Metadata } from "next";
import { elections } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ElectionsOverview } from "./elections-overview";

export const metadata: Metadata = { title: "Elections" };

export default function AdminElectionsPage() {
  return (
    <>
      <PageHeader
        title="Elections"
        description="Every election's eligibility rule, electorate and turnout, computed live from the registry. Election officers run the elections themselves."
      />
      <ElectionsOverview elections={elections} />
    </>
  );
}
