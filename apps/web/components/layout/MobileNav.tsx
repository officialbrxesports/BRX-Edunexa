"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getInstitutionModules } from "@/lib/institution/institution-modules";
import type { InstitutionType } from "@/lib/institution/modules";

type Props = {
  institutionType: InstitutionType;
};

export default function MobileNav({
  institutionType,
}: Props) {
  const pathname = usePathname();
  const modules = getInstitutionModules(institutionType);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#080d1c]/95 px-2 py-2 backdrop-blur-2xl lg:hidden">
      <div className="flex gap-1 overflow-x-auto">
        {modules.slice(0, 6).map((module) => {
          const active =
            pathname === module.path ||
            pathname.startsWith(`${module.path}/`);

          return (
            <Link
              key={module.key}
              href={module.path}
              className={`flex min-w-[72px] flex-1 flex-col items-center justify-center rounded-xl px-2 py-2 transition ${
                active
                  ? "bg-blue-600/15 text-blue-300"
                  : "text-slate-500 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span className="text-lg">
                {module.icon}
              </span>

              <span className="mt-1 max-w-[70px] truncate text-[9px] font-semibold">
                {module.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}