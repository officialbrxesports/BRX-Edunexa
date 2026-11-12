import { Section } from "./Section";

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

export function Features() {
  return (
    <Section
      id="features"
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

              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white"
                aria-hidden="true"
              >
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
    </Section>
  );
}
