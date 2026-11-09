"use client";

import { useEffect, useState } from "react";
import { auditLog, type AuditEntry } from "@/lib/data";
import { apiRequest } from "@/lib/api-client";
import { readSession } from "@/lib/session";
import { Badge, Card, HashText } from "./ui";
import { CheckCircleIcon } from "./icons";

type ApiAudit = { sequence: number; electionId?: string | null; actorLabel: string; role: string; action: string; hash: string; previousHash: string; occurredAt: string };
const roles: Record<string, AuditEntry["role"]> = { SYSTEM: "System", ELECTION_OFFICER: "Election Officer", DISPUTE_RESOLUTION_COMMITTEE: "Auditor", ADMINISTRATOR: "Administrator", AUDITOR: "Auditor", VOTER: "Voter" };
const roleTone = { System: "gray", "Election Officer": "blue", Administrator: "amber", Auditor: "green", Voter: "blue" } as const;

async function isChainIntact(rows: ApiAudit[]) {
  const ordered = [...rows].sort((a, b) => a.sequence - b.sequence);
  for (let i = 0; i < ordered.length; i++) {
    const entry = ordered[i];
    if (i > 0 && entry.previousHash !== ordered[i - 1].hash) return false;
    const content = JSON.stringify({ previousHash: entry.previousHash, electionId: entry.electionId ?? null, actorLabel: entry.actorLabel, role: entry.role, action: entry.action, occurredAt: new Date(entry.occurredAt).toISOString() });
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
    const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    if (expected !== entry.hash) return false;
  }
  return true;
}

export function AuditTable() {
  const [apiEntries, setApiEntries] = useState<ApiAudit[] | null>(null);
  const [chain, setChain] = useState<boolean | null>(null);
  const backendSession = Boolean(readSession()?.accessToken);
  useEffect(() => {
    if (!backendSession) return;
    apiRequest<ApiAudit[]>("/audit/elections?take=500")
      .then(async (rows) => { setApiEntries(rows); setChain(rows.length ? await isChainIntact(rows) : true); })
      .catch(() => { setApiEntries(null); setChain(null); });
  }, [backendSession]);

  const entries: AuditEntry[] = apiEntries
    ? apiEntries.map((entry) => ({ seq: entry.sequence, time: new Date(entry.occurredAt).toLocaleString("en-GB"), actor: entry.actorLabel, role: roles[entry.role] ?? "System", action: entry.action, hash: entry.hash, prevHash: entry.previousHash }))
    : [...auditLog].reverse();
  const head = entries[0];
  const chainLabel = apiEntries ? chain === false ? "Audit hash or chain link check failed" : chain ? `Verified hashes and internal links for ${apiEntries.length} backend entries` : "Could not check the backend audit chain" : `Demo chain · ${auditLog.length} entries`;

  return <>
    <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${chain === false ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
      <CheckCircleIcon width={18} height={18} /> {chainLabel}{head && <>. Head <HashText value={head.hash} size={12} /></>}
    </div>
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-urblue text-xs uppercase tracking-wider text-white"><tr><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">Time</th><th className="px-4 py-3 font-semibold">Actor</th><th className="px-4 py-3 font-semibold">Action</th><th className="px-4 py-3 font-semibold">Hash / previous</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{entries.map((entry) => <tr key={entry.seq} className="align-top hover:bg-urblue-50/60">
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.seq}</td><td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{entry.time}</td>
        <td className="px-4 py-3"><p className="font-medium">{entry.actor}</p><Badge tone={roleTone[entry.role]}>{entry.role}</Badge></td><td className="px-4 py-3 text-slate-700">{entry.action}</td>
        <td className="space-y-1 px-4 py-3"><div><HashText value={entry.hash} /></div><div className="text-xs text-slate-400">← <HashText value={entry.prevHash} size={6} /></div></td>
      </tr>)}</tbody>
    </table></div></Card>
  </>;
}
