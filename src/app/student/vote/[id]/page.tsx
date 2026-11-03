import { Suspense } from "react";
import { notFound } from "next/navigation";
import { elections, getElection } from "@/lib/data";
import { Card, StatusBadge } from "@/components/ui";
import { Ballot } from "./ballot";

export function generateStaticParams() {
  return elections.map((e) => ({ id: e.id }));
}

export default function VotePage({ params }: PageProps<"/student/vote/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-urblue-100/60" />}>
      <VoteContent params={params} />
    </Suspense>
  );
}

async function VoteContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const election = getElection(id);
  if (!election) notFound();

  if (election.status !== "open") {
    return (
      <Card className="mx-auto max-w-xl p-8 text-center">
        <StatusBadge status={election.status} />
        <h1 className="mt-4 text-xl font-bold">{election.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Voting is not open for this election. It runs {election.opens} – {election.closes}.
        </p>
      </Card>
    );
  }

  return <Ballot election={election} />;
}
