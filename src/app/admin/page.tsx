import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ChartIcon } from "@/components/icons";
import { AdminOverview } from "./overview";

export const metadata: Metadata = { title: "Overview & analytics" };

export default function AdminHome() {
  return (
    <>
      <PageHeader
        eyebrow="System administration"
        icon={<ChartIcon width={24} height={24} />}
        title="Overview & analytics"
        description="System-wide picture of students, eligibility, accounts, elections, turnout and security. Filter by college, campus and period."
      />
      <AdminOverview />
    </>
  );
}
