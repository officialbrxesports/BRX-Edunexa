const items = [
  ["01", "Students", "Connected"],
  ["02", "Teachers", "Organized"],
  ["03", "Academics", "Managed"],
  ["04", "Reports", "Insights"],
] as const;

export function Stats() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4">
        {items.map(([number, title, subtitle]) => (
          <div
            key={number}
            className="bg-white px-5 py-7 text-center transition hover:bg-blue-50 sm:py-8"
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
  );
}
