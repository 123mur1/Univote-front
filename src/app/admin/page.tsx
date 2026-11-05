import type { Metadata } from "next";
import { elections } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { AdminOverview } from "./overview";

export const metadata: Metadata = { title: "Overview & analytics" };

export default function AdminHome() {
  return (
    <>
      <PageHeader
        title="Overview & analytics"
        description="System-wide picture of students, eligibility, accounts, turnout and security. Filter by election, college and campus."
      />
      <AdminOverview elections={elections} />
    </>
  );
}
