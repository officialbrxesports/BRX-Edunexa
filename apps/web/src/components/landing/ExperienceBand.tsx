import Image from "next/image";

const points = [
  "Student Portal",
  "Teacher Workflow",
  "Head Dashboard",
  "Academic Reports",
];

export function ExperienceBand() {
  return (
    <section className="relative overflow-hidden bg-blue-700">
      <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-950/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div className="relative h-[340px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl sm:h-[440px]">
          <Image
            src="/images/students/students-1.webp"
            alt="Students using BRX EduNexa"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
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
            Teachers manage academic activities. Students access their own
            information. Heads get a complete institutional view. BRX EduNexa
            connects the complete workflow.
          </p>

          <ul className="mt-8 grid grid-cols-2 gap-3">
            {points.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-4 text-xs font-bold backdrop-blur-xl sm:text-sm"
              >
                <span className="mr-2 text-blue-200" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
