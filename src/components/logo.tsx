import Link from "next/link";

export function Logo({ inverse = false, href = "/", compact = false }: { inverse?: boolean; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${
          inverse ? "bg-white text-urblue" : "bg-urblue text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 13h16v7H4z" />
          <path d="M8 13V5h8v8" />
          <path d="m10 9 1.5 1.5L14 8" />
        </svg>
      </span>
      <span className={compact ? "hidden md:block leading-tight" : "leading-tight"}>
        <span className={`block text-base font-bold ${inverse ? "text-white" : "text-urblue"}`}>
          UniVote
        </span>
        <span className={`block text-[10px] font-medium uppercase tracking-wider ${inverse ? "text-urblue-200" : "text-slate-500"}`}>
          Secure Student Elections
        </span>
      </span>
    </Link>
  );
}
