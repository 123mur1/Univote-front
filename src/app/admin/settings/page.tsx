import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";
import { RolesAndPermissions } from "./roles-permissions";

export const metadata: Metadata = { title: "System settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="System settings"
        description="Manage account security, student sign-up, roles and election officer permissions. Changes are saved on the server and apply to every portal."
      />
      <SettingsForm />
      <section className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-urblue-darker">Roles & permissions</h2>
        <RolesAndPermissions />
      </section>
    </>
  );
}
