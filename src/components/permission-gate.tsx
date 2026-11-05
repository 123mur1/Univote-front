"use client";

import type { ReactNode } from "react";
import { useHydrated } from "@/lib/local-store";
import { OFFICER_PERMISSIONS, useSettings, type OfficerPermission } from "@/lib/settings";
import { Card } from "./ui";
import { LockIcon } from "./icons";

// Officer sections the system administrator can switch off in Settings → Officer permissions.
export function PermissionGate({ permission, children }: { permission: OfficerPermission; children: ReactNode }) {
  const settings = useSettings();
  const hydrated = useHydrated();
  if (!hydrated) return null;
  if (settings.officerPermissions[permission]) return <>{children}</>;
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <LockIcon width={32} height={32} className="mx-auto text-urblue" />
      <h1 className="mt-4 text-lg font-bold">You don&apos;t have access to this section</h1>
      <p className="mt-2 text-sm text-slate-600">
        &ldquo;{OFFICER_PERMISSIONS[permission].label}&rdquo; is switched off for election officers. Ask the system administrator if you need it.
      </p>
    </Card>
  );
}
