"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, btn, input, label } from "@/components/ui";
import { CheckCircleIcon, PlusIcon, XIcon } from "@/components/icons";

const faculties = ["Science", "Engineering", "Business", "Law", "Arts", "Education", "Medicine"];

type ContestDraft = { key: number; title: string; seats: number };

export function NewElectionForm() {
  const [scope, setScope] = useState<"university" | "faculty">("university");
  const [contests, setContests] = useState<ContestDraft[]>([{ key: 1, title: "President", seats: 1 }]);
  const [nextKey, setNextKey] = useState(2);
  const [saved, setSaved] = useState(false);

  function updateContest(key: number, patch: Partial<ContestDraft>) {
    setContests(contests.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  if (saved) {
    return (
      <Card className="max-w-xl p-8">
        <CheckCircleIcon width={40} height={40} className="text-urblue" />
        <h2 className="mt-4 text-xl font-bold">Draft election saved</h2>
        <p className="mt-2 text-sm text-slate-600">
          It stays a draft until a second commission member approves it. The creation was recorded in the audit log.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/admin/elections" className={btn.primary}>Back to elections</Link>
          <Link href="/admin/audit" className={btn.secondary}>View audit log</Link>
        </div>
      </Card>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
      className="space-y-6"
    >
      <Card className="p-6">
        <h2 className="font-semibold">Details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className={label}>Election title</label>
            <input id="title" className={input} placeholder="e.g. Student Union General Elections 2027" required />
          </div>
          <div>
            <label htmlFor="opens" className={label}>Voting opens</label>
            <input id="opens" type="datetime-local" className={input} required />
          </div>
          <div>
            <label htmlFor="closes" className={label}>Voting closes</label>
            <input id="closes" type="datetime-local" className={input} required />
          </div>
          <div>
            <label htmlFor="nominations" className={label}>Nominations close</label>
            <input id="nominations" type="date" className={input} required />
          </div>
          <div>
            <label htmlFor="trustees" className={label}>Decryption trustees</label>
            <select id="trustees" className={input} defaultValue="2-of-3">
              <option value="2-of-3">2 of 3 trustees</option>
              <option value="3-of-5">3 of 5 trustees</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold">Who can vote</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(["university", "faculty"] as const).map((s) => (
            <label
              key={s}
              className={`cursor-pointer rounded-xl border-2 p-4 transition ${scope === s ? "border-urblue bg-urblue-50" : "border-slate-200 hover:border-urblue-300"}`}
            >
              <input type="radio" name="scope" value={s} checked={scope === s} onChange={() => setScope(s)} className="sr-only" />
              <p className="font-semibold">{s === "university" ? "University-wide" : "Single faculty"}</p>
              <p className="mt-1 text-sm text-slate-600">
                {s === "university" ? "All actively enrolled students." : "Only students enrolled in one faculty."}
              </p>
            </label>
          ))}
        </div>
        {scope === "faculty" && (
          <div className="mt-4 max-w-xs">
            <label htmlFor="faculty" className={label}>Faculty</label>
            <select id="faculty" className={input}>
              {faculties.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Contests</h2>
          <button
            type="button"
            onClick={() => {
              setContests([...contests, { key: nextKey, title: "", seats: 1 }]);
              setNextKey(nextKey + 1);
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-urblue hover:underline"
          >
            <PlusIcon width={16} height={16} /> Add contest
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {contests.map((c, i) => (
            <li key={c.key} className="flex items-end gap-3">
              <div className="flex-1">
                <label htmlFor={`contest-${c.key}`} className={label}>Position {i + 1}</label>
                <input
                  id={`contest-${c.key}`}
                  value={c.title}
                  onChange={(e) => updateContest(c.key, { title: e.target.value })}
                  className={input}
                  placeholder="e.g. Vice President"
                  required
                />
              </div>
              <div className="w-24">
                <label htmlFor={`seats-${c.key}`} className={label}>Seats</label>
                <input
                  id={`seats-${c.key}`}
                  type="number"
                  min={1}
                  value={c.seats}
                  onChange={(e) => updateContest(c.key, { seats: Number(e.target.value) })}
                  className={input}
                />
              </div>
              <button
                type="button"
                onClick={() => setContests(contests.filter((x) => x.key !== c.key))}
                disabled={contests.length === 1}
                className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                aria-label={`Remove position ${i + 1}`}
              >
                <XIcon width={18} height={18} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/admin/elections" className={btn.secondary}>Cancel</Link>
        <button type="submit" className={btn.primary}>Save draft</button>
      </div>
    </form>
  );
}
