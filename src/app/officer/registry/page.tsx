"use client";

import { PageHeader } from "@/components/ui";
import { PermissionGate } from "@/components/permission-gate";
import { RegistryImportCard } from "@/components/registry-import-card";
import { RegistryBrowser } from "@/components/registry-browser";
import { useSession } from "@/lib/session";
import { useSettings } from "@/lib/settings";

export default function OfficerRegistryPage() {
  const session = useSession();
  const settings = useSettings();
  const canImport = session?.role === "admin" || settings.officerPermissions.importRegistry;
  return (
    <PermissionGate permission="viewVoterRoll">
      <PageHeader
        title="Eligibility list"
        description={`The registry office's list of students for ${settings.academicYear.label}. Only students on this list can create an account, vote or stand as candidates.`}
      />
      {canImport && <div className="mb-6"><RegistryImportCard /></div>}
      <RegistryBrowser canAdd={canImport} />
    </PermissionGate>
  );
}
