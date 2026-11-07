"use client";

import { useState } from "react";
import { publishResults, usePublishedResults } from "@/lib/published-results";

export function PublishResultsButton({ electionId }: { electionId: string }) {
  const published = usePublishedResults().includes(electionId);
  const [confirmed, setConfirmed] = useState(false);
  if (published) return <span className="text-xs font-medium text-emerald-700">Results published</span>;
  if (!confirmed) return <button type="button" onClick={() => setConfirmed(true)} className="text-sm font-semibold text-urblue hover:underline">Publish result</button>;
  return <div className="flex items-center justify-end gap-2">
    <button type="button" onClick={() => setConfirmed(false)} className="text-xs text-slate-600">Cancel</button>
    <button type="button" onClick={() => publishResults(electionId)} className="rounded-md bg-urblue px-3 py-1.5 text-xs font-semibold text-white">Confirm publish</button>
  </div>;
}
