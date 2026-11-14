"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_URL } from "../../lib/api";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  eduNexaId: string | null;
  role: string;
  mustChangePassword?: boolean;
};

const HEAD_HOME: Record<string, string> = {
  SCHOOL: "/dashboard/school",
  COLLEGE: "/dashboard/college",
  UNIVERSITY: "/dashboard/university",
  COACHING: "/dashboard/coaching",
  INSTITUTE: "/dashboard/institute",
  OTHER: "/dashboard/other",
};

export default function DashboardAuth({
  children,
  headOnly = false,
}: {
  children: ReactNode;
  headOnly?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const result: { user: CurrentUser } = await response.json();

        if (!result.user) {
          router.replace("/login");
          return;
        }

        if (result.user.mustChangePassword) {
          router.replace("/change-password");
          return;
        }

        if (headOnly && result.user.role !== "HEAD") {
          router.replace("/dashboard");
          return;
        }

        if (
          !headOnly &&
          pathname === "/dashboard" &&
          result.user.role === "HEAD"
        ) {
          // Send the head to the dashboard that matches their institution type.
          let target = "/dashboard/school";

          try {
            const meResponse = await fetch(`${API_URL}/dashboard/me`, {
              credentials: "include",
              cache: "no-store",
            });

            if (meResponse.ok) {
              const me: { institution?: { type?: string } } =
                await meResponse.json();
              const type = me.institution?.type;

              if (type && type in HEAD_HOME) target = HEAD_HOME[type];
            }
          } catch {
            // fall back to the school dashboard
          }

          router.replace(target);
          return;
        }

        if (active) setAuthorized(true);
      } catch {
        router.replace("/login");
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [headOnly, pathname, router]);

  if (!authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm font-medium text-slate-600">
          Verifying your EduNexa session...
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
