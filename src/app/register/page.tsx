import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { StudentRegistrationForm } from "./registration-form";

export const metadata: Metadata = { title: "Create student account" };

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <Logo />
        <div className="my-7 grid items-start gap-6 lg:my-10 lg:grid-cols-[minmax(0,1fr)_minmax(330px,0.72fr)] lg:gap-8">
          <aside className="order-first overflow-hidden rounded-3xl border border-sky-100 bg-sky-950 shadow-xl shadow-sky-950/10 lg:order-last lg:sticky lg:top-8">
            <div className="relative h-56 sm:h-72 lg:h-[min(78vh,760px)] lg:min-h-[640px]">
              <div
                role="img"
                aria-label="University of Rwanda students walking together on campus"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://mcfsp.ur.ac.rw/IMG/jpg/12.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sky-950 via-sky-950/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">UNIVERSITY OF RWANDA</span>
                <h2 className="mt-4 max-w-md text-2xl font-bold leading-tight sm:text-3xl">Your voice shapes our university.</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-sky-50">Create your student account to take part in campus elections and stay connected to your university community.</p>
              </div>
            </div>
          </aside>
          <section className="order-last min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-8 lg:order-first lg:p-9">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"><span className="h-1.5 w-1.5 rounded-full bg-sky-600" /> STUDENT SIGN UP</div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Create your student account</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Enter your university details and upload a current student card. Your account will be ready for sign-in after registration. Use the information shown on your student record.</p>
            <StudentRegistrationForm />
          </section>
        </div>
        <p className="pb-4 text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-urblue hover:underline">Sign in</Link></p>
      </div>
    </main>
  );
}
