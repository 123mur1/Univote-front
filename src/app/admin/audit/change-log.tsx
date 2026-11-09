"use client";

import { useActivity } from "@/lib/activity";
import { Badge, Card } from "@/components/ui";
import { useApiActivity } from "@/lib/activity-api";

export function AdminChangeLog() {
  const changes = useActivity();
  const backendChanges = useApiActivity();
  const visibleChanges = backendChanges ?? changes;
  return <section className="mt-8 space-y-3">
    <div><h2 className="text-xl font-semibold text-urblue-darker">User activity & change history</h2><p className="text-sm text-slate-600">Actions recorded for students, election officers, administrators and anonymous visitors, newest first.</p></div>
    <Card className="overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-urblue text-xs uppercase tracking-wider text-white"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Actor / role</th><th className="px-4 py-3">What changed</th><th className="px-4 py-3">Before</th><th className="px-4 py-3">After</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{visibleChanges.map((entry) => <tr key={entry.id} className="align-top">
          <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{new Date(entry.at).toLocaleString("en-GB")}</td>
          <td className="px-4 py-3"><p className="font-medium">{entry.actor}</p><Badge tone={entry.type === "logout" || entry.type === "timeout" ? "red" : entry.role === "admin" ? "amber" : "blue"}>{entry.role}</Badge></td>
          <td className="px-4 py-3">{entry.detail}</td><td className="max-w-sm whitespace-pre-wrap break-words px-4 py-3 text-xs text-slate-600">{entry.before ?? "Not applicable / not recorded"}</td><td className="max-w-sm whitespace-pre-wrap break-words px-4 py-3 text-xs text-slate-600">{entry.after ?? "Not applicable / not recorded"}</td>
        </tr>)}{changes.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No user activity has been recorded yet.</td></tr>}</tbody>
      </table></div>
    </Card>
  </section>;
}
