import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { AdminOverview } from "./overview";

export const metadata: Metadata = { title: "Overview & analytics" };

export default function AdminHome() {
  return (
    <>
      <PageHeader
        title="Overview & analytics"
        description="System-wide picture of students, eligibility, accounts, elections, turnout and security. Filter by college, campus and period."
      />
      <AdminOverview />
    </>
  );
}
