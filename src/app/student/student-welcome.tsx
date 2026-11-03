"use client";

import { useEffect, useState } from "react";
import { currentStudent } from "@/lib/data";
import { registeredStudents } from "@/lib/accounts";

export function StudentWelcome() {
  const [details, setDetails] = useState({ name: currentStudent.name, programme: currentStudent.program, year: currentStudent.year, college: `College of ${currentStudent.faculty}` });
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null");
      const student = registeredStudents().find((item) => item.id === session?.registeredStudentId);
      if (student) setDetails({ name: `${student.firstName} ${student.lastName}`, programme: student.programme, year: student.year, college: student.college });
      else if (session?.role === "student" && session.name) setDetails((previous) => ({ ...previous, name: session.name }));
    } catch {}
  }, []);
  return <div className="mb-8"><p className="text-sm font-medium text-urblue">Welcome back</p><h1 className="text-2xl font-bold tracking-tight">{details.name}</h1><p className="text-sm text-slate-600">{details.programme} · {details.year} · {details.college}</p></div>;
}
