import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UserAccess } from "./user-access";

export const metadata: Metadata = { title: "Users & access" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users & access"
        description="Create and manage staff accounts, look after student accounts, and decide what election officers are allowed to do."
      />
      <UserAccess />
    </>
  );
}
