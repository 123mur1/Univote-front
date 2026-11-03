import { auditLog } from "@/lib/data";
import { Badge, Card, HashText } from "./ui";
import { CheckCircleIcon } from "./icons";

const roleTone = {
  System: "gray",
  "Election Officer": "blue",
  Administrator: "amber",
  Auditor: "green",
  Voter: "blue",
} as const;

export function AuditTable() {
  const entries = [...auditLog].reverse();
  return (
    <>
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <CheckCircleIcon width={18} height={18} />
        Chain intact: all {auditLog.length} entries link to the previous hash. Head{" "}
        <HashText value={auditLog[auditLog.length - 1].hash} size={12} />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-urblue text-xs uppercase tracking-wider text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Hash / previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((e) => (
                <tr key={e.seq} className="align-top hover:bg-urblue-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{e.seq}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{e.time}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{e.actor}</p>
                    <Badge tone={roleTone[e.role]}>{e.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{e.action}</td>
                  <td className="space-y-1 px-4 py-3">
                    <div><HashText value={e.hash} /></div>
                    <div className="text-xs text-slate-400">← <HashText value={e.prevHash} size={6} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
