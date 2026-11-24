import Link from "next/link";
import { Logo } from "./logo";
import { ChainIcon, LockIcon, ShieldIcon } from "./icons";

const columns = [
  {
    title: "Elections",
    links: [
      { href: "/elections", label: "Current elections" },
      { href: "/results", label: "Published results" },
      { href: "/student/apply", label: "Run for office" },
    ],
  },
  {
    title: "Transparency",
    links: [
      { href: "/verify", label: "Verify my ballot" },
      { href: "/audit", label: "Public audit log" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Access",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create student account" },
      { href: "/about", label: "About UniVote" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-urblue-deep text-urblue-100">
      <div aria-hidden="true" className="univote-grid-bg pointer-events-none absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div aria-hidden="true" className="univote-rope pointer-events-none absolute -right-24 -top-24 size-80 text-white/[0.06]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-14 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo inverse />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-urblue-200">
              The University of Rwanda&apos;s secure and transparent campus election system: anonymous voting, encrypted ballots
              and results anyone can verify.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-white/85">
              {[
                { icon: <LockIcon width={14} height={14} />, text: "Encrypted ballots" },
                { icon: <ShieldIcon width={14} height={14} />, text: "Anonymous voting" },
                { icon: <ChainIcon width={14} height={14} />, text: "Public audit trail" },
              ].map((b) => (
                <li key={b.text} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">{b.icon}{b.text}</li>
              ))}
            </ul>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-urblue-200 transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-urblue-300 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ur-logo.png" alt="University of Rwanda" className="size-8 rounded-full bg-white p-0.5" />
            <span>University of Rwanda · University Electoral Commission</span>
          </div>
          <span>UniVote · STCEMS</span>
        </div>
      </div>
    </footer>
  );
}
