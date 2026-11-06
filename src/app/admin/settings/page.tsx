import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";
import { RolesAndPermissions } from "../users/user-access";

export const metadata: Metadata = { title: "System settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="System settings"
        description="Manage account security, student sign-up, roles and election officer permissions. The academic year is under Registry & eligibility."
      />
      <SettingsForm />
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-urblue-darker">Roles & permissions</h2>
        <RolesAndPermissions />
      </section>
    </>
  );
}
