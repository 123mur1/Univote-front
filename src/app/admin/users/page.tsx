import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UsersAdmin } from "./users-admin";

export const metadata: Metadata = { title: "Users & access" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Users & access"
        description="Every student, officer and administrator account. Create accounts, reset credentials, suspend access, or sign in as a user to help them with a problem."
      />
      <UsersAdmin />
    </>
  );
}
