import Image from "next/image";
import Link from "next/link";
import { Section } from "./Section";

export function Courses() {
  return (
    <Section
      id="courses"
      eyebrow="Academic ecosystem"
      title="Courses, batches and academic content."
      description="Keep academic structures organized and make teaching and learning resources easier to manage."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="relative min-h-[300px] overflow-hidden">
              <Image
                src="/images/courses/course-1.webp"
                alt="BRX EduNexa courses"
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                className="object-cover transition duration-700 hover:scale-105"
              />

              <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                Academic management
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                Organize your complete learning structure.
              </h3>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                Courses, subjects, batches, assignments, examinations and
                results can work together inside one connected platform.
              </p>

              <Link
                href="/login"
                className="mt-7 inline-flex w-fit rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
              >
                Open Portal
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </div>
        </article>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-56 overflow-hidden">
            <Image
              src="/images/teachers/teacher-1.webp"
              alt="BRX EduNexa teachers"
              fill
              sizes="(min-width: 1024px) 30vw, 100vw"
              className="object-cover transition duration-700 hover:scale-105"
            />

            <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
          </div>

          <div className="p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
              Faculty
            </p>

            <h3 className="mt-2 text-xl font-black text-slate-950">
              Connect teachers with students.
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage teachers, student assignments and academic
              responsibilities.
            </p>
          </div>
        </article>
      </div>
    </Section>
  );
}
