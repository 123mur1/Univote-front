"use client";

import { useState } from "react";
import { mockHash } from "@/lib/data";
import { Card, HashText, btn, input, label } from "@/components/ui";
import { AlertIcon, CheckCircleIcon, SearchIcon } from "@/components/icons";
import { apiRequest } from "@/lib/api-client";

type Result =
  | { found: true; code: string; ballotHash?: string; position?: number; electionTitle?: string; recordedAt?: string }
  | { found: false; code: string };

const RECEIPT_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function VerifyForm() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [checking, setChecking] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    setChecking(true);
    setResult(null);
    if (/^[A-F\d]{64}$/.test(normalized)) {
      try {
        const checked = await apiRequest<{ valid: boolean; receipt: string; recordedAt: string; election: { title: string } }>(`/elections/receipts/${normalized}`);
        setResult(checked.valid ? { found: true, code: normalized, electionTitle: checked.election.title, recordedAt: checked.recordedAt } : { found: false, code: normalized });
      } catch {
        setResult({ found: false, code: normalized });
      } finally { setChecking(false); }
      return;
    }
    // Mock lookup: any well-formed receipt is "found" on the bulletin board.
    setTimeout(() => {
      const ballotHash = mockHash(`ballot|${normalized}`);
      setResult(
        RECEIPT_PATTERN.test(normalized)
          ? { found: true, code: normalized, ballotHash, position: (parseInt(ballotHash.slice(0, 6), 16) % 5214) + 1 }
          : { found: false, code: normalized },
      );
      setChecking(false);
    }, 700);
  }

  return (
    <>
      <Card className="p-6">
        <form onSubmit={onSubmit}>
          <label htmlFor="receipt" className={label}>Receipt code</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="receipt"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 7KQ2-M9XA-4TP8"
              className={`${input} font-mono uppercase tracking-wider`}
              autoComplete="off"
              required
            />
            <button type="submit" className={btn.primary} disabled={checking}>
              <SearchIcon width={18} height={18} />
              {checking ? "Checking…" : "Verify"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Format: XXXX-XXXX-XXXX, shown on the confirmation screen after you vote.</p>
          <p className="mt-3 text-xs text-slate-600">
            Demo: try{" "}
            <button type="button" onClick={() => setCode("7KQ2-M9XA-4TP8")} className="font-mono font-semibold text-urblue hover:underline">
              7KQ2-M9XA-4TP8
            </button>{" "}
            (found) or{" "}
            <button type="button" onClick={() => setCode("BAD-CODE")} className="font-mono font-semibold text-urblue hover:underline">
              BAD-CODE
            </button>{" "}
            (not found).
          </p>
        </form>
      </Card>

      {result?.found && (
        <Card className="mt-6 border-emerald-200 p-6">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 shrink-0 text-emerald-600" width={24} height={24} />
            <div>
              <h2 className="font-semibold text-emerald-800">Your ballot is on the bulletin board</h2>
              <p className="mt-1 text-sm text-slate-600">
                Receipt <span className="font-mono font-semibold">{result.code}</span> matches an encrypted ballot in{" "}
                <span className="font-medium">{result.electionTitle ?? "Student Union General Elections 2026"}</span>.
              </p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {result.ballotHash && <div>
                  <dt className="text-slate-500">Encrypted ballot hash</dt>
                  <dd className="mt-1"><HashText value={result.ballotHash} size={14} /></dd>
                </div>}
                {result.position !== undefined && <div>
                  <dt className="text-slate-500">Bulletin board position</dt>
                  <dd className="mt-1 font-medium">#{result.position.toLocaleString("en-US")}</dd>
                </div>}
                {result.recordedAt && <div><dt className="text-slate-500">Recorded at</dt><dd className="mt-1 font-medium">{new Date(result.recordedAt).toLocaleString()}</dd></div>}
                <div>
                  <dt className="text-slate-500">Included in tally</dt>
                  <dd className="mt-1 font-medium">Pending — tally runs when voting closes</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Linked to your identity</dt>
                  <dd className="mt-1 font-medium">No</dd>
                </div>
              </dl>
            </div>
          </div>
        </Card>
      )}

      {result && !result.found && (
        <Card className="mt-6 border-red-200 p-6">
          <div className="flex items-start gap-3">
            <AlertIcon className="mt-0.5 shrink-0 text-red-600" width={24} height={24} />
            <div>
              <h2 className="font-semibold text-red-800">No ballot found for this code</h2>
              <p className="mt-1 text-sm text-slate-600">
                Check the code for typos. If you are sure it is correct, report it to the Electoral
                Commission. This could mean your ballot was not recorded.
              </p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
