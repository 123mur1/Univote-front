"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { endSession, readSession, useSession } from "@/lib/session";
import { useSettings, type OfficerPermission, type Role } from "@/lib/settings";
import { apiRequest } from "@/lib/api-client";
import { returnToAdmin } from "@/lib/impersonation";
import { syncSettingsFromServer } from "@/lib/settings-sync";
import { Logo } from "./logo";
import { SidebarNav, activeHrefFor, type NavItem } from "./sidebar-nav";
import { Avatar, btn } from "./ui";
import { AlertIcon, ArrowLeftIcon, ChevronDownIcon, ChevronRightIcon, HomeIcon, LockIcon, LogOutIcon, MenuIcon, SidebarIcon, XIcon } from "./icons";
import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";

const ROLE_NAMES: Record<Role, string> = { student: "Student", officer: "Election Officer", admin: "System Administrator" };
const SEARCH_HINT: Record<Role, string> = {
  student: "Search elections and candidates…",
  officer: "Search elections, students, applicants…",
  admin: "Search users, students, elections…",
};

// Remembers whether the desktop sidebar is collapsed, per browser.
const COLLAPSE_KEY = "univote:sidebar-collapsed";
const collapseListeners = new Set<() => void>();
function readCollapsed() {
  try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
}
function writeCollapsed(value: boolean) {
  try { localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0"); } catch { /* storage unavailable: keep the in-memory default */ }
  collapseListeners.forEach((l) => l());
}
function useCollapsed() {
  return useSyncExternalStore(
    (l) => { collapseListeners.add(l); return () => collapseListeners.delete(l); },
    readCollapsed,
    () => false,
  );
}

export function PortalShell({
  nav,
  role,
  requiredRole,
  allowedRoles,
  homeHref,
  children,
}: {
  nav: NavItem[];
  role: string;
  requiredRole: Role;
  // Other roles that may also open this portal (the administrator can use the election office).
  allowedRoles?: Role[];
  homeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useHydrated();
  const session = useSession();
  const allowed = Boolean(session && (session.role === requiredRole || allowedRoles?.includes(session.role)));
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const collapsed = useCollapsed();
  const settings = useSettings();
  const visiting = session?.role === "admin" && requiredRole !== "admin";
  // Officer menu items follow the permissions the administrator has granted.
  const items = requiredRole === "officer" && !visiting ? nav.filter((i) => !i.permission || settings.officerPermissions[i.permission as OfficerPermission]) : nav;
  const activeHref = activeHrefFor(items, pathname);
  const activeItem = items.find((i) => i.href === activeHref);

  // Only someone signed in with a role allowed here may see this portal.
  useEffect(() => {
    if (!hydrated || allowed) return;
    const reason = session ? "role" : "signin";
    router.replace(`/login?reason=${reason}&next=${encodeURIComponent(window.location.pathname)}`);
  }, [hydrated, allowed, session, router]);

  // Confirm the stored session with the server once per sign-in (renewing it if needed), then load
  // the server's settings. An ended session is sent back to sign-in by the API client.
  const checked = useRef<string | null>(null);
  useEffect(() => {
    if (!hydrated || !allowed || !session?.accessToken) return;
    const marker = `${session.userId ?? session.detail}|${session.signedInAt}`;
    if (checked.current === marker) return;
    checked.current = marker;
    apiRequest("/auth/me").then(() => syncSettingsFromServer()).catch(() => undefined);
  }, [hydrated, allowed, session]);

  const signOut = useCallback(
    async (reason: "logout" | "timeout") => {
      const s = readSession();
      if (s?.impersonator) {
        await returnToAdmin();
        return;
      }
      if (s?.accessToken) {
        try { await apiRequest("/auth/logout", { method: "POST" }); } catch { /* Local sign-out must still complete if the API is unavailable. */ }
      }
      if (s) {
        logActivity({
          actor: s.regNumber ?? s.detail ?? s.name,
          role: s.role,
          type: reason,
          severity: "info",
          detail: reason === "timeout" ? `${s.name} was signed out after inactivity.` : `${s.name} signed out.`,
        });
      }
      endSession();
      router.push(reason === "timeout" ? "/login?reason=timeout" : "/login?reason=signedout");
    },
    [router],
  );

  if (!hydrated || !allowed || !session) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-surface p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="relative flex size-16 items-center justify-center rounded-2xl bg-white text-urblue shadow-[var(--shadow-lift)] ring-1 ring-urblue-100">
            <span aria-hidden="true" className="univote-rope univote-spin-slow absolute -inset-2 text-urblue-200" />
            <LockIcon width={24} height={24} />
          </span>
          <p className="text-sm font-semibold text-slate-600">{hydrated ? "Redirecting to sign in…" : "Checking your access…"}</p>
        </div>
      </div>
    );
  }

  const identity = { name: session.name, detail: session.role === "student" ? session.regNumber ?? session.detail : ROLE_NAMES[session.role] };
  const isStudent = requiredRole === "student";

  const sidebar = (mobile: boolean) => {
    const slim = collapsed && !mobile;
    return (
      <>
        <div className={`flex h-[72px] shrink-0 items-center ${slim ? "justify-center px-2" : "justify-between px-5"}`}>
          {slim ? (
            <Link href={homeHref} className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm" aria-label="Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/univote-mark.png" alt="" className="size-8" />
            </Link>
          ) : (
            <Logo inverse href={homeHref} />
          )}
          {mobile && (
            <button type="button" onClick={() => setDrawerPath(null)} className="rounded-lg p-1.5 text-urblue-100 hover:bg-white/10" aria-label="Close menu">
              <XIcon width={20} height={20} />
            </button>
          )}
        </div>
        {!slim && (
          <div className="mx-4 mb-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ur-logo.png" alt="" className="size-7 rounded-full bg-white p-0.5" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[11px] font-bold text-white">University of Rwanda</p>
              <p className="truncate text-[10.5px] text-urblue-200">{role}</p>
            </div>
          </div>
        )}
        <div className="univote-scroll-dark min-h-0 flex-1 overflow-y-auto overflow-x-visible pb-4">
          <Suspense fallback={<SidebarNav items={items} activeHref={null} collapsed={slim} />}>
            <SidebarNav items={items} collapsed={slim} onNavigate={mobile ? () => setDrawerPath(null) : undefined} />
          </Suspense>
          {visiting && !slim && (
            <div className="mx-3 mt-5 rounded-xl border border-white/15 bg-white/[0.06] p-3">
              <p className="text-xs leading-5 text-urblue-100">You are using the election office with administrator rights.</p>
              <Link href="/admin" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline">
                <ArrowLeftIcon width={14} height={14} /> Back to admin console
              </Link>
            </div>
          )}
        </div>
        <div className={`border-t border-white/10 ${slim ? "p-2" : "p-3"}`}>
          {!mobile && (
            <button
              type="button"
              onClick={() => writeCollapsed(!collapsed)}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl py-2 text-xs font-semibold text-urblue-200 transition hover:bg-white/[0.08] hover:text-white ${slim ? "justify-center px-2" : "px-3"}`}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SidebarIcon width={18} height={18} />
              {!slim && "Collapse menu"}
            </button>
          )}
          <div className={`flex items-center gap-3 rounded-xl bg-white/[0.06] ${slim ? "justify-center p-1.5" : "p-2.5"}`}>
            <Avatar name={identity.name} size="sm" />
            {!slim && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{identity.name}</p>
                <p className="truncate text-xs text-urblue-200">{identity.detail}</p>
              </div>
            )}
            {!slim && (
              <button type="button" onClick={() => setConfirmingSignOut(true)} className="rounded-lg p-1.5 text-urblue-200 transition hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
                <LogOutIcon width={18} height={18} />
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  const asideBg = "bg-[radial-gradient(120%_60%_at_0%_0%,#0a7aa8_0%,transparent_60%),linear-gradient(180deg,#00415f_0%,#003650_45%,#002233_100%)]";

  return (
    <div className="flex min-h-screen flex-1 bg-surface">
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col ${asideBg} shadow-[20px_0_50px_-45px_rgba(11,34,48,.6)] transition-[width] duration-300 lg:flex ${collapsed ? "w-[76px]" : "w-[272px]"}`}>
        {sidebar(false)}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-urblue-deep/60 backdrop-blur-sm [animation:univote-fade_.25s_ease_both]" onClick={() => setDrawerPath(null)} aria-label="Close menu" />
          <aside className={`univote-drawer relative flex h-full w-[290px] max-w-[85vw] flex-col ${asideBg} shadow-2xl`}>{sidebar(true)}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {session.impersonator && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-400 px-4 py-2 text-sm font-medium text-amber-950">
            <span className="inline-flex items-center gap-2">
              <AlertIcon width={17} height={17} />
              Signed in as <strong>{session.name}</strong> ({ROLE_NAMES[session.role]}) on behalf of {session.impersonator.name}. Voting is disabled in this mode.
            </span>
            <button type="button" onClick={() => returnToAdmin()} className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-bold text-white hover:bg-black">
              Return to my admin account
            </button>
          </div>
        )}

        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setDrawerPath(pathname)} className={`inline-flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-urblue-50 hover:text-urblue lg:hidden ${isStudent ? "max-sm:hidden" : ""}`} aria-label="Open menu">
              <MenuIcon width={22} height={22} />
            </button>
            {isStudent && (
              <Link href={homeHref} className="flex shrink-0 sm:hidden" aria-label="Home">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/univote-mark.png" alt="" className="size-9" />
              </Link>
            )}
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm xl:flex">
              <Link href={homeHref} className="flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-urblue">
                <HomeIcon width={16} height={16} /> {role}
              </Link>
              {activeItem && activeItem.href !== homeHref && (
                <>
                  <ChevronRightIcon width={14} height={14} className="text-slate-300" />
                  <span className="truncate font-semibold text-slate-900">{activeItem.label}</span>
                </>
              )}
            </nav>
            <div className="min-w-0 flex-1 xl:ml-6 xl:max-w-md">
              <GlobalSearch placeholder={SEARCH_HINT[session.role]} />
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <NotificationBell />
              <UserMenu name={identity.name} detail={identity.detail} homeHref={homeHref} onSignOut={() => setConfirmingSignOut(true)} />
            </div>
          </div>
        </header>

        <main key={pathname} className={`univote-page mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${isStudent ? "pb-28 lg:pb-10" : ""}`}>
          {children}
        </main>
      </div>

      {isStudent && <BottomTabs items={items} activeHref={activeHref} />}

      {confirmingSignOut && (
        <Dialog title={session.impersonator ? "Leave this account?" : "Sign out of UniVote?"} onClose={() => setConfirmingSignOut(false)} icon={<LogOutIcon width={22} height={22} />}>
          <p className="text-sm leading-relaxed text-slate-600">
            {session.impersonator
              ? "You will return to your own administrator account."
              : <>You&apos;ll need your password{session.role === "admin" ? "" : " and a one-time code"} to sign back in. Anything you haven&apos;t submitted, such as an unfinished ballot or form, will be lost.</>}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setConfirmingSignOut(false)} className={btn.secondary} autoFocus>Stay here</button>
            <button type="button" onClick={() => signOut("logout")} className={btn.danger}>
              <LogOutIcon width={16} height={16} /> {session.impersonator ? "Leave account" : "Sign out"}
            </button>
          </div>
        </Dialog>
      )}

      <IdleGuard role={session.role} onTimeout={() => signOut("timeout")} onSignOut={() => signOut("logout")} />
    </div>
  );
}

// Mobile tab bar for students: the most-used destinations stay one thumb-tap away.
function BottomTabs({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  const short: Record<string, string> = {
    "/student": "Home",
    "/student/elections": "Vote",
    "/student/apply": "Run",
    "/student/results": "Results",
    "/student/verify": "Verify",
  };
  return (
    <nav aria-label="Quick navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {items.slice(0, 5).map((item) => {
          const active = item.href === activeHref;
          return (
            <li key={item.href} className="flex-1">
              <Link href={item.href} aria-current={active ? "page" : undefined} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold">
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 [&>svg]:size-[20px] ${active ? "bg-urblue text-white shadow-[var(--shadow-brand)]" : "text-slate-500"}`}>
                  {item.icon}
                </span>
                <span className={active ? "text-urblue" : "text-slate-500"}>{short[item.href] ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function UserMenu({ name, detail, homeHref, onSignOut }: { name: string; detail?: string; homeHref: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-xl py-1 pl-1 pr-1 transition hover:bg-urblue-50 sm:pr-2.5"
      >
        <Avatar name={name} size="sm" />
        <span className="hidden min-w-0 text-left md:block">
          <span className="block max-w-36 truncate text-sm font-semibold leading-5 text-slate-900">{name}</span>
          <span className="block max-w-36 truncate text-[11px] text-slate-500">{detail}</span>
        </span>
        <ChevronDownIcon width={16} height={16} className={`hidden text-slate-400 transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="univote-sheet absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(0,34,51,.45)]">
          <div className="flex items-center gap-3 rounded-xl bg-urblue-25 p-3">
            <Avatar name={name} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{detail}</p>
            </div>
          </div>
          <Link role="menuitem" href={homeHref} onClick={() => setOpen(false)} className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-urblue-50 hover:text-urblue">
            <HomeIcon width={17} height={17} /> My dashboard
          </Link>
          <Link role="menuitem" href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-urblue-50 hover:text-urblue">
            <ArrowLeftIcon width={17} height={17} /> Public website
          </Link>
          <div className="my-1 h-px bg-slate-100" />
          <button role="menuitem" type="button" onClick={() => { setOpen(false); onSignOut(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50">
            <LogOutIcon width={17} height={17} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function Dialog({ title, onClose, children, icon }: { title: string; onClose: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-urblue-deep/60 p-4 backdrop-blur-sm [animation:univote-fade_.2s_ease_both] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="univote-sheet w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {icon && <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue">{icon}</span>}
        <h2 id="dialog-title" className="text-lg font-bold">{title}</h2>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  );
}

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;

// Warns before an idle session is signed out, with a countdown and a way to stay signed in.
function IdleGuard({ role, onTimeout, onSignOut }: { role: Role; onTimeout: () => void; onSignOut: () => void }) {
  const settings = useSettings();
  const idleMs = settings.idleMinutes[role] * 60_000;
  const warnMs = Math.min(settings.warningSeconds * 1000, idleMs);
  const lastActive = useRef(0);
  const warning = useRef(false);
  const timeout = useRef(onTimeout);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    timeout.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    lastActive.current = Date.now();
  }, []);

  useEffect(() => {
    const bump = () => {
      // Activity only counts until the warning appears; after that the user must choose.
      if (!warning.current) lastActive.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = window.setInterval(() => {
      const remaining = idleMs - (Date.now() - lastActive.current);
      if (remaining <= 0) {
        window.clearInterval(timer);
        timeout.current();
      } else if (remaining <= warnMs) {
        warning.current = true;
        setSecondsLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(timer);
    };
  }, [idleMs, warnMs]);

  if (secondsLeft === null) return null;

  const stay = () => {
    warning.current = false;
    lastActive.current = Date.now();
    setSecondsLeft(null);
  };

  return (
    <Dialog title="Are you still there?" onClose={stay} icon={<AlertIcon width={22} height={22} className="text-amber-600" />}>
      <p className="text-sm leading-relaxed text-slate-600">
        For your security you&apos;ll be signed out in{" "}
        <strong className="tabular-nums text-foreground">{secondsLeft} second{secondsLeft === 1 ? "" : "s"}</strong> because there
        has been no activity for {settings.idleMinutes[role]} minutes. Unsaved work will be lost.
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-urblue-100">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${(secondsLeft / settings.warningSeconds) * 100}%` }} />
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onSignOut} className={btn.secondary}>Sign out now</button>
        <button type="button" onClick={stay} className={btn.primary} autoFocus>Stay signed in</button>
      </div>
    </Dialog>
  );
}
