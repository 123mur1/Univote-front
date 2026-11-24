"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { useSession } from "@/lib/session";
import type { Role } from "@/lib/settings";
import { BallotIcon, BellIcon, ChartIcon, CheckIcon, DatabaseIcon, UserIcon, UserPlusIcon } from "./icons";

type Notification = { id: string; kind: string; title: string; body: string; link?: string | null; createdAt: string; read: boolean };
type Feed = { unread: number; items: Notification[] };

const KIND_ICON: Record<string, typeof BellIcon> = {
  election: BallotIcon,
  result: ChartIcon,
  nomination: UserPlusIcon,
  account: UserIcon,
  registry: DatabaseIcon,
};

// Links are written for the role that triggered them; send each reader to their own portal's page.
export function portalLink(role: Role, link: string) {
  if (role === "student" && link.startsWith("/results")) return `/student${link}`;
  if (role === "admin" && link.startsWith("/officer/registry")) return link.replace("/officer", "/admin");
  if (role === "student" && link.startsWith("/officer")) return "/student";
  return link;
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)} h ago`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)} d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const router = useRouter();
  const session = useSession();
  const { data, reload } = useApi<Feed>("/notifications?take=30", { pollMs: 60_000, silent: true });
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);

  const unread = data?.unread ?? 0;

  async function openItem(item: Notification) {
    if (!item.read) await apiRequest(`/notifications/${item.id}/read`, { method: "POST" }).catch(() => undefined);
    reload();
    setOpen(false);
    if (item.link && session) router.push(portalLink(session.role, item.link));
  }

  async function readAll() {
    await apiRequest("/notifications/read-all", { method: "POST" }).catch(() => undefined);
    reload();
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-urblue-50 hover:text-urblue focus-visible:outline-2 focus-visible:outline-urblue"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <BellIcon width={21} height={21} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-urblue-darker/15">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unread ? `${unread} unread` : "You're all caught up"}</p>
            </div>
            {unread > 0 && (
              <button type="button" onClick={readAll} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-urblue hover:bg-urblue-50">
                <CheckIcon width={14} height={14} /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
            {!data && <li className="px-4 py-8 text-center text-sm text-slate-500">Loading…</li>}
            {data && data.items.length === 0 && (
              <li className="px-4 py-10 text-center">
                <BellIcon width={28} height={28} className="mx-auto text-urblue-200" />
                <p className="mt-2 text-sm font-medium text-slate-700">No notifications yet</p>
                <p className="text-xs text-slate-500">Election updates and decisions will appear here.</p>
              </li>
            )}
            {data?.items.map((item) => {
              const Icon = KIND_ICON[item.kind] ?? BellIcon;
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => openItem(item)} className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-urblue-50/70 ${item.read ? "" : "bg-urblue-50/40"}`}>
                    <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${item.read ? "bg-slate-100 text-slate-500" : "bg-urblue text-white"}`}>
                      <Icon width={17} height={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-sm leading-5 ${item.read ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>{item.title}</span>
                        {!item.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-urblue" aria-label="Unread" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-slate-600">{item.body}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
