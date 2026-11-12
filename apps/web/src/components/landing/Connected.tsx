const items = [
  ["01", "Student Management", "Profiles, enrollment & records"],
  ["02", "Teacher Workflow", "Teaching & student management"],
  ["03", "Academic Operations", "Classes, courses & examinations"],
  ["04", "Institution Reports", "Data, insights & performance"],
] as const;

export function Connected() {
  return (
    <section className="relative overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(37,99,235,0.25),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.15),transparent_25%)]" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
            One connected ecosystem
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Everything connected.
            <span className="block text-blue-400">Everyone organized.</span>
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(([number, title, text]) => (
            <div
              key={number}
              className="bg-slate-950/90 p-7 transition hover:bg-blue-950/70 sm:p-8"
            >
              <div className="text-xs font-black tracking-[0.2em] text-blue-400">
                {number}
              </div>

              <h3 className="mt-7 text-lg font-black text-white">{title}</h3>

              <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
