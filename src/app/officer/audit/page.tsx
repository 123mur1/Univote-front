import type { Metadata } from "next";
import { AuditTable } from "@/components/audit-table";
import { PageHeader, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Audit log" };

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Append-only, hash-chained record of every sensitive action. Officers cannot edit or delete entries; the same log is public."
        actions={<button type="button" className={btn.secondary}>Export CSV</button>}
      />
      <AuditTable />
    </>
  );
}
