"use client";

import type { ReactNode } from "react";

import InstitutionSidebar from "@/components/layout/InstitutionSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import MobileNav from "@/components/layout/MobileNav";

import type { InstitutionType } from "@/lib/institution/modules";

type Props = {
  children: ReactNode;
  institutionType: InstitutionType;
  institutionName?: string;
  institutionCode?: string;
  userName?: string;
  userRole?: string;
};

export default function DashboardShell({
  children,
  institutionType,
  institutionName,
  institutionCode,
  userName,
  userRole,
}: Props) {
  return (
    <div className="min-h-screen bg-[#070b18] pb-20 text-white lg:pb-0">
      <InstitutionSidebar
        institutionType={institutionType}
        institutionName={institutionName}
        institutionCode={institutionCode}
        userName={userName}
        userRole={userRole}
      />

      <div className="min-h-screen lg:pl-[270px]">
        <DashboardHeader
          institutionName={institutionName}
          userName={userName}
          userRole={userRole}
        />

        <main className="p-4 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>

      <MobileNav institutionType={institutionType} />
    </div>
  );
}