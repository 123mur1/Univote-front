"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api-client";
import { OFFICER_PERMISSIONS, saveSettings, useSettings, type OfficerPermission } from "@/lib/settings";
import { Card } from "@/components/ui";
import { CheckIcon, LockIcon, XIcon } from "@/components/icons";

const SERVER_KEY: Record<OfficerPermission, string> = {
  manageElections: "MANAGE_ELECTIONS",
  reviewCandidates: "REVIEW_CANDIDATES",
  viewVoterRoll: "VIEW_VOTER_ROLL",
  importRegistry: "IMPORT_REGISTRY",
  exportVoterRoll: "EXPORT_VOTER_ROLL",
  viewAuditLog: "VIEW_AUDIT_LOG",
};

// The administrator has every capability except seeing how anyone voted; "Election office" in the
// admin menu opens the officer tools.
const MATRIX: { capability: string; student: boolean; officer: boolean | OfficerPermission; admin: boolean }[] = [
  { capability: "Vote in elections they're eligible for", student: true, officer: false, admin: false },
  { capability: "Submit a candidate nomination", student: true, officer: false, admin: false },
  { capability: "Create elections and publish results", student: false, officer: "manageElections", admin: true },
  { capability: "Review and approve candidates", student: false, officer: "reviewCandidates", admin: true },
  { capability: "View the eligibility list and voter roll", student: false, officer: "viewVoterRoll", admin: true },
  { capability: "Import or edit the eligibility list", student: false, officer: "importRegistry", admin: true },
  { capability: "Export the voter roll", student: false, officer: "exportVoterRoll", admin: true },
  { capability: "View the election audit log", student: true, officer: "viewAuditLog", admin: true },
  { capability: "View analytics and export any dataset", student: false, officer: false, admin: true },
  { capability: "Create, suspend and unlock accounts; reset credentials", student: false, officer: false, admin: true },
  { capability: "Sign in as a user to help them (voting disabled)", student: false, officer: false, admin: true },
  { capability: "Change security settings", student: false, officer: false, admin: true },
  { capability: "See how any individual voted", student: false, officer: false, admin: false },
];

export function RolesAndPermissions() {
  const settings = useSettings();
  const [saving, setSaving] = useState<OfficerPermission | null>(null);
  const [error, setError] = useState("");

  async function toggle(p: OfficerPermission) {
    const next = !settings.officerPermissions[p];
    setSaving(p);
    setError("");
    try {
      await apiRequest("/settings/officer-permissions", { method: "PUT", body: JSON.stringify({ permission: SERVER_KEY[p], enabled: next }) });
      saveSettings({ ...settings, officerPermissions: { ...settings.officerPermissions, [p]: next } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the permission.");
    } finally {
      setSaving(null);
    }
  }

  const cell = (v: boolean) =>
    v ? <CheckIcon width={18} height={18} className="mx-auto text-emerald-600" aria-label="Allowed" /> : <XIcon width={18} height={18} className="mx-auto text-slate-300" aria-label="Not allowed" />;

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <Card className="p-5 xl:col-span-2">
        <h2 className="font-semibold">Election officer permissions</h2>
        <p className="mt-1 text-sm text-slate-600">Switch these off to remove a section from every officer&apos;s menu. Saved on the server and applied at the officers&apos; next page load.</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">{error}</p>}
        <ul className="mt-4 space-y-3">
          {(Object.keys(OFFICER_PERMISSIONS) as OfficerPermission[]).map((p) => (
            <li key={p} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium">{OFFICER_PERMISSIONS[p].label}</p>
                <p className="text-xs text-slate-500">{OFFICER_PERMISSIONS[p].detail}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.officerPermissions[p]}
                aria-label={OFFICER_PERMISSIONS[p].label}
                disabled={saving !== null}
                onClick={() => toggle(p)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${settings.officerPermissions[p] ? "bg-urblue" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${settings.officerPermissions[p] ? "left-5.5" : "left-0.5"}`} />
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="overflow-hidden xl:col-span-3">
        <div className="p-5 pb-3">
          <h2 className="font-semibold">Who can do what</h2>
          <p className="text-sm text-slate-600">No role, including administrator, can see how an individual voted.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>
                <th className="px-5 py-2.5 text-left font-semibold">Capability</th>
                <th className="px-3 py-2.5 font-semibold">Student</th>
                <th className="px-3 py-2.5 font-semibold">Officer</th>
                <th className="px-3 py-2.5 font-semibold">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX.map((m) => (
                <tr key={m.capability}>
                  <td className="px-5 py-2.5">{m.capability}</td>
                  <td className="px-3 py-2.5">{cell(m.student)}</td>
                  <td className="px-3 py-2.5">
                    {typeof m.officer === "string" ? (
                      <span className="flex items-center justify-center gap-1">
                        {cell(settings.officerPermissions[m.officer])}
                        <LockIcon width={12} height={12} className="text-slate-400" aria-label="Set by administrator" />
                      </span>
                    ) : (
                      cell(m.officer)
                    )}
                  </td>
                  <td className="px-3 py-2.5">{cell(m.admin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
