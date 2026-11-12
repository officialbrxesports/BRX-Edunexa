import Image from "next/image";
import Link from "next/link";

const highlights = [
  "School to University",
  "Works in your browser",
  "Role-based access",
];

export function Hero() {
  return (
    <section
      id="home"
      className="w-full bg-white px-0 py-0 sm:px-3 sm:py-4 lg:px-5 lg:py-6"
    >
      <div className="relative mx-auto w-full max-w-[1500px] overflow-hidden border-[3px] border-slate-950 bg-slate-950 shadow-[0_20px_70px_rgba(15,23,42,0.22)] sm:border-[5px]">
        <div className="relative flex min-h-[430px] items-center overflow-hidden sm:min-h-[500px] lg:min-h-[560px]">
          <Image
            src="/images/hero/main-banner.webp"
            alt="BRX EduNexa education campus"
            fill
            priority
            sizes="(min-width: 1500px) 1500px, 100vw"
            className="object-cover object-center"
          />

          <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/65 to-slate-950/15" />
          <div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-600/25 blur-[100px]" />
          <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-[90px]" />

          <div className="relative z-10 w-full px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
              Smart Education Management
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              One Platform.
              <br />
              <span className="bg-linear-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent">
                Every Institution.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7 lg:text-lg">
              BRX EduNexa brings schools, colleges, universities, coaching
              institutes and educational organizations together in one
              powerful digital ecosystem.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)]"
              >
                Create Institution
                <span aria-hidden="true">→</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20"
              >
                Open Portal
                <span aria-hidden="true">↗</span>
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-300 sm:text-sm">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-cyan-300" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="absolute right-5 top-5 z-20 hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl sm:block lg:right-8 lg:top-8">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              BRX EduNexa
            </div>

            <div className="mt-1 text-sm font-bold text-white">
              Digital Education Ecosystem
            </div>
          </div>

          <div className="absolute bottom-5 right-5 z-20 hidden rounded-2xl border border-white/15 bg-slate-950/55 px-5 py-4 backdrop-blur-xl lg:bottom-8 lg:right-8 lg:block">
            <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
              Built for
            </div>

            <div className="mt-1 text-sm font-bold text-white">
              Schools · Colleges · Universities · Coaching
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
