"use client";

import { useState } from "react";
import Image from "next/image";
import { mockHash, type ApplicationDocument, type CandidateApplication } from "@/lib/data";
import { compareDetails, eligibilityChecks } from "@/lib/eligibility";
import { isPdf } from "@/lib/files";
import { readSession } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { docStatus, effectiveStatus, updateReview, useReviews, type DocStatus } from "@/lib/review-store";
import { Badge, CandidatePhoto, Card, HashText, btn, input, label } from "@/components/ui";
import { apiRequest } from "@/lib/api-client";
import { notifyDataChanged } from "@/lib/use-api";
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  SearchIcon,
  XIcon,
} from "@/components/icons";

const OFFICER = "Jeanne Kamanzi";
const MIN_REASON = 10;

export function ApplicationReview({ application: a }: { application: CandidateApplication }) {
  const reviews = useReviews();
  const review = reviews[a.id];
  const status = effectiveStatus(a, review);
  const decided = status !== "pending";

  const checks = eligibilityChecks(a);
  const fields = compareDetails(a);
  const docStates = a.documents.map((d) => docStatus(a, d, review));
  const verifiedCount = docStates.filter((s) => s === "verified").length;
  const flaggedCount = docStates.filter((s) => s === "flagged").length;

  const requirements = [
    { label: `All ${a.documents.length} documents verified`, pass: verifiedCount === a.documents.length },
    { label: "Details match the registry", pass: fields.every((f) => f.match) },
    { label: "All eligibility rules pass", pass: checks.every((c) => c.pass) },
  ];
  const canApprove = requirements.every((r) => r.pass);

  const [viewing, setViewing] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<"approved" | "rejected" | null>(null);
  const [serverError, setServerError] = useState("");

  async function setDoc(doc: ApplicationDocument, s: DocStatus, note?: string) {
    setServerError("");
    if (a.apiManaged) {
      try { await apiRequest(`/nominations/${a.id}/documents/${doc.id}`, { method: "PATCH", body: JSON.stringify({ status: s.toUpperCase(), note }) }); notifyDataChanged(); }
      catch (cause) { setServerError(cause instanceof Error ? cause.message : "Could not save the document review."); return; }
    }
    const previous = review?.docs[doc.id];
    updateReview(a.id, (r) => ({ ...r, docs: { ...r.docs, [doc.id]: { status: s, note } } }));
    logActivity({ actor: readSession()?.detail ?? readSession()?.name ?? OFFICER, role: "officer", type: "review", severity: "info", detail: `${s === "verified" ? "Verified" : "Flagged"} ${doc.name} for ${a.name}.`, before: previous ? `${previous.status}${previous.note ? `: ${previous.note}` : ""}` : "Not reviewed", after: `${s}${note ? `: ${note}` : ""}` });
  }

  async function decide(next: "approved" | "rejected") {
    const previousStatus = status;
    setServerError("");
    if (a.apiManaged) {
      try { await apiRequest(`/nominations/${a.id}/decision`, { method: "PATCH", body: JSON.stringify({ status: next.toUpperCase(), note: reason.trim() }) }); notifyDataChanged(); }
      catch (cause) { setServerError(cause instanceof Error ? cause.message : "Could not save the nomination decision."); return; }
    }
    updateReview(a.id, (r) => ({
      ...r,
      status: next,
      note: reason.trim() || (next === "approved" ? "All documents and eligibility checks verified." : undefined),
      decidedAt: new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }),
      decidedBy: readSession()?.name ?? OFFICER,
    }));
    logActivity({ actor: readSession()?.detail ?? readSession()?.name ?? OFFICER, role: "officer", type: "review", severity: "info", detail: `${next === "approved" ? "Approved" : "Rejected"} ${a.name}'s nomination for ${a.contest}.`, before: previousStatus, after: `${next}${reason.trim() ? `: ${reason.trim()}` : ""}` });
    setConfirming(null);
    setReason("");
  }

  async function reopen() {
    setServerError("");
    if (a.apiManaged) {
      try { await apiRequest(`/nominations/${a.id}/reopen`, { method: "PATCH" }); notifyDataChanged(); }
      catch (cause) { setServerError(cause instanceof Error ? cause.message : "Could not reopen this nomination."); return; }
    }
    updateReview(a.id, (r) => ({ ...r, status: "pending", note: undefined, decidedAt: undefined, decidedBy: undefined }));
    logActivity({ actor: readSession()?.detail ?? readSession()?.name ?? OFFICER, role: "officer", type: "review", severity: "warning", detail: `Reopened ${a.name}'s nomination for ${a.contest}.`, before: status, after: "pending" });
  }

  const note = review?.status ? review.note : a.decisionNote;

  return (
    <>
      {/* Header */}
      {serverError && <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{serverError}</p>}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <CandidatePhoto name={a.name} photo={a.photo} size="xl" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{a.name}</h1>
            <StatusPill status={status} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {a.contest} · {a.election}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono">{a.studentId}</span> · submitted {a.submitted}
          </p>
        </div>
      </div>

      {decided && (
        <div
          className={`mt-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
            status === "approved" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          {status === "approved" ? (
            <CheckCircleIcon className="shrink-0 text-emerald-600" width={24} height={24} />
          ) : (
            <XIcon className="shrink-0 text-red-600" width={24} height={24} />
          )}
          <div className="flex-1 text-sm">
            <p className={`font-semibold ${status === "approved" ? "text-emerald-800" : "text-red-800"}`}>
              {status === "approved" ? "Nomination approved. The candidate will appear on the ballot." : "Nomination rejected."}
            </p>
            {note && <p className="mt-0.5 text-slate-700">“{note}”</p>}
            <p className="mt-1 text-xs text-slate-500">
              {review?.decidedBy ? `${review.decidedBy} · ${review.decidedAt}` : "Decided before this session"} · logged as{" "}
              <HashText value={mockHash(`${a.id}|${status}|${review?.decidedAt ?? a.submitted}`)} size={8} />
            </p>
          </div>
          <button type="button" onClick={reopen} className={btn.secondary}>
            Reopen review
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Documents */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Submitted documents</h2>
              <span className="text-sm text-slate-500">
                {verifiedCount}/{a.documents.length} verified
                {flaggedCount > 0 && <span className="text-red-600"> · {flaggedCount} flagged</span>}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Open each document and check it against the registry details below.</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {a.documents.map((doc, i) => {
                const s = docStates[i];
                const docNote = review?.docs[doc.id]?.note;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setViewing(i)}
                      className={`group flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition hover:border-urblue-300 ${
                        s === "verified" ? "border-emerald-200" : s === "flagged" ? "border-red-200" : "border-slate-200"
                      }`}
                    >
                      <span className="relative flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-urblue-50 ring-1 ring-slate-200">
                        {isPdf(doc.file) ? (
                          <span className="text-xs font-bold text-red-700">PDF</span>
                        ) : (
                          <Image
                            src={doc.file}
                            alt=""
                            width={56}
                            height={64}
                            unoptimized={doc.file.startsWith("data:")}
                            className="h-full w-full object-cover object-top"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold group-hover:text-urblue">{doc.name}</span>
                        <span className="block text-xs text-slate-500">
                          {doc.size} · {doc.uploaded}
                        </span>
                        <span className="mt-1 block">
                          {s === "verified" && <Badge tone="green">Verified</Badge>}
                          {s === "flagged" && <Badge tone="red">Flagged</Badge>}
                          {!s && <Badge tone="amber">Not checked</Badge>}
                        </span>
                        {s === "flagged" && docNote && <span className="mt-1 block truncate text-xs text-red-700">{docNote}</span>}
                      </span>
                      <SearchIcon width={18} height={18} className="shrink-0 text-slate-400 group-hover:text-urblue" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Details vs registry */}
          <Card className="overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="font-semibold">Candidate details vs registry record</h2>
              <p className="mt-1 text-sm text-slate-500">What the candidate entered, compared with the registrar&apos;s record.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-urblue-50 text-xs uppercase tracking-wider text-urblue-dark">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold">Field</th>
                    <th className="px-6 py-2.5 font-semibold">Submitted</th>
                    <th className="px-6 py-2.5 font-semibold">Registry</th>
                    <th className="px-6 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fields.map((f) => (
                    <tr key={f.label} className={f.match ? "" : "bg-red-50/60"}>
                      <td className="px-6 py-3 text-slate-500">{f.label}</td>
                      <td className={`px-6 py-3 ${f.match ? "" : "font-semibold text-red-700"}`}>{f.declared}</td>
                      <td className="px-6 py-3 font-medium">{f.registry}</td>
                      <td className="px-6 py-3 text-right">
                        {f.match ? (
                          <CheckIcon width={18} height={18} className="ml-auto text-emerald-600" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700">
                            <AlertIcon width={16} height={16} /> Mismatch
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="grid gap-4 border-t border-slate-100 p-6 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">University email</dt>
                <dd className="break-all font-medium">{a.email}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">{a.phone}</dd>
              </div>
            </dl>
          </Card>

          {/* Nomination */}
          <Card className="p-6">
            <h2 className="font-semibold">Nomination</h2>
            <p className="mt-3 text-sm text-slate-500">Slogan</p>
            <p className="font-medium">“{a.slogan}”</p>
            <p className="mt-4 text-sm text-slate-500">Manifesto</p>
            <p className="mt-1 border-l-2 border-urblue pl-3 text-sm leading-relaxed text-slate-700">{a.manifesto}</p>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Eligibility checks</h2>
            <p className="mt-1 text-xs text-slate-500">Run automatically against the registrar record.</p>
            <ul className="mt-4 space-y-3">
              {checks.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  {c.pass ? (
                    <CheckCircleIcon width={20} height={20} className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertIcon width={20} height={20} className="mt-0.5 shrink-0 text-red-600" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${c.pass ? "" : "text-red-700"}`}>{c.label}</p>
                    <p className="text-xs text-slate-500">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {!decided && (
            <Card className="p-6 lg:sticky lg:top-6">
              <h2 className="font-semibold">Decision</h2>
              <ul className="mt-4 space-y-2">
                {requirements.map((r) => (
                  <li key={r.label} className="flex items-center gap-2 text-sm">
                    {r.pass ? (
                      <CheckIcon width={18} height={18} className="shrink-0 text-emerald-600" />
                    ) : (
                      <XIcon width={18} height={18} className="shrink-0 text-slate-400" />
                    )}
                    <span className={r.pass ? "text-slate-700" : "text-slate-500"}>{r.label}</span>
                  </li>
                ))}
              </ul>

              <label htmlFor="reason" className={`${label} mt-5`}>
                Note / reason <span className="font-normal text-slate-400">(required to reject)</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={input}
                placeholder="e.g. Registry GPA is below the 2.5 minimum."
              />

              {confirming ? (
                <div className="mt-4 rounded-lg border border-urblue-200 bg-urblue-50 p-3">
                  <p className="text-sm text-slate-700">
                    {confirming === "approved"
                      ? `Approve ${a.name}? They will appear on the ballot.`
                      : `Reject ${a.name}? The candidate will be emailed your reason.`}{" "}
                    This is recorded in the audit log.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => decide(confirming)} className={`${btn.primary} flex-1`}>
                      Confirm
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className={`${btn.secondary} flex-1`}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirming("rejected")}
                    disabled={reason.trim().length < MIN_REASON}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XIcon width={16} height={16} /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming("approved")}
                    disabled={!canApprove}
                    className={`${btn.primary} flex-1`}
                  >
                    <CheckIcon width={16} height={16} /> Approve
                  </button>
                </div>
              )}
              {!canApprove && (
                <p className="mt-3 text-xs text-slate-500">Approve unlocks once every item above is ticked.</p>
              )}
            </Card>
          )}
        </div>
      </div>

      {viewing !== null && (
        <DocumentViewer
          application={a}
          index={viewing}
          status={docStates[viewing]}
          note={review?.docs[a.documents[viewing].id]?.note}
          onNavigate={setViewing}
          onClose={() => setViewing(null)}
          onMark={(s, n) => setDoc(a.documents[viewing], s, n)}
          readOnly={decided}
        />
      )}
    </>
  );
}

function StatusPill({ status }: { status: CandidateApplication["status"] }) {
  const tone = { pending: "amber", approved: "green", rejected: "red" } as const;
  const text = { pending: "Pending review", approved: "Approved", rejected: "Rejected" };
  return <Badge tone={tone[status]}>{text[status]}</Badge>;
}

function DocumentViewer({
  application: a,
  index,
  status,
  note,
  onNavigate,
  onClose,
  onMark,
  readOnly,
}: {
  application: CandidateApplication;
  index: number;
  status?: DocStatus;
  note?: string;
  onNavigate: (i: number) => void;
  onClose: () => void;
  onMark: (s: DocStatus, note?: string) => void;
  readOnly: boolean;
}) {
  const doc = a.documents[index];
  const [flagging, setFlagging] = useState(false);
  const [flagNote, setFlagNote] = useState(note ?? "");
  const last = a.documents.length - 1;

  function go(i: number) {
    setFlagging(false);
    setFlagNote("");
    onNavigate(i);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={doc.name}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{doc.name}</p>
            <p className="text-xs text-slate-500">
              {a.name} · {doc.size} · uploaded {doc.uploaded} · {index + 1} of {a.documents.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!doc.file.startsWith("data:") && (
              <a href={doc.file} target="_blank" rel="noreferrer" className="hidden text-sm font-medium text-urblue hover:underline sm:inline">
                Open full size
              </a>
            )}
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close" autoFocus>
              <XIcon />
            </button>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-auto bg-slate-100 p-4">
            {isPdf(doc.file) ? (
              <iframe src={doc.file} title={`${doc.name} submitted by ${a.name}`} className="h-[70vh] w-full rounded-md bg-white shadow" />
            ) : (
              <Image
                src={doc.file}
                alt={`${doc.name} submitted by ${a.name}`}
                width={850}
                height={doc.kind === "photo" ? 850 : 1100}
                unoptimized={doc.file.startsWith("data:")}
                className="mx-auto h-auto w-full max-w-2xl rounded-md bg-white shadow"
              />
            )}
          </div>

          <aside className="flex flex-col gap-4 overflow-auto border-t border-slate-200 p-5 md:border-l md:border-t-0">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-urblue">Check against registry</p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Name</dt><dd className="text-right font-medium">{a.registry.name}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Student ID</dt><dd className="font-mono text-xs font-medium">{a.registry.studentId}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Programme</dt><dd className="text-right font-medium">{a.registry.program}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">Year</dt><dd className="font-medium">{a.registry.year}</dd></div>
                <div className="flex justify-between gap-2"><dt className="text-slate-500">GPA</dt><dd className="font-medium">{a.registry.gpa.toFixed(2)}</dd></div>
              </dl>
            </div>

            <div className="rounded-lg bg-urblue-50 p-3 text-sm">
              Status:{" "}
              {status === "verified" ? (
                <Badge tone="green">Verified</Badge>
              ) : status === "flagged" ? (
                <Badge tone="red">Flagged</Badge>
              ) : (
                <Badge tone="amber">Not checked</Badge>
              )}
              {status === "flagged" && note && <p className="mt-1.5 text-xs text-red-700">{note}</p>}
            </div>

            {!readOnly && !flagging && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onMark("verified");
                    if (index < last) go(index + 1);
                  }}
                  className={btn.primary}
                >
                  <CheckIcon width={18} height={18} /> Mark as verified
                </button>
                <button
                  type="button"
                  onClick={() => setFlagging(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <AlertIcon width={18} height={18} /> Flag a problem
                </button>
              </div>
            )}

            {!readOnly && flagging && (
              <div>
                <label htmlFor="flag-note" className={label}>What&apos;s wrong with this document?</label>
                <textarea
                  id="flag-note"
                  rows={3}
                  value={flagNote}
                  onChange={(e) => setFlagNote(e.target.value)}
                  className={input}
                  placeholder="e.g. Transcript GPA (2.30) differs from the GPA entered (2.80)."
                  autoFocus
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={flagNote.trim().length < 5}
                    onClick={() => {
                      onMark("flagged", flagNote.trim());
                      setFlagging(false);
                    }}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Save flag
                  </button>
                  <button type="button" onClick={() => setFlagging(false)} className={`${btn.secondary} flex-1 py-2!`}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {readOnly && <p className="text-xs text-slate-500">Reopen the review to change document checks.</p>}

            <div className="mt-auto flex justify-between gap-2 pt-2">
              <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className={`${btn.secondary} px-3! py-2!`}>
                <ArrowLeftIcon width={16} height={16} /> Prev
              </button>
              <button type="button" onClick={() => go(index + 1)} disabled={index === last} className={`${btn.secondary} px-3! py-2!`}>
                Next <ArrowRightIcon width={16} height={16} />
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
