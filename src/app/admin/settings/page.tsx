import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "System settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="System settings"
        description="Session timeouts, sign-in security and student sign-up. Officer permissions are under Users & access; the academic year is under Registry & eligibility."
      />
      <SettingsForm />
    </>
  );
}
