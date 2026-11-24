import Link from "next/link";
import { Logo } from "./logo";
<<<<<<< HEAD
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
=======

export function SiteFooter() {
  return (
    <footer className="bg-urblue-darker text-urblue-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo inverse />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-urblue-200">
            Secure and Transparent Campus Election Management System: anonymous voting, encrypted
            ballots and results anyone can verify.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Elections</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/elections" className="hover:text-white">Current elections</Link></li>
            <li><Link href="/results" className="hover:text-white">Published results</Link></li>
            <li><Link href="/student/apply" className="hover:text-white">Run for office</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Transparency</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/verify" className="hover:text-white">Verify my ballot</Link></li>
            <li><Link href="/audit" className="hover:text-white">Public audit log</Link></li>
            <li><Link href="/login" className="hover:text-white">Officer sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-urblue-300 sm:px-6">
          STCEMS prototype · University Electoral Commission
        </p>
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
      </div>
    </footer>
  );
}
