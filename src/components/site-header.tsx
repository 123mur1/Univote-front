"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { btn } from "./ui";
import { ArrowRightIcon, MenuIcon, UserPlusIcon, XIcon } from "./icons";
import { useHydrated } from "@/lib/local-store";
import { homeFor, useSession } from "@/lib/session";

const links = [
  { href: "/elections", label: "Elections" },
  { href: "/results", label: "Results" },
  { href: "/verify", label: "Verify my vote" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const hydrated = useHydrated();
  const session = useSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const signedIn = hydrated && session;
  const destination = signedIn ? homeFor(session.role) : "/login";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled || menuOpen ? "border-b border-slate-200/80 bg-white/90 shadow-[0_8px_30px_-24px_rgba(11,34,48,.5)] backdrop-blur-xl" : "border-b border-transparent bg-white"}`}>
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 rounded-full border border-slate-200/80 bg-slate-50/70 p-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${isActive(l.href) ? "bg-white text-urblue shadow-sm ring-1 ring-slate-200" : "text-slate-600 hover:text-urblue"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/student/apply" className={`${btn.ghost} max-xl:hidden`}>
            <UserPlusIcon width={16} height={16} /> Run for office
          </Link>
          <Link href={destination} className={`${btn.primary} max-sm:hidden`}>
            {signedIn ? "My dashboard" : "Sign in"} <ArrowRightIcon width={16} height={16} />
          </Link>
          <button
            type="button"
            onClick={() => setMenuPath(menuOpen ? null : pathname)}
            className="inline-flex size-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-urblue-50 hover:text-urblue lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XIcon width={22} height={22} /> : <MenuIcon width={22} height={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="univote-sheet border-t border-slate-100 bg-white px-4 pb-6 pt-3 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-semibold transition ${isActive(l.href) ? "bg-urblue-50 text-urblue" : "text-slate-700 hover:bg-slate-50"}`}
              >
                {l.label} <ArrowRightIcon width={16} height={16} className="text-slate-300" />
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href={destination} className={btn.primary}>{signedIn ? "My dashboard" : "Sign in to vote"}</Link>
            <Link href="/student/apply" className={btn.secondary}><UserPlusIcon width={16} height={16} /> Run for office</Link>
          </div>
        </div>
      )}
    </header>
  );
}
