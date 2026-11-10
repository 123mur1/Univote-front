"use client";

import { apiRequest } from "./api-client";
import { DEFAULT_SETTINGS, saveSettings, type OfficerPermission } from "./settings";

const PERMISSION_KEYS: Record<string, OfficerPermission> = {
  MANAGE_ELECTIONS: "manageElections",
  REVIEW_CANDIDATES: "reviewCandidates",
  VIEW_VOTER_ROLL: "viewVoterRoll",
  IMPORT_REGISTRY: "importRegistry",
  EXPORT_VOTER_ROLL: "exportVoterRoll",
  VIEW_AUDIT_LOG: "viewAuditLog",
};

type ClientSettings = {
  academicYearLabel: string;
  academicYearStart: string;
  academicYearEnd: string;
  studentIdleMinutes: number;
  officerIdleMinutes: number;
  adminIdleMinutes: number;
  warningSeconds: number;
  studentOtpRequired: boolean;
  officerOtpRequired: boolean;
  passwordMinLength: number;
  maxFailedLogins: number;
  allowStudentSignup: boolean;
  officerPermissions: { permission: string; enabled: boolean }[];
};

// The server owns the settings; this browser keeps a cached copy so every page can read them
// synchronously (idle timeouts, officer permissions, academic year).
export async function syncSettingsFromServer() {
  const remote = await apiRequest<ClientSettings>("/settings/client");
  const officerPermissions = { ...DEFAULT_SETTINGS.officerPermissions };
  for (const row of remote.officerPermissions) {
    const key = PERMISSION_KEYS[row.permission];
    if (key) officerPermissions[key] = row.enabled;
  }
  saveSettings({
    ...DEFAULT_SETTINGS,
    academicYear: { label: remote.academicYearLabel, start: String(remote.academicYearStart).slice(0, 10), end: String(remote.academicYearEnd).slice(0, 10) },
    idleMinutes: { student: remote.studentIdleMinutes, officer: remote.officerIdleMinutes, admin: remote.adminIdleMinutes },
    warningSeconds: remote.warningSeconds,
    otpRequired: { student: remote.studentOtpRequired, officer: remote.officerOtpRequired },
    passwordMinLength: remote.passwordMinLength,
    maxFailedLogins: remote.maxFailedLogins,
    allowStudentSignup: remote.allowStudentSignup,
    officerPermissions,
  });
}
