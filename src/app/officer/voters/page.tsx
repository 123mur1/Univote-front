import type { Metadata } from "next";
import { elections } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { RegistryImportCard } from "@/components/registry-import-card";
import { VoterTable } from "./voter-table";

export const metadata: Metadata = { title: "Voter roll" };

export default function VotersPage() {
  return (
    <>
      <PageHeader
        title="Voter roll"
        description="Review the current eligible-student list and turnout. Import the registry office's approved Excel or CSV file before an election."
      />
      <div className="mb-6">
        <PermissionGate permission="importRegistry">
          <RegistryImportCard />
        </PermissionGate>
      </div>
      <VoterTable elections={elections.filter((e) => e.status !== "published")} />
    </>
  );
}
