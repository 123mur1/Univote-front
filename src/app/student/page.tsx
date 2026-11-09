import type { Metadata } from "next";
import StudentDashboard from "./student-dashboard";

export const metadata: Metadata = { title: "Student dashboard" };

export default function StudentPage() { return <StudentDashboard />; }
