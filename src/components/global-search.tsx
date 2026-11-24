"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { BallotIcon, DatabaseIcon, SearchIcon, UserIcon, UserPlusIcon, UsersIcon } from "./icons";

type Hit = { type: "election" | "candidate" | "student" | "nomination" | "user"; id: string; title: string; subtitle: string; href: string };

const TYPE_LABEL: Record<Hit["type"], string> = { election: "Elections", candidate: "Candidates", student: "Registry", nomination: "Applications", user: "Accounts" };
const TYPE_ICON: Record<Hit["type"], typeof BallotIcon> = { election: BallotIcon, candidate: UsersIcon, student: DatabaseIcon, nomination: UserPlusIcon, user: UserIcon };

export function GlobalSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ query: string; hits: Hit[]; error?: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const term = query.trim();

  // Debounced search as the user types.
  useEffect(() => {
    if (term.length < 2) return;
    let live = true;
    const timer = window.setTimeout(() => {
      apiRequest<{ results: Hit[] }>(`/search?q=${encodeURIComponent(term)}`)
        .then((data) => { if (live) { setResult({ query: term, hits: data.results }); setActive(0); } })
        .catch((cause) => { if (live) setResult({ query: term, hits: [], error: cause instanceof Error ? cause.message : "Search failed." }); });
    }, 250);
    return () => { live = false; window.clearTimeout(timer); };
  }, [term]);

  // "/" focuses the search box from anywhere in the portal.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.key === "/" && !/input|textarea|select/i.test(target.tagName) && !target.isContentEditable) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    const onClick = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, []);

  const hits = result && result.query === term ? result.hits : [];
  const searching = term.length >= 2 && result?.query !== term;

  function go(hit: Hit) {
    setOpen(false);
    setQuery("");
    input.current?.blur();
    router.push(hit.href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((value) => Math.min(value + 1, hits.length - 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((value) => Math.max(value - 1, 0)); }
    else if (event.key === "Enter" && hits[active]) { event.preventDefault(); go(hits[active]); }
    else if (event.key === "Escape") { setOpen(false); input.current?.blur(); }
  }

  const groups = hits.reduce<Record<string, Hit[]>>((acc, hit) => ({ ...acc, [hit.type]: [...(acc[hit.type] ?? []), hit] }), {});

  return (
    <div ref={box} className="relative w-full max-w-xl">
      <SearchIcon width={18} height={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={input}
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-urblue focus:bg-white focus:ring-4 focus:ring-urblue/10"
        aria-label="Search"
        role="combobox"
        aria-expanded={open && term.length >= 2}
        aria-controls="global-search-results"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-400 sm:block">/</kbd>
      {open && term.length >= 2 && (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-urblue-darker/15">
          {searching && <p className="px-3 py-4 text-sm text-slate-500">Searching…</p>}
          {!searching && result?.error && <p className="px-3 py-4 text-sm text-red-700">{result.error}</p>}
          {!searching && !result?.error && hits.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No matches for “{term}”.</p>}
          {Object.entries(groups).map(([type, items]) => (
            <div key={type} className="py-1">
              <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{TYPE_LABEL[type as Hit["type"]]}</p>
              {items.map((hit) => {
                const Icon = TYPE_ICON[hit.type];
                const index = hits.indexOf(hit);
                return (
                  <button
                    key={`${hit.type}-${hit.id}`}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(hit)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${index === active ? "bg-urblue-50" : ""}`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-urblue-100 text-urblue"><Icon width={16} height={16} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">{hit.title}</span>
                      <span className="block truncate text-xs text-slate-500">{hit.subtitle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
