import type { Metadata } from "next";
import Link from "next/link";
import { elections } from "@/lib/data";
import { Card, PageHeader, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Manage elections" };

export default function AdminElectionsPage() {
  return (
    <>
      <PageHeader
        title="Elections"
        description="Create elections, set voting windows and manage contests. Once voting opens the ballot is locked."
        actions={
          <Link href="/admin/elections/new" className={btn.primary}>
            <PlusIcon width={18} height={18} /> New election
          </Link>
        }
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
              <tr>
                <th className="px-5 py-3 font-semibold">Election</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Voting window</th>
                <th className="px-5 py-3 font-semibold">Contests</th>
                <th className="px-5 py-3 font-semibold">Turnout</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elections.map((e) => (
                <tr key={e.id} className="hover:bg-urblue-50/50">
                  <td className="px-5 py-4">
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.scope}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-4 text-slate-600">{e.opens}<br />{e.closes}</td>
                  <td className="px-5 py-4">{e.contests.length}</td>
                  <td className="px-5 py-4">
                    {e.ballotsCast ? `${percent(e.ballotsCast, e.eligibleVoters)} (${formatNumber(e.ballotsCast)})` : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/elections/${e.id}`} className="font-medium text-urblue hover:underline">View</Link>
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
