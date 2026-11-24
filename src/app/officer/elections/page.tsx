import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, btn } from "@/components/ui";
import { PlusIcon } from "@/components/icons";
import { ElectionsTable } from "./elections-table";

export const metadata: Metadata = { title: "Manage elections" };

export default function AdminElectionsPage() {
  return (
    <>
      <PageHeader
        title="Elections"
        description="Create elections, set voting windows and manage contests. Once voting opens the ballot is locked."
        actions={
          <Link href="/officer/elections/new" className={btn.primary}>
            <PlusIcon width={18} height={18} /> New election
          </Link>
        }
      />
      <ElectionsTable />
    </>
  );
}
