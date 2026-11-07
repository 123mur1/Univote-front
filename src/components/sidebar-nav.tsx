"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean; permission?: string };

function ActiveNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const active =
    items
      .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
  return <NavList items={items} activeHref={active} />;
}

function NavList({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const isActive = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            title={item.label}
            className={`flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition md:justify-start md:px-3 ${
              isActive ? "bg-white text-urblue shadow-sm" : "text-urblue-100 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav({ items, activeHref }: { items: NavItem[]; activeHref?: string | null }) {
  if (activeHref !== undefined) return <NavList items={items} activeHref={activeHref} />;
  return <ActiveNav items={items} />;
}
