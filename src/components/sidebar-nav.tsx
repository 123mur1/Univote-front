"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean; permission?: string; section?: string };

export function activeHrefFor(items: NavItem[], pathname: string) {
  return (
    items
      .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
      .sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null
  );
}

function ActiveNav({ items, collapsed, onNavigate }: { items: NavItem[]; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavList items={items} activeHref={activeHrefFor(items, pathname)} collapsed={collapsed} onNavigate={onNavigate} />;
}

function NavList({ items, activeHref, collapsed = false, onNavigate }: { items: NavItem[]; activeHref: string | null; collapsed?: boolean; onNavigate?: () => void }) {
  // Group consecutive items that share a section heading.
  const groups: { section?: string; items: NavItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return (
    <nav className="flex flex-col gap-5 px-3" aria-label="Main">
      {groups.map((group, gi) => (
        <div key={`${group.section ?? "main"}-${gi}`} className="flex flex-col gap-1">
          {group.section && (
            collapsed
              ? <span aria-hidden="true" className="mx-auto mb-1 h-px w-6 bg-white/15" />
              : <p className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-urblue-300/90">{group.section}</p>
          )}
          {group.items.map((item) => {
            const isActive = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-[13.5px] font-semibold transition-all duration-200 ${collapsed ? "justify-center px-2" : "px-3"} ${
                  isActive
                    ? "bg-white text-urblue shadow-[0_10px_26px_-14px_rgba(0,20,35,.8)]"
                    : "text-urblue-100/90 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {isActive && !collapsed && <span aria-hidden="true" className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" />}
                <span className={`flex shrink-0 transition-transform duration-200 [&>svg]:size-[19px] ${isActive ? "" : "group-hover:scale-110"}`}>{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function SidebarNav({ items, activeHref, collapsed, onNavigate }: { items: NavItem[]; activeHref?: string | null; collapsed?: boolean; onNavigate?: () => void }) {
  if (activeHref !== undefined) return <NavList items={items} activeHref={activeHref} collapsed={collapsed} onNavigate={onNavigate} />;
  return <ActiveNav items={items} collapsed={collapsed} onNavigate={onNavigate} />;
}
