"use client";

import { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function HomeSection({
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
      <div className="mb-10 max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.22em] text-blue-600">
            {eyebrow}
          </p>
        )}

        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
          {title}
        </h2>

        {description && (
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}
