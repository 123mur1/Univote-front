import type { Metadata } from "next";
import { elections } from "@/lib/data";
import { Card, ProgressBar, formatNumber, percent } from "@/components/ui";
import { MyElections } from "./my-elections";
import { MyNominations } from "./my-nominations";
import { MyRecord } from "./my-record";
import { StudentWelcome } from "./student-welcome";

export const metadata: Metadata = { title: "Student dashboard" };

export default function StudentDashboard() {
  const open = elections.filter((e) => e.status === "open");
  const upcoming = elections.filter((e) => e.status === "upcoming");

  return (
    <>
      <StudentWelcome />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MyElections open={open} upcoming={upcoming} />

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
                  {formatNumber(e.ballotsCast)} of {formatNumber(e.eligibleVoters)} eligible students
                </p>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <MyRecord />
          <MyNominations />
        </div>
      </div>
    </>
  );
}
