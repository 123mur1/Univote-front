import Link from "next/link";
import { Logo } from "./logo";
import { btn } from "./ui";

const links = [
  { href: "/elections", label: "Elections" },
  { href: "/results", label: "Results" },
  { href: "/verify", label: "Verify my vote" },
  { href: "/audit", label: "Audit log" },
];

export function SiteHeader() {
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
        <Link href="/login" className={btn.primary}>
          Sign in
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
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
