"use client";

import { Suspense, type ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { SidebarNav, type NavItem } from "./sidebar-nav";
import { Avatar } from "./ui";
import { LogOutIcon } from "./icons";

export function PortalShell({
  nav,
  user,
  role,
  homeHref,
  children,
}: {
  nav: NavItem[];
  user: { name: string; detail: string };
  role: string;
  homeHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState(user);
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem("univote.active-session.v1") ?? "null");
      if (session?.name) setIdentity({ name: session.name, detail: session.role === "officer" ? "Election Officer" : session.role === "admin" ? "Administrator" : session.detail });
    } catch {}
  }, []);
  function signOut() {
    localStorage.removeItem("univote.active-session.v1");
    router.push("/login");
  }
  return (
    <div className="flex min-h-screen flex-1 bg-urblue-50/60">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-urblue md:flex">
        <div className="px-5 py-5">
          <Logo inverse href={homeHref} />
        </div>
        <p className="px-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-urblue-200">
          {role}
        </p>
        <Suspense fallback={<SidebarNav items={nav} activeHref={null} />}>
          <SidebarNav items={nav} />
        </Suspense>
        <div className="mt-auto border-t border-white/15 p-4">
          <div className="flex items-center gap-3">
            <Avatar name={identity.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{identity.name}</p>
              <p className="truncate text-xs text-urblue-200">{identity.detail}</p>
            </div>
            <button onClick={signOut} className="rounded-md p-1.5 text-urblue-200 hover:bg-white/10 hover:text-white" aria-label="Sign out">
              <LogOutIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 bg-urblue px-4 py-3 md:hidden">
          <Logo inverse href={homeHref} />
          <button onClick={signOut} className="text-sm font-medium text-white">Sign out</button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-urblue-50 hover:text-urblue">
              {item.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
