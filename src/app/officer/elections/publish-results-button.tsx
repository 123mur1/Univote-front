"use client";

import { useState } from "react";
import { publishResults, usePublishedResults } from "@/lib/published-results";
import { apiRequest } from "@/lib/api-client";
import { readSession } from "@/lib/session";
import { btn } from "@/components/ui";

type CipherBallot = { encryptedPayload: string; receiptHash: string };
type ClosedElection = { title: string; contests: { id: string; candidates: { id: string }[] }[]; encryptedBallots: CipherBallot[] };

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64 + "=".repeat((4 - base64.length % 4) % 4)), (char) => char.charCodeAt(0));
}

function pemBytes(pem: string) {
  return Uint8Array.from(atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), (char) => char.charCodeAt(0));
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function calculateTally(electionId: string, election: ClosedElection, privatePem: string) {
  const privateKey = await crypto.subtle.importKey("pkcs8", pemBytes(privatePem), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]);
  const candidateIds = election.contests.flatMap((contest) => contest.candidates.map((candidate) => candidate.id));
  const totals = new Map(candidateIds.map((id) => [id, 0]));
  for (const ballot of election.encryptedBallots) {
    const envelope = JSON.parse(ballot.encryptedPayload) as { version: string; wrappedKey: string; iv: string; ciphertext: string };
    if (envelope.version !== "RSA-OAEP-256+A256GCM") throw new Error("A ballot uses an unsupported encryption format.");
    const rawAes = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, decodeBase64Url(envelope.wrappedKey));
    const aesKey = await crypto.subtle.importKey("raw", rawAes, { name: "AES-GCM" }, false, ["decrypt"]);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decodeBase64Url(envelope.iv) }, aesKey, decodeBase64Url(envelope.ciphertext));
    const opened = JSON.parse(new TextDecoder().decode(plaintext)) as { electionId: string; choices: Record<string, string> };
    if (opened.electionId !== electionId) throw new Error("A ballot is bound to a different election.");
    for (const candidateId of Object.values(opened.choices)) {
      if (candidateId === "abstain") continue;
      if (!totals.has(candidateId)) throw new Error("A ballot contains an unknown candidate selection.");
      totals.set(candidateId, totals.get(candidateId)! + 1);
    }
  }
  const results = [...totals].map(([candidateId, votes]) => ({ candidateId, votes })).sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  const resultHash = await sha256(JSON.stringify(results));
  const bulletinRoot = await sha256(election.encryptedBallots.map((ballot) => ballot.receiptHash).sort().join("\n"));
  return { results, resultHash, bulletinRoot };
}

export function PublishResultsButton({ electionId }: { electionId: string }) {
  const published = usePublishedResults().includes(electionId);
  const session = readSession();
  const [confirmed, setConfirmed] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (published) return <span className="text-xs font-medium text-emerald-700">Results published</span>;
  if (!confirmed) return <button type="button" onClick={() => setConfirmed(true)} className="text-sm font-semibold text-urblue hover:underline">Publish result</button>;

  async function publish() {
    setError("");
    if (!session?.accessToken) { publishResults(electionId); setConfirmed(false); return; }
    if (!privateKey.trim()) { setError("Upload the election trustee private key to decrypt and tally ballots."); return; }
    setBusy(true);
    try {
      const election = await apiRequest<ClosedElection>(`/elections/${electionId}/encrypted-ballots`);
      const tally = await calculateTally(electionId, election, privateKey);
      await apiRequest(`/elections/${electionId}/publish`, { method: "POST", body: JSON.stringify(tally) });
      publishResults(electionId);
      setConfirmed(false);
      setPrivateKey("");
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not calculate and publish results.");
    } finally { setBusy(false); }
  }

  return <div className="min-w-64 space-y-2 rounded-lg border border-slate-200 bg-white p-3 text-left">
    {session?.accessToken ? <>
      <label className="block text-xs font-medium text-slate-700">Trustee private key (.pem)
        <input type="file" accept=".pem,text/plain" className="mt-1 block w-full text-xs" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void file.text().then(setPrivateKey);
        }} />
      </label>
      <p className="text-xs text-slate-500">Ballots are decrypted locally in this browser. The private key is not sent to the server.</p>
    </> : <p className="text-xs text-slate-600">Publish this result in the local demo?</p>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmed(false)} className="text-xs text-slate-600">Cancel</button><button type="button" onClick={() => void publish()} disabled={busy} className={`${btn.primary} px-3! py-1.5! text-xs!`}>{busy ? "Decrypting…" : "Decrypt & publish"}</button></div>
  </div>;
}
