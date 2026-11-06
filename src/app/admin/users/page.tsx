import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UserAccess } from "./user-access";

export const metadata: Metadata = { title: "Users & access" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users & access"
        description="Create accounts and manage staff and student access. Configure roles and permissions in System settings."
      />
      <UserAccess />
    </>
  );
}
