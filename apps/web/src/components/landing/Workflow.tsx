import { Section } from "./Section";

const steps = [
  ["01", "Create Institution", "Set up your institution and owner account."],
  ["02", "Configure Academics", "Add classes, courses, departments or batches."],
  ["03", "Connect People", "Add teachers and staff, and admit students."],
  [
    "04",
    "Manage Everything",
    "Run your daily academic and administrative workflow.",
  ],
] as const;

export function Workflow() {
  return (
    <Section
      className="border-y border-slate-200 bg-slate-50"
      eyebrow="Simple workflow"
      title="From setup to daily management."
      description="Start small and build your institution's digital workflow step by step."
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map(([number, title, text], index) => (
          <article
            key={number}
            className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-xs font-black text-white shadow-lg shadow-blue-700/20">
              {number}
            </div>

            <h3 className="mt-7 text-lg font-black text-slate-950">{title}</h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>

            {index < steps.length - 1 && (
              <div
                className="absolute right-[-13px] top-12 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 lg:flex"
                aria-hidden="true"
              >
                →
              </div>
            )}
          </article>
        ))}
      </div>
    </Section>
  );
}
