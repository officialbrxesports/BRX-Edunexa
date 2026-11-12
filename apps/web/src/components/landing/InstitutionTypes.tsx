import Image from "next/image";
import Link from "next/link";
import { Section } from "./Section";

const institutions = [
  {
    number: "01",
    title: "Schools",
    type: "SCHOOL",
    subtitle: "Complete school management",
    text: "Manage students, teachers, classes, sections, attendance, examinations, fees, homework and parent communication from one connected platform.",
    image: "/images/campus/campus-1.webp",
    tags: ["Students", "Teachers", "Classes", "Fees"],
  },
  {
    number: "02",
    title: "Colleges",
    type: "COLLEGE",
    subtitle: "Modern academic workflow",
    text: "Organize departments, courses, programs, semesters, faculty, students, examinations, results and institutional operations.",
    image: "/images/institutions/college.webp",
    tags: ["Departments", "Courses", "Semester", "Results"],
  },
  {
    number: "03",
    title: "Universities",
    type: "UNIVERSITY",
    subtitle: "Powerful university ecosystem",
    text: "Build a connected academic environment for faculties, departments, programs, research, students, faculty and campus operations.",
    image: "/images/students/students-1.webp",
    tags: ["Programs", "Research", "Faculty", "Campus"],
  },
  {
    number: "04",
    title: "Coaching",
    type: "COACHING",
    subtitle: "Batches, tests & performance",
    text: "Manage batches, students, teachers, tests, mock examinations, attendance, fees, study material and performance analytics.",
    image: "/images/courses/course-1.webp",
    tags: ["Batches", "Tests", "Attendance", "Ranking"],
  },
];

export function InstitutionTypes() {
  return (
    <Section
      id="institutions"
      eyebrow="Built for every institution"
      title="One platform for every type of institution."
      description="BRX EduNexa adapts to different education environments while keeping management simple, connected and scalable."
    >
      <div className="space-y-8">
        {institutions.map((item, index) => {
          const flipped = index % 2 !== 0;

          return (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-2xl"
            >
              <div
                className={`grid min-h-[340px] ${
                  flipped
                    ? "lg:grid-cols-[1fr_1.08fr]"
                    : "lg:grid-cols-[1.08fr_1fr]"
                }`}
              >
                <div
                  className={`relative min-h-[300px] overflow-hidden ${
                    flipped ? "lg:order-2" : ""
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

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
                    flipped ? "lg:order-1" : ""
                  }`}
                >
                  <div className="mb-6 flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700">
                      {item.number}
                    </span>

                    <span
                      className="text-2xl text-blue-600 transition duration-300 group-hover:translate-x-2"
                      aria-hidden="true"
                    >
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
                      href={`/register?type=${item.type}`}
                      className="inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                    >
                      Explore {item.title}
                      <span className="ml-2" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}
