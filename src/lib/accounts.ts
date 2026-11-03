"use client";

export type RegisteredStudent = {
  id: string;
  firstName: string;
  lastName: string;
  registrationNumber: string;
  email: string;
  passwordHash: string;
  phone: string;
  department: string;
  faculty: string;
  school: string;
  campus: string;
  college: string;
  programme: string;
  year: string;
  studyEndDate: string;
  studentCardName: string;
  studentCardData: string;
  votedElectionIds: string[];
};

export type ManagedOfficer = { name: string; email: string; passwordHash: string; active: boolean };

const STUDENTS_KEY = "univote.registered-students.v1";
const OFFICERS_KEY = "univote.managed-officers.v1";

function read<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

export const registeredStudents = () => read<RegisteredStudent>(STUDENTS_KEY);
export const managedOfficers = () => read<ManagedOfficer>(OFFICERS_KEY);

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150_000 }, key, 256);
  const encode = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${encode(salt)}:${encode(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, expected] = stored.split(":");
  if (!saltHex || !expected) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((pair) => parseInt(pair, 16)) ?? []);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 150_000 }, key, 256);
  const actual = Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return actual === expected;
}

export function saveRegisteredStudent(student: RegisteredStudent) {
  const all = registeredStudents();
  if (all.some((item) => item.email.toLowerCase() === student.email.toLowerCase())) return "That email is already registered.";
  if (all.some((item) => item.registrationNumber.toLowerCase() === student.registrationNumber.toLowerCase())) return "That registration number is already registered.";
  try {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify([student, ...all]));
    return null;
  } catch {
    return "This browser cannot store the student card. Use a file under 2 MB or connect the secured backend.";
  }
}

export function updateRegisteredStudent(id: string, patch: Partial<RegisteredStudent>) {
  const all = registeredStudents();
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(all.map((item) => item.id === id ? { ...item, ...patch } : item)));
}

export function addManagedOfficer(officer: ManagedOfficer) {
  const all = managedOfficers();
  if (all.some((item) => item.email.toLowerCase() === officer.email.toLowerCase())) return "An officer with that email already exists.";
  localStorage.setItem(OFFICERS_KEY, JSON.stringify([officer, ...all]));
  return null;
}

export function updateManagedOfficer(email: string, patch: Partial<ManagedOfficer>) {
  const all = managedOfficers();
  localStorage.setItem(OFFICERS_KEY, JSON.stringify(all.map((item) => item.email === email ? { ...item, ...patch } : item)));
}
