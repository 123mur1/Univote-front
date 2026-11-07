"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { btn } from "./ui";
import { UserPlusIcon } from "./icons";
import { useHydrated } from "@/lib/local-store";
import { homeFor, useSession } from "@/lib/session";

const links = [
  { href: "/elections", label: "Elections" },
  { href: "/results", label: "Results" },
  { href: "/verify", label: "Verify my vote" },
  { href: "/about", label: "About us" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const hydrated = useHydrated();
  const session = useSession();
  const destination = hydrated && session ? homeFor(session.role) : "/login";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-urblue-50 hover:text-urblue"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/student/apply" className={`${btn.secondary} hidden sm:inline-flex`}>
            <UserPlusIcon width={16} height={16} /> Apply as candidate
          </Link>
          <Link href={destination} className={btn.primary}>{hydrated && session ? "Dashboard" : "Sign in"}</Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        <Link
          href="/student/apply"
          className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-urblue hover:bg-urblue-50"
        >
          Apply as candidate
        </Link>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-urblue-50 hover:text-urblue"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
