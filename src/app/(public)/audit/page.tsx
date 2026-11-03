import type { Metadata } from "next";
import { AuditTable } from "@/components/audit-table";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Audit log" };

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Public audit log"
        description="Every sensitive election action is recorded here. Each entry contains the hash of the one before it, so deleting or editing any entry breaks the chain."
      />
      <AuditTable />
    </div>
  );
}
