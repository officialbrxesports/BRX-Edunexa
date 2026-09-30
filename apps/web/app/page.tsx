"use client";

import Link from "next/link";
import HomeSection from "@/components/home/HomeSection";

const institutions = [
  {
    number: "01",
    title: "Schools",
    subtitle: "Complete school management",
    text: "Manage students, teachers, classes, sections, attendance, examinations, fees, homework and parent communication from one connected platform.",
    image: "/images/campus/campus-1.jpg",
    tags: ["Students", "Teachers", "Classes", "Fees"],
  },
  {
    number: "02",
    title: "Colleges",
    subtitle: "Modern academic workflow",
    text: "Organize departments, courses, programs, semesters, faculty, students, examinations, results and institutional operations.",
    image: "/images/institutions/college.jpg",
    tags: ["Departments", "Courses", "Semester", "Results"],
  },
  {
    number: "03",
    title: "Universities",
    subtitle: "Powerful university ecosystem",
    text: "Build a connected academic environment for faculties, departments, programs, research, students, faculty and campus operations.",
    image: "/images/students/students-1.jpg",
    tags: ["Programs", "Research", "Faculty", "Campus"],
  },
  {
    number: "04",
    title: "Coaching",
    subtitle: "Batches, tests & performance",
    text: "Manage batches, students, teachers, tests, mock examinations, attendance, fees, study material and performance analytics.",
    image: "/images/courses/0535191d83b4a6bfa8310e3d4b534f54.jpg",
    tags: ["Batches", "Tests", "Attendance", "Ranking"],
  },
];

const features = [
  {
    number: "01",
    title: "Student Management",
    text: "Profiles, enrollment, academic records and student activities in one organized workspace.",
  },
  {
    number: "02",
    title: "Teacher Management",
    text: "Create teachers, connect students and manage academic responsibilities with ease.",
  },
  {
    number: "03",
    title: "Attendance",
    text: "Track daily attendance across classes, sections and batches with clear records.",
  },
  {
    number: "04",
    title: "Fees & Payments",
    text: "Create fee plans, generate student fees, record payments and manage receipts.",
  },
  {
    number: "05",
    title: "Assignments",
    text: "Create, publish and manage academic assignments from a centralized workflow.",
  },
  {
    number: "06",
    title: "Exams & Results",
    text: "Organize examinations, marks, results and academic performance systematically.",
  },
  {
    number: "07",
    title: "Reports & Analytics",
    text: "Turn institutional data into useful reports and understandable insights.",
  },
  {
    number: "08",
    title: "Notifications",
    text: "Keep students, teachers, staff and families connected with important updates.",
  },
  {
    number: "09",
    title: "Documents",
    text: "Keep important institutional records organized and accessible from one place.",
  },
];

const notices = [
  {
    number: "01",
    title: "Admissions & Institution Updates",
    text: "Important information for students and institution management.",
  },
  {
    number: "02",
    title: "Academic Notices",
    text: "Announcements related to classes, courses and academic activities.",
  },
  {
    number: "03",
    title: "Examination Updates",
    text: "Examination schedules, results and other important academic updates.",
  },
  {
    number: "04",
    title: "General Announcements",
    text: "Keep your complete institution informed through one communication layer.",
  },
];

const workflow = [
  ["01", "Create Institution", "Set up your institution and owner account."],
  ["02", "Configure Academics", "Add classes, courses, departments or batches."],
  ["03", "Connect People", "Create teachers, staff and student accounts."],
  ["04", "Manage Everything", "Run your daily academic and administrative workflow."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition duration-300 group-hover:scale-105">
              <img
                src="/images/common/Picsart_26-09-27_18-49-28-808.png"
                alt="BRX EduNexa Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="leading-none">
              <div className="text-[17px] font-black tracking-tight text-slate-950">
                BRX EduNexa
              </div>

              <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-blue-600">
                Education Management
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <a
              href="#home"
              className="text-sm font-bold text-blue-700"
            >
              Home
            </a>

            <a
              href="#institutions"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              Institutions
            </a>

            <a
              href="#features"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              Features
            </a>

            <a
              href="#courses"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              Academic
            </a>

            <a
              href="#notices"
              className="text-sm font-semibold text-slate-600 transition hover:text-blue-700"
            >
              Notices
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:block"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>


        {/* =========================
            BRX EDUNEXA — HERO SECTION
        ========================= */}
        <section
          id="home"
          className="w-full bg-white px-0 py-0 sm:px-3 sm:py-4 lg:px-5 lg:py-6"
        >
          <div className="relative mx-auto w-full max-w-[1500px] overflow-hidden border-[3px] border-slate-950 bg-slate-950 shadow-[0_20px_70px_rgba(15,23,42,0.22)] sm:border-[5px]">
            
            {/* Banner */}
            <div className="relative h-[430px] overflow-hidden sm:h-[500px] lg:h-[560px]">
              
              {/* Main Image */}
              <img
                src="/images/hero/main-banner.jpg"
                alt="BRX EduNexa Education Campus"
                className="absolute inset-0 h-full w-full object-cover object-center"
              />

              {/* Dark cinematic overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/15" />

              {/* Bottom depth */}
              <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              {/* Blue cinematic glow */}
              <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-blue-600/25 blur-[100px]" />
              <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-[90px]" />

              {/* Content */}
              <div className="relative z-10 flex h-full items-center">
                <div className="w-full px-6 py-10 sm:px-10 lg:px-16 xl:px-20">
                  
                  {/* Badge */}
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-xl">
                    <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
                    Smart Education Management
                  </div>

                  {/* Heading */}
                  <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                    One Platform.
                    <br />

                    <span className="bg-gradient-to-r from-blue-300 via-cyan-200 to-white bg-clip-text text-transparent">
                      Every Institution.
                    </span>
                  </h1>

                  {/* Description */}
                  <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base sm:leading-7 lg:text-lg">
                    BRX EduNexa brings schools, colleges, universities, coaching
                    institutes and educational organizations together in one powerful
                    digital ecosystem.
                  </p>

                  {/* Buttons */}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    
                    <Link
                      href="/register"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_35px_rgba(37,99,235,0.35)] transition hover:bg-blue-500 hover:shadow-[0_12px_40px_rgba(37,99,235,0.5)]"
                    >
                      Create Institution
                      <span>→</span>
                    </Link>

                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-xl transition hover:bg-white/20"
                    >
                      Open Portal
                      <span>↗</span>
                    </Link>
                  </div>

                  {/* Mini trust points */}
                  <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-300 sm:text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-cyan-300">✓</span>
                      School to University
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="text-cyan-300">✓</span>
                      Web + Mobile
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="text-cyan-300">✓</span>
                      Secure Role Access
                    </span>
                  </div>
                </div>
              </div>

              {/* Top-right floating education card */}
              <div className="absolute right-5 top-5 z-20 hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl sm:block lg:right-8 lg:top-8">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
                  BRX EduNexa
                </div>

                <div className="mt-1 text-sm font-bold text-white">
                  Digital Education Ecosystem
                </div>
              </div>

              {/* Bottom-right stats card */}
              <div className="absolute bottom-5 right-5 z-20 hidden rounded-2xl border border-white/15 bg-slate-950/55 px-5 py-4 backdrop-blur-xl md:block lg:bottom-8 lg:right-8">
                <div className="flex items-center gap-5">
                  
                  <div>
                    <div className="text-xl font-black text-white">01</div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      Platform
                    </div>
                  </div>

                  <div className="h-8 w-px bg-white/15" />

                  <div>
                    <div className="text-xl font-black text-white">04+</div>
                    <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      Institution Types
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>


      {/* =========================================================
          TRUST STRIP
      ========================================================= */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 sm:grid-cols-4">

          {[
            ["01", "Students", "Connected"],
            ["02", "Teachers", "Organized"],
            ["03", "Academics", "Managed"],
            ["04", "Reports", "Insights"],
          ].map(([number, title, subtitle]) => (
            <div
              key={number}
              className="group px-5 py-7 text-center transition hover:bg-blue-50/40 sm:py-8"
            >
              <div className="text-[10px] font-black tracking-[0.2em] text-blue-600">
                {number}
              </div>

              <div className="mt-2 text-base font-black text-slate-950 sm:text-lg">
                {title}
              </div>

              <div className="mt-1 text-xs font-semibold text-slate-500">
                {subtitle}
              </div>
            </div>
          ))}

        </div>
      </section>


      {/* =========================================================
          INSTITUTIONS
      ========================================================= */}

      <div id="institutions">

        <HomeSection
          eyebrow="Built for every institution"
          title="One platform for every type of institution."
          description="BRX EduNexa adapts to different education environments while keeping management simple, connected and scalable."
        >

          <div className="space-y-8">

            {institutions.map((item, index) => (

              <article
                key={item.title}
                className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
              >

                <div
                  className={`grid min-h-[340px] ${
                    index % 2 === 0
                      ? "lg:grid-cols-[1.08fr_1fr]"
                      : "lg:grid-cols-[1fr_1.08fr]"
                  }`}
                >

                  <div
                    className={`relative min-h-[300px] overflow-hidden ${
                      index % 2 !== 0 ? "lg:order-2" : ""
                    }`}
                  >

                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

                    <div className="absolute left-6 top-6 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-xl">
                      BRX EduNexa
                    </div>

                    <div className="absolute bottom-6 left-6">
                      <div className="text-5xl font-black text-white/20">
                        {item.number}
                      </div>

                      <div className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                        {item.subtitle}
                      </div>
                    </div>

                  </div>


                  <div
                    className={`flex flex-col justify-center p-8 sm:p-10 lg:p-14 ${
                      index % 2 !== 0 ? "lg:order-1" : ""
                    }`}
                  >

                    <div className="mb-6 flex items-center justify-between">

                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                        {item.number}
                      </span>

                      <span className="text-2xl text-blue-600 transition duration-300 group-hover:translate-x-2">
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

                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}

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


      {/* =========================================================
          STATS
      ========================================================= */}

      <section className="relative overflow-hidden bg-slate-950">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.25),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.15),transparent_25%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">

          <div className="mb-12 max-w-2xl">

            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
              One connected ecosystem
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Everything connected.
              <span className="block text-blue-400">
                Everyone organized.
              </span>
            </h2>

          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">

            {[
              ["01", "Student Management", "Profiles, enrollment & records"],
              ["02", "Teacher Workflow", "Teaching & student management"],
              ["03", "Academic Operations", "Classes, courses & examinations"],
              ["04", "Institution Reports", "Data, insights & performance"],
            ].map(([number, title, text]) => (

              <div
                key={number}
                className="bg-slate-950/90 p-7 transition hover:bg-blue-950/70 sm:p-8"
              >

                <div className="text-xs font-black tracking-[0.2em] text-blue-400">
                  {number}
                </div>

                <h3 className="mt-7 text-lg font-black text-white">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {text}
                </p>

              </div>

            ))}

          </div>

        </div>
      </section>


      {/* =========================================================
          FEATURES
      ========================================================= */}

      <div id="features">

        <HomeSection
          eyebrow="Powerful features"
          title="Everything your institution needs."
          description="A complete digital foundation for academic management, administration and daily institutional operations."
        >

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {features.map((feature) => (

              <article
                key={feature.number}
                className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >

                <div className="flex items-center justify-between">

                  <span className="text-xs font-black tracking-[0.2em] text-blue-600">
                    {feature.number}
                  </span>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    +
                  </span>

                </div>

                <h3 className="mt-7 text-lg font-black text-slate-950">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.text}
                </p>

                <div className="mt-6 h-1 w-10 rounded-full bg-blue-600 transition-all duration-300 group-hover:w-20" />

              </article>

            ))}

          </div>

        </HomeSection>

      </div>


      {/* =========================================================
          CONNECTED EDUCATION
      ========================================================= */}

      <section className="relative overflow-hidden bg-blue-700">

        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-950/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">

          <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl">

            <img
              src="/images/students/students-1.jpg"
              alt="Students using BRX EduNexa"
              className="h-[340px] w-full object-cover sm:h-[440px]"
            />

          </div>


          <div className="text-white">

            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-200">
              Connected education
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Give every learner a better digital experience.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
              Teachers manage academic activities. Students access their
              own information. Heads get a complete institutional view.
              BRX EduNexa connects the complete workflow.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">

              {[
                "Student Portal",
                "Teacher Workflow",
                "Head Dashboard",
                "Academic Reports",
              ].map((item) => (

                <div
                  key={item}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-4 text-xs font-bold backdrop-blur-xl sm:text-sm"
                >
                  <span className="mr-2 text-blue-200">✓</span>
                  {item}
                </div>

              ))}

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          ACADEMIC ECOSYSTEM
      ========================================================= */}

      <div id="courses">

        <HomeSection
          eyebrow="Academic ecosystem"
          title="Courses, batches and academic content."
          description="Keep academic structures organized and make teaching and learning resources easier to manage."
        >

          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">

            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

              <div className="grid md:grid-cols-2">

                <div className="relative min-h-[300px] overflow-hidden">

                  <img
                    src="/images/courses/0535191d83b4a6bfa8310e3d4b534f54.jpg"
                    alt="BRX EduNexa Courses"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />

                </div>

                <div className="flex flex-col justify-center p-7 sm:p-9">

                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    Academic management
                  </p>

                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    Organize your complete learning structure.
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    Courses, subjects, batches, assignments,
                    examinations and results can work together
                    inside one connected platform.
                  </p>

                  <Link
                    href="/login"
                    className="mt-7 inline-flex w-fit rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                  >
                    Open Portal
                    <span className="ml-2">→</span>
                  </Link>

                </div>

              </div>

            </article>


            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

              <div className="relative h-56 overflow-hidden">

                <img
                  src="/images/teachers/teacher-1.jpg"
                  alt="BRX EduNexa Teachers"
                  className="h-full w-full object-cover transition duration-700 hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />

              </div>

              <div className="p-7">

                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  Faculty
                </p>

                <h3 className="mt-2 text-xl font-black text-slate-950">
                  Connect teachers with students.
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Manage teachers, student assignments and
                  academic responsibilities.
                </p>

              </div>

            </article>

          </div>

        </HomeSection>

      </div>


      {/* =========================================================
          WORKFLOW
      ========================================================= */}

      <section className="border-y border-slate-200 bg-slate-50">

        <HomeSection
          eyebrow="Simple workflow"
          title="From setup to daily management."
          description="Start small and build your institution's digital workflow step by step."
        >

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {workflow.map(([number, title, text]) => (

              <article
                key={number}
                className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xs font-black text-white shadow-lg shadow-blue-700/20">
                  {number}
                </div>

                <h3 className="mt-7 text-lg font-black text-slate-950">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {text}
                </p>

                {number !== "04" && (
                  <div className="absolute right-[-13px] top-12 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 lg:flex">
                    →
                  </div>
                )}

              </article>

            ))}

          </div>

        </HomeSection>

      </section>


      {/* =========================================================
          NOTICES
      ========================================================= */}

      <section
        id="notices"
        className="bg-white"
      >

        <HomeSection
          eyebrow="Latest updates"
          title="Stay informed."
          description="A central communication layer for important institutional updates and announcements."
        >

          <div className="grid gap-7 lg:grid-cols-[1fr_390px]">

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

              {notices.map((notice, index) => (

                <div
                  key={notice.title}
                  className="group flex items-center gap-5 border-b border-slate-100 p-5 last:border-0 sm:p-6"
                >

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                    {notice.number}
                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-black text-slate-900">
                      {notice.title}
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {notice.text}
                    </p>

                  </div>

                  <span className="hidden text-blue-600 transition group-hover:translate-x-1 sm:block">
                    →
                  </span>

                </div>

              ))}

            </div>


            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

              <div className="relative h-60 overflow-hidden">

                <img
                  src="/images/notices/pexels-eartharchive-5147366.jpg"
                  alt="Institution updates"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />

                <div className="absolute bottom-5 left-5 text-xs font-black uppercase tracking-[0.2em] text-white">
                  BRX EduNexa Updates
                </div>

              </div>

              <div className="p-7">

                <h3 className="text-xl font-black text-slate-950">
                  Institution updates
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Keep students, teachers, staff and families
                  connected with timely information.
                </p>

                <Link
                  href="/login"
                  className="mt-6 inline-flex text-sm font-black text-blue-700 hover:text-blue-800"
                >
                  Open Portal
                  <span className="ml-2">→</span>
                </Link>

              </div>

            </article>

          </div>

        </HomeSection>

      </section>


      {/* =========================================================
          FINAL CTA
      ========================================================= */}

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
              Create your institution account and bring your
              academic management workflow into one connected platform.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                href="/register"
                className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-1 hover:bg-blue-500"
              >
                Create Account
                <span className="ml-2">→</span>
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


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">

          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">

            <div>

              <Link
                href="/"
                className="flex items-center gap-3"
              >

                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-slate-100">
                  <img
                    src="/images/common/Picsart_26-09-27_18-49-28-808.png"
                    alt="BRX EduNexa"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <div className="font-black text-slate-950">
                    BRX EduNexa
                  </div>

                  <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.2em] text-blue-600">
                    Education Management
                  </div>
                </div>

              </Link>

              <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
                A modern education management platform designed
                for schools, colleges, universities and coaching institutions.
              </p>

            </div>


            <div>

              <h3 className="text-sm font-black text-slate-950">
                Platform
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-500">

                <a
                  href="#institutions"
                  className="block transition hover:text-blue-700"
                >
                  Institutions
                </a>

                <a
                  href="#features"
                  className="block transition hover:text-blue-700"
                >
                  Features
                </a>

                <a
                  href="#courses"
                  className="block transition hover:text-blue-700"
                >
                  Academic
                </a>

                <a
                  href="#notices"
                  className="block transition hover:text-blue-700"
                >
                  Notices
                </a>

              </div>

            </div>


            <div>

              <h3 className="text-sm font-black text-slate-950">
                Access
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-500">

                <Link
                  href="/login"
                  className="block transition hover:text-blue-700"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="block transition hover:text-blue-700"
                >
                  Create Institution
                </Link>

              </div>

            </div>


            <div>

              <h3 className="text-sm font-black text-slate-950">
                BRX EduNexa
              </h3>

              <div className="mt-5 space-y-3 text-sm text-slate-500">

                <div>School Management</div>
                <div>College Management</div>
                <div>University Management</div>
                <div>Coaching Management</div>

              </div>

            </div>

          </div>


          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

            <p>
              © 2026 BRX EduNexa. All rights reserved.
            </p>

            <div className="flex gap-5">
              <a href="#home" className="hover:text-blue-700">
                Home
              </a>

              <Link href="/login" className="hover:text-blue-700">
                Portal
              </Link>

              <Link href="/register" className="hover:text-blue-700">
                Register
              </Link>
            </div>

          </div>

        </div>

      </footer>

    </main>
  );
}