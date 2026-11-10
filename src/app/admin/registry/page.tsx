import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { RegistryImportCard } from "@/components/registry-import-card";
import { RegistryBrowser } from "@/components/registry-browser";

export const metadata: Metadata = { title: "Registry & eligibility" };

export default function AdminRegistryPage() {
  return (
    <>
      <PageHeader
        title="Registry & eligibility"
        description="The student registry decides who may sign up, vote and stand. Import the registry office's file, add or correct individual students, and browse the list. The academic year is set in System settings."
      />
      <div className="mb-6"><RegistryImportCard /></div>
      <RegistryBrowser />
    </>
  );
}
