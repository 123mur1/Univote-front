"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { useHydrated } from "@/lib/local-store";
import { endSession, readSession, useSession } from "@/lib/session";
import { useSettings, type OfficerPermission, type Role } from "@/lib/settings";
import { Logo } from "./logo";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Avatar, btn } from "./ui";
import { AlertIcon, LockIcon, LogOutIcon } from "./icons";

const ROLE_NAMES: Record<Role, string> = { student: "Student", officer: "Election Officer", admin: "System Administrator" };

export function PortalShell({
  nav,
  role,
  requiredRole,
  homeHref,
  children,
}: {
  nav: NavItem[];
  role: string;
  requiredRole: Role;
  homeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const session = useSession();
  const allowed = session?.role === requiredRole;
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const settings = useSettings();
  // Officer menu items follow the permissions the administrator has granted.
  const items = requiredRole === "officer" ? nav.filter((i) => !i.permission || settings.officerPermissions[i.permission as OfficerPermission]) : nav;

  // Only someone signed in with this portal's role may see it.
  useEffect(() => {
    if (!hydrated || allowed) return;
    const reason = session ? "role" : "signin";
    router.replace(`/login?reason=${reason}&next=${encodeURIComponent(window.location.pathname)}`);
  }, [hydrated, allowed, session, router]);

  const signOut = useCallback(
    (reason: "logout" | "timeout") => {
      const s = readSession();
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

  if (!hydrated || !allowed) {
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

  return (
    <div className="flex min-h-screen flex-1 bg-urblue-50/60">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-urblue md:w-64">
        <div className="px-5 py-5">
          <Logo inverse href={homeHref} compact />
        </div>
        <p className="hidden px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-urblue-200 md:block">{role}</p>
        <div className="min-h-0 flex-1 overflow-y-auto pb-4">
          <Suspense fallback={<SidebarNav items={items} activeHref={null} />}>
            <SidebarNav items={items} />
          </Suspense>
        </div>
        <div className="border-t border-white/15 p-4">
          <div className="flex flex-col items-center gap-3 md:flex-row">
            <Avatar name={identity.name} size="sm" />
            <div className="hidden min-w-0 flex-1 md:block">
              <p className="truncate text-sm font-semibold text-white">{identity.name}</p>
              <p className="truncate text-xs text-urblue-200">{identity.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmingSignOut(true)}
              className="rounded-md p-1.5 text-urblue-200 hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOutIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <aside aria-label="Prototype security notice" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <strong>Prototype only:</strong> dashboard access and records are stored in this browser. Do not use real student data or conduct a real election until the backend enforces authentication, permissions and ballot rules.
          </aside>
          {children}
        </main>
      </div>

      {confirmingSignOut && (
        <Dialog title="Sign out of UniVote?" onClose={() => setConfirmingSignOut(false)}>
          <p className="text-sm leading-relaxed text-slate-600">
            You&apos;ll need your password{session.role === "admin" ? "" : " and a one-time code"} to sign back in. Anything you
            haven&apos;t submitted, such as an unfinished ballot or form, will be lost.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmingSignOut(false)} className={btn.secondary} autoFocus>
              Stay signed in
            </button>
            <button type="button" onClick={() => signOut("logout")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
              <LogOutIcon width={16} height={16} /> Sign out
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
        <button type="button" onClick={onSignOut} className={btn.secondary}>
          Sign out now
        </button>
        <button type="button" onClick={stay} className={btn.primary} autoFocus>
          Stay signed in
        </button>
      </div>
    </Dialog>
  );
}
