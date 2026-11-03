import Link from "next/link";
import { Logo } from "./logo";

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
      </div>
    </footer>
  );
}
