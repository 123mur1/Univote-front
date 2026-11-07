import Link from "next/link";
import { elections } from "@/lib/data";
import { btn, Card, ProgressBar, StatusBadge, formatNumber, percent } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import { CreatedElectionsPreview } from "@/components/views/created-elections-preview";

export default function Home() {
  const live = elections.filter((e) => e.status !== "published");

  return (
    <>
      <section className="relative overflow-hidden bg-urblue">
        <div className="pointer-events-none absolute -right-32 -top-32 size-[520px] rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-40 right-40 size-[380px] rounded-full bg-white/5" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Student Union General Elections 2026 are open
            </p>
            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Your vote. Secret, secure and verifiable.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-urblue-100">
              UniVote runs university student government elections end to end: from voter
              eligibility to published results that anyone can check independently.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={btn.inverse}>
                Sign in to vote <ArrowRightIcon width={18} height={18} />
              </Link>
              <Link href="/student/apply" className={btn.ghostInverse}>
                Apply as a candidate
              </Link>
              <Link href="/results" className={btn.ghostInverse}>
                View results
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-urblue-darker/40">
            {live.slice(0, 1).map((e) => (
              <div key={e.id}>
                <div className="flex items-center justify-between">
                  <StatusBadge status={e.status} />
                  <span className="text-xs text-slate-500">Closes {e.closes}</span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-foreground">{e.title}</h2>
                <p className="text-sm text-slate-500">{e.scope} · {e.contests.length} contests</p>
                <div className="mt-6">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-600">Live turnout</span>
                    <span className="text-2xl font-bold text-urblue">{percent(e.ballotsCast, e.eligibleVoters)}</span>
                  </div>
                  <ProgressBar value={e.ballotsCast} max={e.eligibleVoters} />
                  <p className="mt-2 text-xs text-slate-500">
                    {formatNumber(e.ballotsCast)} of {formatNumber(e.eligibleVoters)} eligible students have voted
                  </p>
                </div>
                <ul className="mt-6 space-y-2">
                  {e.contests.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg bg-urblue-50 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">{c.title}</span>
                      <span className="text-slate-500">{c.candidates.length} candidates</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-urblue">Elections</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Current and upcoming</h2>
          </div>
          <Link href="/elections" className={btn.secondary}>All elections</Link>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {live.map((e) => (
            <Link key={e.id} href={`/elections/${e.id}`} className="group">
              <Card className="h-full p-6 transition group-hover:border-urblue-300 group-hover:shadow-md">
                <StatusBadge status={e.status} />
                <h3 className="mt-4 text-lg font-semibold group-hover:text-urblue">{e.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{e.scope}</p>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-slate-500">Opens</dt>
                    <dd className="font-medium">{e.opens}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Closes</dt>
                    <dd className="font-medium">{e.closes}</dd>
                  </div>
                </dl>
              </Card>
            </Link>
          ))}
          <CreatedElectionsPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-urblue px-8 py-10 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Want to represent your fellow students?</h2>
            <p className="mt-2 text-urblue-100">Candidate nominations for the Faculty of Engineering elections are open.</p>
          </div>
          <Link href="/student/apply" className={btn.inverse}>Apply as a candidate</Link>
        </div>
      </section>
    </>
  );
}
