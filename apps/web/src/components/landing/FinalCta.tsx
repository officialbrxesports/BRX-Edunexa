import Link from "next/link";

export function FinalCta() {
  return (
    <section className="px-5 py-16 sm:px-8 lg:px-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-14 text-center shadow-2xl sm:px-12 lg:py-20">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
            Start with BRX EduNexa
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Build a smarter digital institution today.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Create your institution account and bring your academic management
            workflow into one connected platform.
          </p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-1 hover:bg-blue-500"
            >
              Create Account
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-7 py-4 text-sm font-black text-white transition hover:bg-white/5"
            >
              Login to Portal
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
