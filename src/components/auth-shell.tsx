import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { ArrowLeftIcon, ChainIcon, EyeOffIcon, LockIcon } from "./icons";

const IMAGES = [
  { src: "/ur-campus.png", label: "University of Rwanda campus" },
  { src: "/ur-community.jpg", label: "University of Rwanda student community" },
  { src: "/ur-graduation.png", label: "University of Rwanda graduation" },
];

// Shared split layout for sign-in and sign-up: brand story on the left, the form on the right.
export function AuthShell({
  children,
  headline,
  text,
  footer,
  wide = false,
}: {
  children: ReactNode;
  headline: string;
  text: string;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <main className="flex min-h-screen bg-surface">
      <aside className="relative hidden w-[44%] max-w-[640px] shrink-0 overflow-hidden bg-urblue-deep lg:block">
        {IMAGES.map((image, index) => (
          <div
            key={image.src}
            role="img"
            aria-label={image.label}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${image.src}')`, opacity: index === 0 ? 1 : 0, animation: `univote-campus-crossfade 21s ${index * 7}s infinite` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-urblue-deep/80 via-urblue-darker/70 to-urblue-deep" />
        <div className="univote-grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div aria-hidden="true" className="univote-rope univote-spin-slow pointer-events-none absolute -right-32 top-24 size-[420px] text-white/10" />

        <div className="relative flex h-full min-h-screen flex-col justify-between p-10 xl:p-14">
          <Logo inverse />
          <div className="max-w-md">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 py-1.5 pl-1.5 pr-4 backdrop-blur-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ur-logo.png" alt="University of Rwanda" className="size-8 rounded-full bg-white p-0.5" />
              <span className="text-xs font-semibold text-white">University of Rwanda</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-[2.8rem]">{headline}</h1>
            <p className="mt-4 text-base leading-7 text-urblue-100/90">{text}</p>
            <ul className="mt-9 space-y-3">
              {[
                { icon: <LockIcon width={17} height={17} />, title: "Encrypted ballots", text: "Your choices are sealed on your device." },
                { icon: <EyeOffIcon width={17} height={17} />, title: "Anonymous by design", text: "Nobody can link a ballot to you." },
                { icon: <ChainIcon width={17} height={17} />, title: "Verifiable results", text: "Check your ballot with a private receipt." },
              ].map((f) => (
                <li key={f.title} className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">{f.icon}</span>
                  <span>
                    <span className="block text-sm font-bold text-white">{f.title}</span>
                    <span className="block text-xs text-urblue-200">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-urblue-300">University Electoral Commission · UniVote</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-10">
          <div className="lg:hidden"><Logo /></div>
          <Link href="/" className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-urblue">
            <ArrowLeftIcon width={16} height={16} /> Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-10 sm:px-8 lg:items-center">
          <div className={`univote-page w-full ${wide ? "max-w-2xl" : "max-w-[440px]"}`}>
            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(0,34,51,.35)] sm:p-9">
              {children}
            </div>
            {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
