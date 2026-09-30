"use client";

import Link from "next/link";

const institutionTypes = [
  {
    icon: "SCH",
    title: "Schools",
    text: "Classes, students, teachers, attendance, exams and fees.",
  },
  {
    icon: "COL",
    title: "Colleges",
    text: "Departments, courses, semesters, faculty and student management.",
  },
  {
    icon: "UNI",
    title: "Universities",
    text: "Programs, departments, research, results and complete administration.",
  },
  {
    icon: "COA",
    title: "Coaching",
    text: "Batches, tests, study material, attendance and performance tracking.",
  },
];

const features = [
  {
    icon: "01",
    title: "Student Management",
    text: "Manage student profiles, enrollment, academic information and performance.",
  },
  {
    icon: "02",
    title: "Teacher Management",
    text: "Create teachers, assign students and manage academic responsibilities.",
  },
  {
    icon: "03",
    title: "Smart Attendance",
    text: "Track attendance and monitor student presence with organized records.",
  },
  {
    icon: "04",
    title: "Fees & Payments",
    text: "Create fee plans, generate fees, record payments and manage receipts.",
  },
  {
    icon: "05",
    title: "Assignments & Exams",
    text: "Manage assignments, tests, exams and academic activities from one place.",
  },
  {
    icon: "06",
    title: "Reports & Analytics",
    text: "Understand institution performance through useful dashboards and reports.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-black text-white shadow-lg shadow-blue-600/20">
              BRX
            </div>

            <div>
              <div className="text-lg font-black tracking-tight text-slate-950">
                BRX EduNexa
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Education Management
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#solutions"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              Solutions
            </a>
            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              Features
            </a>
            <a
              href="#about"
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              About
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-indigo-200/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:pb-28 lg:pt-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              One Platform. Complete Education Management.
            </div>

            <h1 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-7xl">
              Manage your entire
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                education ecosystem.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              BRX EduNexa brings students, teachers, staff, academics,
              attendance, fees, assignments, exams and reports together in one
              modern education management platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700"
              >
                Create Institution
                <span className="ml-2">-&gt;</span>
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-800 shadow-sm hover:border-blue-200 hover:bg-blue-50"
              >
                Open Portal
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
              <span>✓ School</span>
              <span>✓ College</span>
              <span>✓ University</span>
              <span>✓ Coaching</span>
              <span>✓ Institute</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-blue-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-blue-900/10">
              <div className="rounded-[1.5rem] bg-slate-950 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                      BRX EduNexa
                    </div>
                    <div className="mt-1 text-lg font-black text-white">
                      Institution Dashboard
                    </div>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-black text-blue-300">
                    BRX
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <PreviewCard label="Students" value="1,248" icon="ST" />
                  <PreviewCard label="Teachers" value="86" icon="TE" />
                  <PreviewCard label="Classes" value="42" icon="CL" />
                  <PreviewCard label="Attendance" value="94.8%" icon="AT" />
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Academic Overview
                    </span>
                    <span className="text-[10px] font-bold text-blue-300">
                      This Month
                    </span>
                  </div>

                  <div className="mt-5 flex h-28 items-end gap-2">
                    {[45, 60, 52, 76, 66, 88, 72, 95, 80, 100].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400"
                          style={{ height: `${height}%` }}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3">
                  <MiniPreview title="Fees" value="8.4L" />
                  <MiniPreview title="Results" value="92%" />
                  <MiniPreview title="Reports" value="24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4 sm:px-8">
          <TrustStat value="1 Platform" label="For education management" />
          <TrustStat value="5+ Types" label="Institutions supported" />
          <TrustStat value="30+ Modules" label="Management capabilities" />
          <TrustStat value="24/7" label="Digital access" />
        </div>
      </section>

      <section
        id="solutions"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <SectionHeading
          eyebrow="BUILT FOR EDUCATION"
          title="One platform for every institution"
          description="Whether you manage a school, college, university, coaching centre or institute, EduNexa adapts to your structure."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {institutionTypes.map((item) => (
            <div
              key={item.title}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xs font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                {item.icon}
              </div>

              <h3 className="mt-6 text-xl font-black text-slate-950">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {item.text}
              </p>

              <div className="mt-5 text-sm font-black text-blue-600">
                Explore solution -&gt;
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <SectionHeading
            dark
            eyebrow="POWERFUL FEATURES"
            title="Everything your institution needs"
            description="A connected system for daily operations, academic management and institutional growth."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-blue-400/30 hover:bg-white/[0.07]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-sm font-black text-blue-300">
                  {feature.icon}
                </div>

                <h3 className="mt-5 text-lg font-black">{feature.title}</h3>

                <p className="mt-2 text-sm leading-7 text-slate-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              SIMPLE WORKFLOW
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              From institution setup to daily management.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-slate-600">
              EduNexa is designed around a simple hierarchy so every person
              sees the information they actually need.
            </p>

            <div className="mt-8 space-y-5">
              <Workflow
                number="01"
                title="Head / Admin"
                text="Controls the institution, users, academics, finance and reports."
              />
              <Workflow
                number="02"
                title="Teacher"
                text="Manages assigned students, attendance, assignments and academics."
              />
              <Workflow
                number="03"
                title="Student"
                text="Accesses personal academics, attendance, assignments, fees and results."
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 sm:p-8">
            <div className="rounded-3xl bg-white p-6 shadow-xl shadow-blue-900/10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-600">
                    EDUCATION ECOSYSTEM
                  </div>
                  <div className="mt-1 text-xl font-black">
                    Connected Management
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-600">
                  BRX
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Connection label="Institution" icon="IN" />
                <Connection label="Teachers & Staff" icon="TS" />
                <Connection label="Students & Parents" icon="SP" />
                <Connection label="Academics & Results" icon="AR" />
                <Connection label="Fees & Reports" icon="FR" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-6 py-14 text-center text-white shadow-2xl shadow-blue-900/20 sm:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">
              BRX EDUNEXA
            </div>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Build a smarter education institution.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-blue-50 sm:text-base">
              Start your institution on a modern platform designed for
              students, teachers and administrators.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="rounded-2xl bg-white px-7 py-4 text-sm font-black text-blue-700 hover:bg-blue-50"
              >
                Create New Account
              </Link>

              <Link
                href="/login"
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-sm font-black text-white hover:bg-white/15"
              >
                Login to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-black text-slate-950">BRX EduNexa</div>
            <div className="mt-1 text-xs text-slate-500">
              Modern Education Management Platform
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>
            <Link href="/register" className="hover:text-blue-600">
              Register
            </Link>
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
          </div>

          <div className="text-xs text-slate-400">
            Copyright 2026 BRX EduNexa
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <div
        className={`text-xs font-black uppercase tracking-[0.2em] ${
          dark ? "text-blue-300" : "text-blue-600"
        }`}
      >
        {eyebrow}
      </div>

      <h2
        className={`mt-4 text-3xl font-black tracking-tight sm:text-5xl ${
          dark ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>

      <p
        className={`mt-5 leading-8 ${
          dark ? "text-slate-400" : "text-slate-600"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function PreviewCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-blue-300">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
          Live
        </span>
      </div>

      <div className="mt-4 text-xl font-black text-white">{value}</div>

      <div className="mt-1 text-[10px] font-semibold text-slate-400">
        {label}
      </div>
    </div>
  );
}

function MiniPreview({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className="text-[9px] font-semibold text-slate-500">{title}</div>
      <div className="mt-1 text-sm font-black text-white">{value}</div>
    </div>
  );
}

function TrustStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <div className="text-lg font-black text-slate-950 sm:text-xl">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-semibold text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Workflow({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-600">
        {number}
      </div>

      <div>
        <h3 className="font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function Connection({ label, icon }: { label: string; icon: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xs font-black text-blue-600 shadow-sm">
        {icon}
      </div>

      <div className="text-sm font-black text-slate-800">{label}</div>

      <div className="ml-auto text-blue-600">-&gt;</div>
    </div>
  );
}
