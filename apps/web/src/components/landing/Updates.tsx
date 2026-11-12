import Image from "next/image";
import Link from "next/link";
import { Section } from "./Section";

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

export function Updates() {
  return (
    <Section
      id="notices"
      className="bg-white"
      eyebrow="Latest updates"
      title="Stay informed."
      description="A central communication layer for important institutional updates and announcements."
    >
      <div className="grid gap-7 lg:grid-cols-[1fr_390px]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          {notices.map((notice) => (
            <div
              key={notice.title}
              className="group flex items-center gap-5 border-b border-slate-100 p-5 last:border-0 sm:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-black text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                {notice.number}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-black text-slate-900">{notice.title}</h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {notice.text}
                </p>
              </div>

              <span
                className="hidden text-blue-600 transition group-hover:translate-x-1 sm:block"
                aria-hidden="true"
              >
                →
              </span>
            </div>
          ))}
        </div>

        <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative h-60 overflow-hidden">
            <Image
              src="/images/notices/notice-1.webp"
              alt="Institution updates"
              fill
              sizes="(min-width: 1024px) 390px, 100vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 to-transparent" />

            <div className="absolute bottom-5 left-5 text-xs font-black uppercase tracking-[0.2em] text-white">
              BRX EduNexa Updates
            </div>
          </div>

          <div className="p-7">
            <h3 className="text-xl font-black text-slate-950">
              Institution updates
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep students, teachers, staff and families connected with timely
              information.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-flex text-sm font-black text-blue-700 hover:text-blue-800"
            >
              Open Portal
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </article>
      </div>
    </Section>
  );
}
