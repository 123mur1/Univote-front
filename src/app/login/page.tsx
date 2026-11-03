import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { BallotIcon, CheckCircleIcon, ShieldIcon } from "@/components/icons";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f2f7fa] px-3 py-4 sm:px-6 sm:py-8 lg:grid lg:place-items-center">
      <section className="mx-auto grid min-h-[min(760px,calc(100vh-4rem))] w-full max-w-6xl overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-28px_rgba(15,39,51,0.22)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#003650] via-[#005577] to-[#087ca0] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-24 size-[26rem] rounded-full bg-cyan-200/10 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 size-[30rem] rounded-full border border-white/10" />
          <div className="relative"><Logo inverse /></div>

          <div className="relative my-14 max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-cyan-50">
              <ShieldIcon width={15} height={15} /> UNIVERSITY OF RWANDA
            </div>
            <h1 className="mt-6 text-4xl font-bold leading-[1.12] tracking-tight xl:text-[2.8rem]">
              Your voice belongs in every election.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-cyan-50/85">
              Sign in to follow campus elections, review candidates and take part in the votes you are eligible for.
            </p>

            <div className="mt-10 rounded-2xl border border-white/15 bg-white/[0.08] p-5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white">Your UniVote journey</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["01", "Sign in"],
                  ["02", "Explore"],
                  ["03", "Take part"],
                ].map(([number, title], index) => (
                  <div key={number} className="relative rounded-xl bg-white/[0.08] px-3 py-3.5">
                    {index < 2 && <span aria-hidden="true" className="absolute -right-2 top-6 z-10 h-px w-4 bg-cyan-200/60" />}
                    <span className="text-[11px] font-bold tracking-widest text-cyan-200">{number}</span>
                    <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-4 border-t border-white/15 pt-5 text-xs text-cyan-100/75">
            <span>University Electoral Commission</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircleIcon width={15} height={15} /> UniVote portal</span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-white px-5 py-7 sm:px-10 sm:py-10 lg:justify-center lg:px-14 xl:px-20">
          <div className="mb-9 lg:hidden"><Logo /></div>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-urblue-50 text-urblue ring-1 ring-urblue-100">
              <BallotIcon width={24} height={24} />
            </div>
            <LoginForm />
            <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-500">
              Keep your password and one-time code private. If you need access help, contact your campus election office.
            </p>
          </div>
        </div>
      </section>
      <p className="mx-auto mt-5 max-w-6xl px-2 text-center text-xs text-slate-500">UniVote · University of Rwanda</p>
    </main>
  );
}
