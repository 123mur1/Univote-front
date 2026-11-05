"use client";

import { createStore } from "./local-store";

// A student account only holds credentials and contact details. Academic details are always read
// from the registry, so nothing the student typed can make them eligible.
export type RegisteredStudent = {
  id: string;
  regNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passwordHash: string;
  studentCardName: string;
  studentCardData: string;
  createdAt: string;
  createdForAcademicYear: string;
  suspended?: boolean;
  failedLogins?: number;
  lastLoginAt?: string;
};

export type StaffRole = "officer" | "admin";

export type ManagedStaff = {
  name: string;
  email: string;
  role: StaffRole;
  passwordHash: string;
  active: boolean;
  createdAt: string;
  failedLogins?: number;
  lastLoginAt?: string;
};

const studentStore = createStore<RegisteredStudent[]>("univote.registered-students.v2", []);
const staffStore = createStore<ManagedStaff[]>("univote.managed-staff.v1", []);

export const useRegisteredStudents = studentStore.use;
export const useManagedStaff = staffStore.use;
export const registeredStudents = studentStore.read;
export const managedStaff = staffStore.read;

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: 150_000 }, key, 256);
  return toHex(new Uint8Array(bits));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${toHex(salt)}:${await derive(password, salt)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, expected] = stored.split(":");
  if (!saltHex || !expected) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);
  return (await derive(password, salt)) === expected;
}

export function saveRegisteredStudent(student: RegisteredStudent) {
  const all = registeredStudents();
  if (all.some((s) => s.regNumber.toUpperCase() === student.regNumber.toUpperCase())) return "An account already exists for this registration number. Sign in instead.";
  if (all.some((s) => s.email.toLowerCase() === student.email.toLowerCase())) return "That email is already used by another account.";
  try {
    studentStore.write([student, ...all]);
    return null;
  } catch {
    return "This browser cannot store the student card. Use a file under 2 MB.";
  }
}

export function updateRegisteredStudent(id: string, patch: Partial<RegisteredStudent>) {
  studentStore.write(registeredStudents().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function deleteRegisteredStudent(id: string) {
  studentStore.write(registeredStudents().filter((s) => s.id !== id));
}

export function addManagedStaff(staff: ManagedStaff) {
  const all = managedStaff();
  if (all.some((s) => s.email.toLowerCase() === staff.email.toLowerCase())) return "A staff account with that email already exists.";
  staffStore.write([staff, ...all]);
  return null;
}

export function updateManagedStaff(email: string, patch: Partial<ManagedStaff>) {
  staffStore.write(managedStaff().map((s) => (s.email === email ? { ...s, ...patch } : s)));
}
