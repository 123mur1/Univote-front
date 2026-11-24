import Link from "next/link";
import Image from "next/image";

// The UniVote mark (ballot box with graduation cap) and wordmark. On the blue sidebar the mark
// sits on a white tile so it stays visible.
export function Logo({ inverse = false, href = "/", compact = false }: { inverse?: boolean; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${inverse ? "bg-white shadow-sm" : ""}`}>
        <Image src="/univote-mark.png" alt="" width={40} height={40} priority className={inverse ? "size-9" : "size-10"} />
      </span>
      <span className={compact ? "hidden md:block leading-tight" : "leading-tight"}>
        <span className={`block text-base font-extrabold tracking-wide ${inverse ? "text-white" : "text-urblue"}`}>
          UNIVOTE
        </span>
        <span className={`block text-[10px] font-medium uppercase tracking-wider ${inverse ? "text-urblue-200" : "text-slate-500"}`}>
          Secure Student Elections
        </span>
      </span>
    </Link>
  );
}

// The full logo with wordmark, for sign-in and sign-up pages.
export function FullLogo({ className = "" }: { className?: string }) {
  return <Image src="/univote-logo.png" alt="UniVote — Secure Student Elections" width={900} height={622} priority className={className} />;
}
