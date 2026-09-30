"use client";

import Link from "next/link";
import HomeSection from "@/components/home/HomeSection";

const institutions = [
  {
    title: "Schools",
    text: "Complete school management for students, teachers, classes and parents.",
    image: "/images/campus/campus-1.jpg",
  },
  {
    title: "Colleges",
    text: "Manage departments, courses, semesters, faculty and students.",
    image: "/images/institutions/college.jpg",
  },
  {
    title: "Universities",
    text: "Powerful academic management for modern universities and institutions.",
    image: "/images/students/students-1.jpg",
  },
  {
    title: "Coaching",
    text: "Batches, tests, attendance, fees, study material and performance.",
    image: "/images/courses/0535191d83b4a6bfa8310e3d4b534f54.jpg",
  },
];

const features = [
  ["01", "Student Management", "Profiles, enrollment, academic records and daily activities."],
  ["02", "Attendance", "Simple attendance management for classes, batches and students."],
  ["03", "Fees & Payments", "Fee plans, generated fees, payments and receipts."],
  ["04", "Assignments", "Create, publish and manage assignments from one place."],
  ["05", "Exams & Results", "Organize examinations, marks and academic performance."],
  ["06", "Reports", "Clear institutional reports and useful analytics."],
];

const notices = [
  "Admissions and institution updates",
  "Academic notices and announcements",
  "Examination and result updates",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm">
              <img
                src="/images/common/Picsart_26-09-27_18-49-28-808.png"
                alt="BRX EduNexa Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="leading-none">
              <div className="text-lg font-black tracking-tight text-slate-950">
                BRX EduNexa
              </div>
              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Education Management
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a href="#home" className="text-sm font-semibold text-blue-700">Home</a>
            <a href="#institutions" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Institutions</a>
            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Features</a>
            <a href="#courses" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Courses</a>
            <a href="#notices" className="text-sm font-semibold text-slate-600 hover:text-blue-700">Notices</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="home" className="w-full">
        <div className="relative w-full overflow-hidden shadow-2xl">

          {/* BANNER IMAGE */}
          <div className="relative h-[430px] sm:h-[470px] lg:h-[500px]">

            <img
              src="/images/hero/main-banner.jpg"
              alt="BRX EduNexa"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* PREMIUM OVERLAY */}
            <div className="absolute inset-0 bg-slate-950/35" />

            {/* BLUE CINEMATIC GRADIENT */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-950/35 to-transparent" />

            {/* BOTTOM GRADIENT */}
            <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-950/80 to-transparent" />

            {/* CONTENT OVER IMAGE */}
            <div className="relative z-10 flex h-full items-center px-6 sm:px-10 lg:px-16">

              <div className="max-w-2xl">

                {/* BADGE */}
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white shadow-lg backdrop-blur-xl">
                  <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
                  BRX EduNexa
                </div>

                {/* HEADING */}
                <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-2xl sm:text-5xl lg:text-6xl">
                  Transforming
                  <span className="block bg-gradient-to-r from-blue-200 via-blue-400 to-white bg-clip-text text-transparent">
                    Education.
                  </span>
                </h1>

                {/* DESCRIPTION */}
                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-100/90 sm:text-base">
                  One powerful digital platform for schools, colleges,
                  universities and coaching institutions.
                </p>

                {/* BUTTONS */}
                <div className="mt-7 flex flex-wrap gap-3">

                  <Link
                    href="/register"
                    className="rounded-xl bg-blue-600 px-6 py-3.5 text-xs font-black text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-1 hover:bg-blue-500"
                  >
                    Create Institution
                    <span className="ml-2">→</span>
                  </Link>

                  <Link
                    href="/login"
                    className="rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-xs font-black text-white backdrop-blur-xl transition hover:bg-white/20"
                  >
                    Open Portal
                  </Link>

                </div>

                {/* MINI INFO */}
                <div className="mt-8 flex flex-wrap gap-3">

                  <div className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="text-sm font-black text-white">Schools</div>
                    <div className="text-[9px] text-slate-300">Complete management</div>
                  </div>

                  <div className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="text-sm font-black text-white">Colleges</div>
                    <div className="text-[9px] text-slate-300">Academic workflow</div>
                  </div>

                  <div className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 backdrop-blur-xl">
                    <div className="text-sm font-black text-white">Coaching</div>
                    <div className="text-[9px] text-slate-300">Batches & tests</div>
                  </div>

                </div>

              </div>
            </div>

            {/* PREMIUM LIGHT */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

            {/* SCROLL */}
            <div className="absolute bottom-5 right-7 hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-white/60 sm:flex">
              Explore
              <span className="text-sm">↓</span>
            </div>

          </div>
        </div>
      </section>

                               {/* INSTITUTIONS */}
      
        <div id="institutions">
          <HomeSection
            eyebrow="Built for every institution"
            title="One platform for every type of institution."
            description="BRX EduNexa adapts to schools, colleges, universities and coaching institutions with a connected digital workflow."
          >
            <div className="space-y-7">

              {institutions.map((item, index) => (
                <article
                  key={item.title}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
                >
                  <div
                    className={`grid min-h-[300px] ${
                      index % 2 === 0
                        ? "lg:grid-cols-[1.05fr_1fr]"
                        : "lg:grid-cols-[1fr_1.05fr]"
                    }`}
                  >

                    {/* IMAGE */}
                    <div
                      className={`relative min-h-[280px] overflow-hidden ${
                        index % 2 !== 0 ? "lg:order-2" : ""
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      <div className="absolute bottom-6 left-6 rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest text-white backdrop-blur-xl">
                        BRX EduNexa
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div
                      className={`flex flex-col justify-center p-8 sm:p-10 lg:p-14 ${
                        index % 2 !== 0 ? "lg:order-1" : ""
                      }`}
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                          0{index + 1}
                        </span>

                        <span className="text-2xl text-blue-600 transition-transform duration-300 group-hover:translate-x-2">
                          →
                        </span>
                      </div>

                      <h3 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                        {item.title}
                      </h3>

                      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                        {item.text}
                      </p>

                      <div className="mt-7 flex flex-wrap gap-2">
                        {index === 0 && (
                          <>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Students
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Teachers
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Classes
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Fees
                            </span>
                          </>
                        )}

                        {index === 1 && (
                          <>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Departments
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Courses
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Semester
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Results
                            </span>
                          </>
                        )}

                        {index === 2 && (
                          <>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Programs
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Research
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Faculty
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Campus
                            </span>
                          </>
                        )}

                        {index === 3 && (
                          <>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Batches
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Tests
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Attendance
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">
                              Ranking
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-8">
                        <Link
                          href="/register"
                          className="inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                        >
                          Explore {item.title}
                          <span className="ml-2">→</span>
                        </Link>
                      </div>
                    </div>

                  </div>
                </article>
              ))}

            </div>
          </HomeSection>
        </div>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-14 sm:px-8 lg:grid-cols-4 lg:px-10">
          {[
            ["Students", "Manage"],
            ["Teachers", "Connect"],
            ["Courses", "Organize"],
            ["Reports", "Understand"],
          ].map(([number, label]) => (
            <div key={number} className="text-center">
              <div className="text-2xl font-black text-blue-700 sm:text-3xl">
                {number}
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-500">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <div id="features">
        <HomeSection
          eyebrow="Powerful features"
          title="Everything your institution needs."
          description="Designed around the real academic and administrative workflow of modern institutions."
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(([number, title, text]) => (
              <div
                key={number}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-blue-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest text-blue-600">
                    {number}
                  </span>

                  <span className="text-blue-600">✦</span>
                </div>

                <h3 className="mt-7 text-lg font-black text-slate-950">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </HomeSection>
      </div>

      {/* CAMPUS IMAGE */}
      <section className="bg-blue-700">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">

          <div className="overflow-hidden rounded-3xl border border-white/20">
            <img
              src="/images/students/students-1.jpg"
              alt="Students using education platform"
              className="h-[340px] w-full object-cover sm:h-[420px]"
            />
          </div>

          <div className="text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
              Connected education
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Give every learner a better digital experience.
            </h2>

            <p className="mt-5 max-w-xl leading-8 text-blue-100">
              Teachers manage academic activities. Students access their
              own information. Heads get a complete institutional view.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                "Student portal",
                "Teacher workflow",
                "Head dashboard",
                "Academic reports",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-4 text-sm font-bold backdrop-blur"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* COURSES */}
      <div id="courses">
        <HomeSection
          eyebrow="Learning ecosystem"
          title="Courses, batches and academic content."
          description="Keep academic structures organized and make learning resources easier to manage."
        >
          <div className="grid gap-6 lg:grid-cols-3">

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="grid md:grid-cols-2">
                <img
                  src="/images/courses/0535191d83b4a6bfa8310e3d4b534f54.jpg"
                  alt="Courses"
                  className="h-64 w-full object-cover md:h-full"
                />

                <div className="p-7 sm:p-9">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                    Academic management
                  </p>

                  <h3 className="mt-3 text-2xl font-black text-slate-950">
                    Organize your complete learning structure.
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Courses, subjects, batches, assignments, examinations
                    and results can work together inside one platform.
                  </p>

                  <Link
                    href="/login"
                    className="mt-7 inline-flex rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white"
                  >
                    Open Portal
                  </Link>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/teachers/teacher-1.jpg"
                alt="Teachers"
                className="h-56 w-full object-cover"
              />

              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                  Faculty
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Connect teachers with students.
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Manage teachers, student assignments and academic work.
                </p>
              </div>
            </div>

          </div>
        </HomeSection>
      </div>

      {/* NOTICES */}
      <section id="notices" className="bg-slate-50">
        <HomeSection
          eyebrow="Latest updates"
          title="Stay informed."
          description="A central place for important institutional updates and announcements."
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              {notices.map((notice, index) => (
                <div
                  key={notice}
                  className="flex items-center gap-5 border-b border-slate-100 p-5 last:border-0"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
                    0{index + 1}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">{notice}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Latest institutional information
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/images/notices/pexels-eartharchive-5147366.jpg"
                alt="Education notice"
                className="h-56 w-full object-cover"
              />

              <div className="p-6">
                <h3 className="text-xl font-black text-slate-950">
                  Institution updates
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Keep students, teachers and families connected with
                  timely information.
                </p>
              </div>
            </div>

          </div>
        </HomeSection>
      </section>

      {/* CTA */}
      <section className="px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-12 text-center sm:px-12 lg:py-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
            Start with BRX EduNexa
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl">
            Build a smarter digital institution today.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
            Create your institution account and bring your academic
            management workflow into one platform.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white hover:bg-blue-500"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-7 py-4 text-sm font-black text-white hover:bg-white/5"
            >
              Login to Portal
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
          <div>
            <div className="font-black text-slate-950">
              BRX EduNexa
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Smart education management platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-xs font-semibold text-slate-500">
            <a href="#home" className="hover:text-blue-700">Home</a>
            <a href="#institutions" className="hover:text-blue-700">Institutions</a>
            <a href="#features" className="hover:text-blue-700">Features</a>
            <Link href="/login" className="hover:text-blue-700">Login</Link>
            <Link href="/register" className="hover:text-blue-700">Register</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
