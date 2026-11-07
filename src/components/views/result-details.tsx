import Link from "next/link";
import { notFound } from "next/navigation";
import { getElection } from "@/lib/data";
import { CandidatePhoto, Card, HashText, StatCard, formatNumber, percent } from "@/components/ui";
import { BallotIcon, ChartIcon, CheckCircleIcon, ShieldIcon, UsersIcon } from "@/components/icons";

// Shared by the public site (base "") and the student portal (base "/student").
export async function ResultDetails({ params, base = "" }: { params: Promise<{ id: string }>; base?: string }) {
  const { id } = await params;
  const election = getElection(id);
  if (!election) notFound();

  const totalValid = election.contests.reduce(
    (sum, c) => Math.max(sum, c.candidates.reduce((s, x) => s + (x.votes ?? 0), 0)),
    0,
  );

  return (
    <>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">{election.title}</h1>
      <p className="mt-1 text-slate-600">Official results · voting closed {election.closes}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Eligible voters" value={formatNumber(election.eligibleVoters)} icon={<UsersIcon />} />
        <StatCard label="Ballots cast" value={formatNumber(election.ballotsCast)} icon={<BallotIcon />} />
        <StatCard label="Turnout" value={percent(election.ballotsCast, election.eligibleVoters)} icon={<ChartIcon />} />
        <StatCard
          label="Blank / spoilt"
          value={formatNumber(election.ballotsCast - totalValid)}
          hint="Ballots with no choice in a contest"
          icon={<CheckCircleIcon />}
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {election.contests.map((contest) => {
            const total = contest.candidates.reduce((s, c) => s + (c.votes ?? 0), 0);
            const ranked = [...contest.candidates].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
            return (
              <Card key={contest.id} className="p-6">
                <h2 className="text-lg font-semibold">{contest.title}</h2>
                <p className="text-sm text-slate-500">{formatNumber(total)} valid votes</p>
                <ul className="mt-6 space-y-5">
                  {ranked.map((c, i) => (
                    <li key={c.id}>
                      <div className="flex items-center gap-3">
                        <CandidatePhoto name={c.name} photo={c.photo} size="md" />
                        <div className="flex-1">
                          <p className="flex items-center gap-2 font-medium">
                            {c.name}
                            {i === 0 && (
                              <span className="rounded-full bg-urblue px-2 py-0.5 text-[11px] font-semibold text-white">Elected</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{c.program}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{percent(c.votes ?? 0, total)}</p>
                          <p className="text-xs text-slate-500">{formatNumber(c.votes ?? 0)} votes</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-urblue-100">
                        <div
                          className={`h-full rounded-full ${i === 0 ? "bg-urblue" : "bg-urblue-300"}`}
                          style={{ width: percent(c.votes ?? 0, total) }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>

        <Card className="h-fit p-6">
          <div className="flex items-center gap-2 text-urblue">
            <ShieldIcon />
            <h2 className="font-semibold text-foreground">Verify these results</h2>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            The tally was decrypted jointly by 2 of 3 independent trustees. Anyone can download the
            encrypted ballots and recompute it.
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="text-slate-500">Result hash (SHA-256)</dt>
              <dd className="mt-1">{election.resultHash && <HashText value={election.resultHash} size={16} />}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Bulletin board root</dt>
              <dd className="mt-1">{election.bulletinRoot && <HashText value={election.bulletinRoot} size={16} />}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Trustee signatures</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircleIcon width={16} height={16} /> 3 of 3 valid
              </dd>
            </div>
          </dl>
          <div className="mt-6 space-y-2">
            <Link href={`${base}/verify`} className="block rounded-lg bg-urblue px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-urblue-dark">
              Check my ballot receipt
            </Link>
            <Link href={`${base}/audit`} className="block rounded-lg border border-urblue-200 px-4 py-2.5 text-center text-sm font-semibold text-urblue hover:bg-urblue-50">
              View audit log
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
}
