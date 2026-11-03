"use client";

import { useState } from "react";
import type { Voter } from "@/lib/data";
import { Badge, Card, input } from "@/components/ui";
import { SearchIcon } from "@/components/icons";

export function VoterTable({ voters }: { voters: Voter[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = q
    ? voters.filter((v) => v.name.toLowerCase().includes(q) || v.studentId.toLowerCase().includes(q) || v.faculty.toLowerCase().includes(q))
    : voters;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <div className="relative max-w-sm">
          <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, student ID or faculty"
            className={`${input} pl-10`}
            aria-label="Search voters"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
            <tr>
              <th className="px-5 py-3 font-semibold">Student</th>
              <th className="px-5 py-3 font-semibold">Faculty</th>
              <th className="px-5 py-3 font-semibold">Enrolment</th>
              <th className="px-5 py-3 font-semibold">Eligible</th>
              <th className="px-5 py-3 font-semibold">Voted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((v) => (
              <tr key={v.studentId} className="hover:bg-urblue-50/50">
                <td className="px-5 py-3">
                  <p className="font-medium">{v.name}</p>
                  <p className="font-mono text-xs text-slate-500">{v.studentId}</p>
                </td>
                <td className="px-5 py-3">{v.faculty} · {v.year}</td>
                <td className="px-5 py-3">
                  <Badge tone={v.enrolment === "Active" ? "green" : v.enrolment === "Suspended" ? "red" : "amber"}>{v.enrolment}</Badge>
                </td>
                <td className="px-5 py-3">{v.eligible ? <Badge tone="blue">Eligible</Badge> : <Badge tone="gray">Not eligible</Badge>}</td>
                <td className="px-5 py-3 text-slate-600">{v.voted ? "Yes" : "Not yet"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500">No students match “{query}”.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Showing {rows.length} of 12,480 students (sample data)
      </p>
    </Card>
  );
}
