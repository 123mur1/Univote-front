import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
<<<<<<< HEAD
import { ChartIcon } from "@/components/icons";
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
import { AdminOverview } from "./overview";

export const metadata: Metadata = { title: "Overview & analytics" };

export default function AdminHome() {
  return (
    <>
      <PageHeader
<<<<<<< HEAD
        eyebrow="System administration"
        icon={<ChartIcon width={24} height={24} />}
=======
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
        title="Overview & analytics"
        description="System-wide picture of students, eligibility, accounts, elections, turnout and security. Filter by college, campus and period."
      />
      <AdminOverview />
    </>
  );
}
