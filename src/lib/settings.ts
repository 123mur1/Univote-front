"use client";

import { createStore } from "./local-store";
import { DEFAULT_ACADEMIC_YEAR, type AcademicYear } from "./registry";

export type Role = "student" | "officer" | "admin";

// What an election officer may do. The administrator switches these on or off.
export const OFFICER_PERMISSIONS = {
  manageElections: { label: "Create and edit elections", detail: "Set up elections, contests and voting windows." },
  reviewCandidates: { label: "Review and approve candidates", detail: "Verify documents and approve or reject nominations." },
  viewVoterRoll: { label: "View the voter roll", detail: "See students' eligibility and whether they have voted (never how)." },
  importRegistry: { label: "Import the student registry", detail: "Import the current eligible-student list from an Excel workbook or CSV file." },
  exportVoterRoll: { label: "Export the voter roll", detail: "Download the voter roll as CSV." },
  viewAuditLog: { label: "View the audit log", detail: "Read the hash-chained election audit log." },
} as const;

export type OfficerPermission = keyof typeof OFFICER_PERMISSIONS;

export type SystemSettings = {
  academicYear: AcademicYear;
  idleMinutes: Record<Role, number>;
  warningSeconds: number;
  otpRequired: { student: boolean; officer: boolean };
  passwordMinLength: number;
  maxFailedLogins: number;
  allowStudentSignup: boolean;
  officerPermissions: Record<OfficerPermission, boolean>;
};

export const DEFAULT_SETTINGS: SystemSettings = {
  academicYear: DEFAULT_ACADEMIC_YEAR,
  idleMinutes: { student: 10, officer: 15, admin: 20 },
  warningSeconds: 60,
  otpRequired: { student: true, officer: true },
  passwordMinLength: 10,
  maxFailedLogins: 5,
  allowStudentSignup: true,
  officerPermissions: { manageElections: true, reviewCandidates: true, viewVoterRoll: true, importRegistry: true, exportVoterRoll: false, viewAuditLog: true },
};

const store = createStore<Partial<SystemSettings>>("univote.settings.v1", {});

function merge(saved: Partial<SystemSettings>): SystemSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    idleMinutes: { ...DEFAULT_SETTINGS.idleMinutes, ...saved.idleMinutes },
    otpRequired: { ...DEFAULT_SETTINGS.otpRequired, ...saved.otpRequired },
    officerPermissions: { ...DEFAULT_SETTINGS.officerPermissions, ...saved.officerPermissions },
    academicYear: { ...DEFAULT_SETTINGS.academicYear, ...saved.academicYear },
  };
}

// Cached by input identity so useSyncExternalStore gets a stable snapshot.
let lastSaved: Partial<SystemSettings> | null = null;
let lastMerged: SystemSettings = DEFAULT_SETTINGS;
function mergedSnapshot(saved: Partial<SystemSettings>) {
  if (saved !== lastSaved) {
    lastSaved = saved;
    lastMerged = merge(saved);
  }
  return lastMerged;
}

export function readSettings(): SystemSettings {
  return mergedSnapshot(store.read());
}

export function useSettings(): SystemSettings {
  return mergedSnapshot(store.use());
}

export function saveSettings(next: SystemSettings) {
  store.write(next);
}

export function resetSettings() {
  store.clear();
}
