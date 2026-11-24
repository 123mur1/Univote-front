"use client";

import { useState } from "react";
import { deleteSubmissionsForElection } from "@/lib/review-store";
import { removeCreatedElection } from "@/lib/election-store";
import { logActivity } from "@/lib/activity";
import { readSession } from "@/lib/session";

export function DeleteElectionButton({ electionId, title }: { electionId: string; title: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  function removeElection() {
    try {
      deleteSubmissionsForElection(electionId);
      removeCreatedElection(electionId);
      const session = readSession();
      logActivity({ actor: session?.detail ?? session?.name ?? "election officer", role: "officer", type: "election", severity: "warning", detail: `Deleted election: ${title}.`, before: title, after: "Election and its nominations removed" });
      setConfirming(false);
    } catch {
      setError("The election could not be deleted from this browser. Try again.");
    }
  }

  return <>
    <button type="button" onClick={() => { setError(""); setConfirming(true); }} className="text-sm font-medium text-red-700 hover:underline">Delete</button>
    {confirming && <div className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/60 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-election-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 id="delete-election-title" className="text-lg font-bold">Delete this election?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">This permanently removes <strong>{title}</strong> from this browser, including any submitted nominations. This cannot be undone.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button>
          <button type="button" onClick={removeElection} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete election</button>
        </div>
      </div>
    </div>}
  </>;
}
