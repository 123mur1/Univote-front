"use client";

import Link from "next/link";
import { elections } from "@/lib/data";
import { useCreatedElections } from "@/lib/election-store";
import { Card, StatusBadge, formatNumber, percent } from "@/components/ui";
import { PublishResultsButton } from "./publish-results-button";
import { DeleteElectionButton } from "./delete-election-button";
import { useApiElections } from "@/lib/election-api";
import { readSession } from "@/lib/session";
import { ElectionStatusAction } from "./election-status-action";

export function ElectionsTable() {
  const created = useCreatedElections();
  const fromApi = useApiElections();
  const apiIds = new Set(fromApi.map((item) => item.id));
  const allElections = [...fromApi, ...created.filter((e) => !apiIds.has(e.id)), ...elections.filter((e) => !apiIds.has(e.id) && !created.some((item) => item.id === e.id))];
  const backendSession = Boolean(readSession()?.accessToken);

  return <Card className="overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark"><tr>
          <th className="px-5 py-3 font-semibold">Election</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Voting window</th><th className="px-5 py-3 font-semibold">Contests</th><th className="px-5 py-3 font-semibold">Turnout</th><th className="px-5 py-3">Actions</th>
        </tr></thead>
        <tbody className="divide-y divide-slate-100">{allElections.map((e) => <tr key={e.id} className="hover:bg-urblue-50/50">
          <td className="px-5 py-4"><p className="font-medium">{e.title}</p><p className="text-xs text-slate-500">{e.scope}</p></td>
          <td className="px-5 py-4"><StatusBadge status={e.status} /></td>
          <td className="px-5 py-4 text-slate-600">{e.opens}<br />{e.closes}</td>
          <td className="px-5 py-4">{e.contests.length}</td>
          <td className="px-5 py-4">{e.ballotsCast ? `${percent(e.ballotsCast, e.eligibleVoters)} (${formatNumber(e.ballotsCast)})` : "—"}</td>
          <td className="px-5 py-4 text-right"><div className="flex items-center justify-end gap-4">
            <Link href={`/officer/elections/${e.id}`} className="font-medium text-urblue hover:underline">View</Link>
            {backendSession && apiIds.has(e.id) && <ElectionStatusAction election={e} />}
            {e.status === "closed" || e.status === "published" ? <PublishResultsButton electionId={e.id} /> : <span className="text-xs text-slate-400">Available after voting closes</span>}
            {!backendSession && created.some((item) => item.id === e.id) && <DeleteElectionButton electionId={e.id} title={e.title} />}
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
  </Card>;
}
