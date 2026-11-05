import type { Metadata } from "next";
import { AuditTable } from "@/components/audit-table";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Election audit log" };

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader
        title="Election audit log"
        description="The append-only, hash-chained record of election actions. Nobody can edit or delete entries, including administrators."
      />
      <AuditTable />
    </>
  );
}
