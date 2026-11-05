"use client";

import { fullName } from "@/lib/registry";
import { useSession } from "@/lib/session";
import { useCurrentStudent } from "@/lib/student-context";

export function StudentWelcome() {
  const session = useSession();
  const { record } = useCurrentStudent();
  const name = record ? fullName(record) : session?.name ?? "Student";
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-urblue">Welcome back</p>
      <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
      {record && (
        <p className="text-sm text-slate-600">
          {record.programme} · Year {record.yearOfStudy} · {record.school}, {record.college}
        </p>
      )}
    </div>
  );
}
