import type { Metadata } from "next";
import Link from "next/link";
import { currentStudent, elections } from "@/lib/data";
import { Card, ProgressBar, StatusBadge, btn, formatNumber, percent } from "@/components/ui";
import { MyNominations } from "./my-nominations";
import { ArrowRightIcon, CheckCircleIcon, ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Student dashboard" };

const eligibility = [
  "Enrolled for the 2026/27 academic year",
  "Student account in good standing",
  "Identity verified by one-time code",
  "Not yet voted in the open election",
];

export default function StudentDashboard() {
  const open = elections.filter((e) => e.status === "open");
  const upcoming = elections.filter((e) => e.status === "upcoming");

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-urblue">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">{currentStudent.name}</h1>
        <p className="text-sm text-slate-600">
          {currentStudent.program} · {currentStudent.year} · Faculty of {currentStudent.faculty}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {open.map((e) => (
            <div key={e.id} className="rounded-2xl bg-urblue p-6 text-white shadow-lg shadow-urblue/20">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Action needed</span>
                <span className="text-sm text-urblue-100">Closes {e.closes}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold">{e.title}</h2>
              <p className="mt-1 text-urblue-100">
                You haven&apos;t voted yet. {e.contests.length} contests on your ballot.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/student/vote/${e.id}`} className={btn.inverse}>
                  Start voting <ArrowRightIcon width={18} height={18} />
                </Link>
                <Link href={`/student/elections/${e.id}`} className={btn.ghostInverse}>Meet the candidates</Link>
              </div>
            </div>
          ))}

          <Card className="p-6">
            <h2 className="font-semibold">Upcoming elections</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {upcoming.map((e) => (
                <li key={e.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-slate-500">Opens {e.opens} · {e.scope}</p>
                  </div>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              Faculty elections only appear on your ballot if you belong to that faculty.
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Live turnout</h2>
            {open.map((e) => (
              <div key={e.id} className="mt-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-slate-600">{e.title}</span>
                  <span className="font-semibold text-urblue">{percent(e.ballotsCast, e.eligibleVoters)}</span>
                </div>
                <ProgressBar value={e.ballotsCast} max={e.eligibleVoters} />
                <p className="mt-2 text-xs text-slate-500">
                  {formatNumber(e.ballotsCast)} of {formatNumber(e.eligibleVoters)} students
                </p>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <MyNominations />

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <ShieldIcon className="text-urblue" />
              <h2 className="font-semibold">Voter eligibility</h2>
            </div>
            <p className="mt-1 text-sm font-medium text-emerald-700">You are eligible to vote</p>
            <ul className="mt-4 space-y-3">
              {eligibility.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-slate-700">
                  <CheckCircleIcon width={18} height={18} className="shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">My details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-slate-500">Student ID</dt><dd className="font-mono">{currentStudent.studentId}</dd></div>
              <div><dt className="text-slate-500">University email</dt><dd className="break-all">{currentStudent.email}</dd></div>
              <div><dt className="text-slate-500">Faculty</dt><dd>{currentStudent.faculty}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Details come from the registrar. Contact them if anything is wrong.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
