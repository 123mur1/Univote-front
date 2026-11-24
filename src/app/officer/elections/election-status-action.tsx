"use client";

import { useState } from "react";
import type { Election } from "@/lib/data";
import { apiRequest } from "@/lib/api-client";
import { useNow } from "@/lib/local-store";

export function ElectionStatusAction({ election }: { election: Election }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const now = useNow();
  if (!election.opensAtIso || !election.closesAtIso || election.status === "closed" || election.status === "published") return null;
  const next = election.status === "upcoming" && now >= Date.parse(election.opensAtIso) ? "OPEN" :
    (election.status === "open" || election.status === "upcoming") && now >= Date.parse(election.closesAtIso) ? "CLOSED" : null;
  if (!next) return null;
  const label = next === "OPEN" ? "Open election" : "Close election";
  async function update() {
    setBusy(true); setError("");
    try {
      await apiRequest(`/elections/${election.id}/status`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      window.dispatchEvent(new Event("univote:elections-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update election status."); }
    finally { setBusy(false); }
  }
  return <span className="inline-flex flex-col items-end gap-1"><button type="button" disabled={busy} onClick={update} className="font-medium text-urblue hover:underline disabled:opacity-50">{busy ? "Saving…" : label}</button>{error && <span className="max-w-48 text-xs text-red-600">{error}</span>}</span>;
}
