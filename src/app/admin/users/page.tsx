import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UserManagement } from "./user-management";

export const metadata: Metadata = { title: "Manage users" };

export default function UsersPage() {
  return <><PageHeader title="Manage users" description="Verify student records and create or suspend election officer accounts. Officer access is administrator-managed." /><UserManagement /></>;
}
