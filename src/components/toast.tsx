"use client";

import { useSyncExternalStore } from "react";
import { AlertIcon, CheckCircleIcon, XIcon } from "./icons";

// A tiny app-wide toast system: call toast.success("Saved") from anywhere in a client component.
type Tone = "success" | "error" | "info";
type Toast = { id: number; tone: Tone; title: string; body?: string };

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function push(tone: Tone, title: string, body?: string, ms = 4200) {
  const id = nextId++;
  toasts = [...toasts.slice(-3), { id, tone, title, body }];
  emit();
  window.setTimeout(() => dismiss(id), ms);
  return id;
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export const toast = {
  success: (title: string, body?: string) => push("success", title, body),
  error: (title: string, body?: string) => push("error", title, body, 6000),
  info: (title: string, body?: string) => push("info", title, body),
};

const EMPTY: Toast[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => toasts,
    () => EMPTY,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {items.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className="univote-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,34,51,.45)] backdrop-blur"
        >
          <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${t.tone === "success" ? "bg-emerald-50 text-emerald-600" : t.tone === "error" ? "bg-red-50 text-red-600" : "bg-urblue-50 text-urblue"}`}>
            {t.tone === "success" ? <CheckCircleIcon width={18} height={18} /> : <AlertIcon width={18} height={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{t.title}</p>
            {t.body && <p className="mt-0.5 text-xs leading-5 text-slate-600">{t.body}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Dismiss">
            <XIcon width={16} height={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
