"use client";

import Link from "next/link";
import { useCreatedElections } from "@/lib/election-store";
import { Card, StatusBadge } from "@/components/ui";

export function CreatedElectionsPreview() {
  const elections = useCreatedElections();
  if (!elections.length) return null;
  return <>
    {elections.map((election) => <Link key={election.id} href={`/elections/${election.id}`} className="group">
      <Card className="h-full p-6 transition group-hover:border-urblue-300 group-hover:shadow-md">
        <StatusBadge status={election.status} />
        <h3 className="mt-4 text-lg font-semibold group-hover:text-urblue">{election.title}</h3>
        <p className="mt-1 text-sm text-slate-500">{election.scope}</p>
        <p className="mt-5 text-sm text-slate-600">Nominations close {election.nominationsClose}</p>
      </Card>
    </Link>)}
  </>;
}
