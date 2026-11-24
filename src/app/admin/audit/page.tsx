import type { Metadata } from "next";
import { AuditTable } from "@/components/audit-table";
import { PageHeader } from "@/components/ui";
import { AdminChangeLog } from "./change-log";

export const metadata: Metadata = { title: "Election audit log" };

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader
        title="Election audit log"
        description="Election actions remain in the append-only hash chain. The activity history below records actions from every role with date, actor, role, and before and after details where available."
      />
      <AuditTable />
      <AdminChangeLog />
    </>
  );
}
