import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, btn } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { ElectionsTable } from "../../officer/elections/elections-table";

export const metadata: Metadata = { title: "Elections" };

export default function AdminElectionsPage() {
  return (
    <>
      <PageHeader
        title="Elections"
        description="Every election, its voting window and turnout. As administrator you can create elections, change their status and publish results."
        actions={<Link href="/officer/elections/new" className={btn.primary}><PlusIcon width={18} height={18} /> New election</Link>}
      />
      <ElectionsTable />
    </>
  );
}
