"use client";

import { accountChecks, formatDate, isEligible } from "@/lib/registry";
import { useHydrated, useNow } from "@/lib/local-store";
import { useSettings } from "@/lib/settings";
import { useCurrentStudent } from "@/lib/student-context";
import { EligibilityList } from "@/components/eligibility-panel";
import { Card } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";

export function MyRecord() {
  const hydrated = useHydrated();
  const now = useNow();
  const { record, regNumber } = useCurrentStudent();
  const settings = useSettings();
  if (!hydrated) return <div className="h-72 animate-pulse rounded-xl bg-urblue-100/60" />;

  const today = new Date(now).toISOString().slice(0, 10);
  const checks = accountChecks(record, settings.academicYear, today);
  const ok = isEligible(checks);
  const daysLeft = record ? Math.ceil((new Date(record.studyEnd).getTime() - now) / 86_400_000) : 0;

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <ShieldIcon className="text-urblue" />
          <h2 className="font-semibold">Voting standing for {settings.academicYear.label}</h2>
        </div>
        <p className={`mt-1 text-sm font-medium ${ok ? "text-emerald-700" : "text-red-700"}`}>
          {ok ? "You're a current student and can vote in elections open to you." : "You can't vote this academic year."}
        </p>
        <div className="mt-4">
          <EligibilityList checks={checks} />
        </div>
        {ok && record && daysLeft < 240 && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            Your study period ends on {formatDate(record.studyEnd)}. After that you can no longer vote, even with this account.
          </p>
        )}
        <p className="mt-4 text-xs text-slate-500">Checked live against the registry office&apos;s list each time you open UniVote.</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">My registry record</h2>
        {record ? (
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-slate-500">Registration number</dt><dd className="font-mono">{record.regNumber}</dd></div>
            <div><dt className="text-slate-500">College</dt><dd>{record.college}</dd></div>
            <div><dt className="text-slate-500">School</dt><dd>{record.school}</dd></div>
            <div><dt className="text-slate-500">Programme</dt><dd>{record.programme || record.department}{record.yearOfStudy ? ` · Year ${record.yearOfStudy}` : ""}</dd></div>
            <div><dt className="text-slate-500">Campus</dt><dd>{record.campus}</dd></div>
            <div><dt className="text-slate-500">Study period</dt><dd>{formatDate(record.studyStart)} – {formatDate(record.studyEnd)}</dd></div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-red-700">{regNumber} is not on the registry list.</p>
        )}
        <p className="mt-4 text-xs text-slate-500">Only the registry office can change these details.</p>
      </Card>
    </>
  );
}
