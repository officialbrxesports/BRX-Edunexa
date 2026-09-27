"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "http://localhost:3000";

type User = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
};

type Enrollment = {
  id: string;
  class?: {
    id: string;
    name: string;
    code: string;
  };
  section?: {
    id: string;
    name: string;
    code: string;
  };
  createdAt: string;
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;

    loadStudent();
    loadEnrollments();
  }, [studentId]);

  async function loadStudent() {
    try {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        throw new Error("Login session nahi mila.");
      }

      const response = await fetch(`${API}/users/${studentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Student load nahi hua.",
        );
      }

      setStudent(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Student load nahi hua.",
      );
    }
  }

  async function loadEnrollments() {
    try {
      const token = localStorage.getItem("brx_access_token");

      if (!token) {
        throw new Error("Login session nahi mila.");
      }

      const response = await fetch(
        `${API}/academics/students/${studentId}/enrollments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Enrollment data load nahi hua.",
        );
      }

      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Enrollment data load nahi hua.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !student) {
    return (
      <main className="min-h-screen bg-[#070b18] p-4 text-white sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-500/20 bg-red-500/[0.06] p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            BRX EduNexa
          </p>

          <h1 className="mt-3 text-2xl font-black">
            Student Profile Error
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {error || "Student nahi mila."}
          </p>

          <Link
            href="/students"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            ← Back to Students
          </Link>
        </div>
      </main>
    );
  }

  const fullName =
    `${student.firstName} ${student.lastName || ""}`.trim();

  const initials =
    `${student.firstName?.charAt(0) || ""}${student.lastName?.charAt(0) || ""}`.toUpperCase();

  const isActive =
    student.status.toUpperCase() === "ACTIVE";

  const latestEnrollment = enrollments[0];

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">

        {/* Top Navigation */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/students"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-300"
            >
              ← Students
            </Link>

            <div className="mt-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                BRX EduNexa
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Student Profile
              </h1>
            </div>
          </div>

          <div
            className={`w-fit rounded-full border px-4 py-2 text-xs font-bold ${
              isActive
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-orange-400/20 bg-orange-400/10 text-orange-300"
            }`}
          >
            ● {student.status}
          </div>
        </div>

        {/* Hero Profile */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111a38] via-[#0c1430] to-[#090e20] shadow-2xl">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[28px] border border-blue-300/20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-2xl font-black text-blue-200 shadow-xl shadow-blue-950/30 sm:h-28 sm:w-28 sm:text-3xl">
                  {initials || "S"}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      Student
                    </span>

                    {latestEnrollment?.class?.name && (
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-bold text-slate-400">
                        {latestEnrollment.class.name}
                      </span>
                    )}
                  </div>

                  <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                    {fullName}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {student.email}
                  </p>

                  {student.phone && (
                    <p className="mt-1 text-sm text-slate-500">
                      {student.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[390px]">
                <ProfileMetric
                  label="Enrollments"
                  value={String(enrollments.length)}
                  icon="🎓"
                />

                <ProfileMetric
                  label="Class"
                  value={
                    latestEnrollment?.class?.name || "-"
                  }
                  icon="🏫"
                />

                <ProfileMetric
                  label="Section"
                  value={
                    latestEnrollment?.section?.name || "-"
                  }
                  icon="▦"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">

          {/* Basic Information */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <SectionHeading
              title="Basic Information"
              description="Student account information."
              icon="👤"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                label="First Name"
                value={student.firstName}
              />

              <InfoCard
                label="Last Name"
                value={student.lastName || "Not provided"}
              />

              <InfoCard
                label="Email"
                value={student.email}
              />

              <InfoCard
                label="Phone"
                value={student.phone || "Not provided"}
              />

              <InfoCard
                label="Role"
                value={student.role}
              />

              <InfoCard
                label="Account Status"
                value={student.status}
                status={isActive ? "active" : "inactive"}
              />

              <InfoCard
                label="Student ID"
                value={student.id}
                fullWidth
              />
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <SectionHeading
              title="Quick Actions"
              description="Student related modules."
              icon="⚡"
            />

            <div className="mt-6 space-y-3">
              <ActionLink
                href={`/attendance`}
                icon="✓"
                title="Attendance"
                description="View attendance module"
              />

              <ActionLink
                href={`/fees`}
                icon="₹"
                title="Fees"
                description="Open fees management"
              />

              <ActionLink
                href={`/students`}
                icon="👨‍🎓"
                title="All Students"
                description="Back to student directory"
              />
            </div>
          </section>
        </div>

        {/* Enrollment */}
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-xl sm:p-6">
          <SectionHeading
            title="Academic Enrollment"
            description="Student ke classes aur sections."
            icon="🎓"
          />

          <div className="mt-6">
            {enrollments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">
                  🎓
                </div>

                <h3 className="mt-4 font-bold text-slate-300">
                  No enrollment found
                </h3>

                <p className="mt-1 text-sm text-slate-600">
                  Is student ko abhi kisi class me enroll nahi
                  kiya gaya hai.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {enrollments.map((enrollment, index) => (
                  <EnrollmentCard
                    key={enrollment.id}
                    enrollment={enrollment}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer ID */}
        <div className="pb-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700">
            BRX EduNexa • Student Management
          </p>
        </div>
      </div>
    </main>
  );
}

function ProfileMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{icon}</span>

        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
          {label}
        </span>
      </div>

      <p className="mt-3 truncate text-lg font-black text-slate-200">
        {value}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
        {icon}
      </div>

      <div>
        <h2 className="font-black text-white">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  status,
  fullWidth = false,
}: {
  label: string;
  value: string;
  status?: "active" | "inactive";
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-black/10 p-4 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      {status ? (
        <span
          className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${
            status === "active"
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-orange-400/20 bg-orange-400/10 text-orange-300"
          }`}
        >
          {value}
        </span>
      ) : (
        <p className="mt-2 break-all text-sm font-semibold text-slate-300">
          {value}
        </p>
      )}
    </div>
  );
}

function ActionLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-blue-400/20 hover:bg-blue-500/[0.06]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-200">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-600">
          {description}
        </p>
      </div>

      <span className="text-slate-600">→</span>
    </Link>
  );
}

function EnrollmentCard({
  enrollment,
  index,
}: {
  enrollment: Enrollment;
  index: number;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/10 p-5 transition hover:border-blue-400/15 hover:bg-white/[0.025]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Enrollment {index + 1}
          </p>

          <h3 className="mt-2 text-lg font-black text-white">
            {enrollment.class?.name || "Class not assigned"}
          </h3>
        </div>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
          Active
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <EnrollmentInfo
          label="Class Code"
          value={enrollment.class?.code || "-"}
        />

        <EnrollmentInfo
          label="Section"
          value={enrollment.section?.name || "-"}
        />

        <EnrollmentInfo
          label="Section Code"
          value={enrollment.section?.code || "-"}
        />

        <EnrollmentInfo
          label="Enrolled"
          value={formatDate(enrollment.createdAt)}
        />
      </div>
    </div>
  );
}

function EnrollmentInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1.5 truncate text-xs font-semibold text-slate-300">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-[#070b18] p-4 text-white sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="h-20 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />

        <div className="h-52 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
          <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        </div>

        <div className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
      </div>
    </main>
  );
}