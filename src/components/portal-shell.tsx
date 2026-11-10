"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Avatar, btn } from "./ui";
import { AlertIcon, ArrowLeftIcon, LockIcon, LogOutIcon, MenuIcon, XIcon } from "./icons";
import { GlobalSearch } from "./global-search";
import { NotificationBell } from "./notification-bell";

const ROLE_NAMES: Record<Role, string> = { student: "Student", officer: "Election Officer", admin: "System Administrator" };
const SEARCH_HINT: Record<Role, string> = {
  student: "Search elections and candidates…",
  officer: "Search elections, students, applicants…",
  admin: "Search users, students, elections…",
};

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
  const settings = useSettings();
  const visiting = session?.role === "admin" && requiredRole !== "admin";
  // Officer menu items follow the permissions the administrator has granted.
  const items = requiredRole === "officer" && !visiting ? nav.filter((i) => !i.permission || settings.officerPermissions[i.permission as OfficerPermission]) : nav;

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
      <div className="flex min-h-screen flex-1 items-center justify-center bg-urblue-50/60 p-6">
        <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          <LockIcon width={18} height={18} className="text-urblue" />
          {hydrated ? "Redirecting to sign in…" : "Checking your access…"}
        </div>
      </div>
    );
  }

  const identity = { name: session.name, detail: session.role === "student" ? session.regNumber ?? session.detail : ROLE_NAMES[session.role] };

  const sidebar = (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <Logo inverse href={homeHref} />
        <button type="button" onClick={() => setDrawerPath(null)} className="rounded-lg p-1.5 text-urblue-100 hover:bg-white/10 lg:hidden" aria-label="Close menu">
          <XIcon width={20} height={20} />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-urblue-200">{role}</p>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <Suspense fallback={<SidebarNav items={items} activeHref={null} />}>
          <SidebarNav items={items} />
        </Suspense>
        {visiting && (
          <div className="mx-3 mt-4 rounded-xl border border-white/15 bg-white/[0.06] p-3">
            <p className="text-xs leading-5 text-urblue-100">You are using the election office with administrator rights.</p>
            <Link href="/admin" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-white hover:underline">
              <ArrowLeftIcon width={14} height={14} /> Back to admin console
            </Link>
          </div>
        )}
      </div>
      <div className="border-t border-white/15 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={identity.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{identity.name}</p>
            <p className="truncate text-xs text-urblue-200">{identity.detail}</p>
          </div>
          <button type="button" onClick={() => setConfirmingSignOut(true)} className="rounded-md p-1.5 text-urblue-200 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out">
            <LogOutIcon width={18} height={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-1 bg-[#f4f8fa]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-gradient-to-b from-urblue to-urblue-dark lg:flex">{sidebar}</aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-urblue-darker/60 backdrop-blur-sm" onClick={() => setDrawerPath(null)} aria-label="Close menu" />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-gradient-to-b from-urblue to-urblue-dark shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {session.impersonator && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
            <span className="inline-flex items-center gap-2">
              <AlertIcon width={17} height={17} />
              Signed in as <strong>{session.name}</strong> ({ROLE_NAMES[session.role]}) on behalf of {session.impersonator.name}. Voting is disabled in this mode.
            </span>
            <button type="button" onClick={() => returnToAdmin()} className="rounded-lg bg-amber-950 px-3 py-1 text-xs font-bold text-white hover:bg-black">
              Return to my admin account
            </button>
          </div>
        )}

        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-10">
            <button type="button" onClick={() => setDrawerPath(pathname)} className="inline-flex size-10 items-center justify-center rounded-xl text-slate-600 hover:bg-urblue-50 hover:text-urblue lg:hidden" aria-label="Open menu">
              <MenuIcon width={22} height={22} />
            </button>
            <div className="min-w-0 flex-1">
              <GlobalSearch placeholder={SEARCH_HINT[session.role]} />
            </div>
            <NotificationBell />
            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <Avatar name={identity.name} size="sm" />
              <div className="hidden min-w-0 md:block">
                <p className="max-w-40 truncate text-sm font-semibold leading-5 text-slate-900">{identity.name}</p>
                <p className="max-w-40 truncate text-xs text-slate-500">{identity.detail}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      </div>

      {confirmingSignOut && (
        <Dialog title={session.impersonator ? "Leave this account?" : "Sign out of UniVote?"} onClose={() => setConfirmingSignOut(false)}>
          <p className="text-sm leading-relaxed text-slate-600">
            {session.impersonator
              ? "You will return to your own administrator account."
              : <>You&apos;ll need your password{session.role === "admin" ? "" : " and a one-time code"} to sign back in. Anything you haven&apos;t submitted, such as an unfinished ballot or form, will be lost.</>}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmingSignOut(false)} className={btn.secondary} autoFocus>Stay here</button>
            <button type="button" onClick={() => signOut("logout")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
              <LogOutIcon width={16} height={16} /> {session.impersonator ? "Leave account" : "Sign out"}
            </button>
          </div>
        </Dialog>
      )}

      <IdleGuard role={session.role} onTimeout={() => signOut("timeout")} onSignOut={() => signOut("logout")} />
    </div>
  );
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-urblue-darker/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
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
    <Dialog title="Are you still there?" onClose={stay}>
      <div className="flex gap-3">
        <AlertIcon className="mt-0.5 shrink-0 text-amber-600" />
        <p className="text-sm leading-relaxed text-slate-600">
          For your security you&apos;ll be signed out in{" "}
          <strong className="tabular-nums text-foreground">{secondsLeft} second{secondsLeft === 1 ? "" : "s"}</strong> because there
          has been no activity for {settings.idleMinutes[role]} minutes. Unsaved work will be lost.
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-urblue-100">
        <div className="h-full bg-amber-500 transition-all" style={{ width: `${(secondsLeft / settings.warningSeconds) * 100}%` }} />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onSignOut} className={btn.secondary}>Sign out now</button>
        <button type="button" onClick={stay} className={btn.primary} autoFocus>Stay signed in</button>
      </div>
    </Dialog>
  );
}
