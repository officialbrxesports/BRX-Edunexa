"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  FileText,
  GraduationCap,
  KeyRound,
  LogOut,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { API_URL } from "../../lib/api";
import NoticeInbox from "./NoticeInbox";

type TestMark = {
  id: string;
  title: string;
  subject: string | null;
  batchName: string;
  testDate: string;
  maxMarks: number;
  marks: number | null;
  absent: boolean;
  rank: number | null;
  appeared: number;
};

type TranscriptInfo = {
  cgpa: number | null;
  totalCredits: number;
  semesters: { semester: number; sgpa: number | null }[];
};

type ShortCourseInfo = {
  id: string;
  title: string;
  durationWeeks: number;
  status: string;
  grade: string | null;
  completedOn: string | null;
  certificateNo: string | null;
};

type ProgramInfo = {
  name: string;
  code: string;
  department: string;
  semester: number;
  totalSemesters: number;
  rollNo: string | null;
  courses: { id: string; code: string; title: string; credits: number }[];
  totalCredits: number;
};

type AttendanceInfo = {
  month: string;
  present: number;
  late: number;
  absent: number;
  percent: number | null;
  recent: { date: string; status: string }[];
};

function AttendanceBox({ data }: { data: AttendanceInfo }) {
  if (data.percent === null) {
    return <p className="p-5 text-sm text-slate-500">No attendance marked this month yet.</p>;
  }

  return (
    <div className="p-4">
      <p className="text-3xl font-bold text-slate-900">{data.percent}%</p>
      <p className="text-xs text-slate-500">
        Present {data.present} · Late {data.late} · Absent {data.absent} (this month)
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {data.recent.map((item) => (
          <span
            key={item.date}
            title={item.status}
            className={`px-2 py-1 text-[11px] font-semibold text-white ${
              item.status === "PRESENT"
                ? "bg-emerald-600"
                : item.status === "LATE"
                  ? "bg-amber-500"
                  : "bg-red-600"
            }`}
          >
            {new Date(item.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </span>
        ))}
      </div>
    </div>
  );
}

function TestList({ tests }: { tests: TestMark[] }) {
  if (tests.length === 0) {
    return <p className="p-5 text-sm text-slate-500">No test marks yet.</p>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {tests.map((test) => (
        <li
          key={test.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
        >
          <div>
            <p className="font-semibold text-slate-900">{test.title}</p>
            <p className="text-xs text-slate-500">
              {test.batchName}
              {test.subject ? ` · ${test.subject}` : ""} ·{" "}
              {new Date(test.testDate).toLocaleDateString("en-IN")}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            {test.absent ? (
              <p className="font-semibold text-slate-700">Absent</p>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">
                  {test.marks ?? "-"} / {test.maxMarks}
                </p>
                {test.rank !== null && (
                  <p>
                    Rank {test.rank} of {test.appeared}
                  </p>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

type Me = {
  role: string;
  institution: { name: string; type: string };
  profile: { name: string; email: string; phone: string | null; eduNexaId: string };
  other?: {
    groups: { id: string; name: string; description: string | null }[];
    notices: {
      id: string;
      title: string;
      body: string;
      createdAt: string;
      groupName: string | null;
    }[];
  };
  student?: {
    className: string | null;
    sectionName: string | null;
    guardians: { name: string; relation: string }[];
    tests?: TestMark[];
    attendance?: AttendanceInfo;
    program?: ProgramInfo | null;
    shortCourses?: ShortCourseInfo[];
    transcript?: TranscriptInfo | null;
  };
  teacher?: {
    assignments: {
      id: string;
      subject: string;
      subjectCode: string;
      className: string;
      sectionName: string | null;
      weeklyPeriods: number;
    }[];
  };
  parent?: {
    children: {
      id: string;
      name: string;
      eduNexaId: string;
      relation: string;
      className: string | null;
      sectionName: string | null;
      tests?: TestMark[];
      attendance?: AttendanceInfo;
      program?: ProgramInfo | null;
      cgpa?: number | null;
    }[];
  };
};

const ROLE_LABEL: Record<string, string> = {
  STUDENT: "Student",
  TEACHER: "Teacher",
  PARENT: "Parent / Guardian",
  STAFF: "Staff",
  GUARD: "Security Guard",
  PLATFORM_ADMIN: "Platform Admin",
};

const ROLE_ICON: Record<string, LucideIcon> = {
  STUDENT: GraduationCap,
  TEACHER: BookOpen,
  PARENT: Users,
  GUARD: ShieldCheck,
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="p-5 text-sm text-slate-500">{text}</p>;
}

function classLabel(className: string | null, sectionName: string | null) {
  if (!className) return "Not assigned to a class yet";
  return sectionName ? `${className} · Section ${sectionName}` : className;
}

export default function RoleHome() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`${API_URL}/dashboard/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Could not load your dashboard.");

        const data = (await response.json()) as Me;
        if (active) setMe(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load.");
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const Icon = (me && ROLE_ICON[me.role]) || Building2;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center bg-white text-blue-800">
              <Building2 size={18} />
            </span>
            BRX EduNexa
          </Link>

          <div className="flex items-center gap-2">
            {me?.role === "TEACHER" && (
              <Link
                href="/editor"
                title="Notes (Word-style editor)"
                className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
              >
                <FileText size={14} />
                <span className="hidden sm:inline">Notes</span>
              </Link>
            )}
            <Link
              href="/change-password"
              className="flex h-8 items-center gap-1.5 bg-white/10 px-2.5 text-xs font-semibold hover:bg-white/20"
            >
              <KeyRound size={14} />
              <span className="hidden sm:inline">Change password</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              title="Logout"
              className="flex h-8 w-8 items-center justify-center hover:bg-white/10 disabled:opacity-50"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        {error && (
          <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {!me && !error && <p className="text-sm text-slate-500">Loading...</p>}

        {me && (
          <>
            <div className="flex items-center gap-4 border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-blue-50 text-blue-800">
                <Icon size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-blue-800">
                  {ROLE_LABEL[me.role] ?? me.role} · {me.institution.name}
                </p>
                <h1 className="truncate text-xl font-bold text-slate-900">
                  Welcome, {me.profile.name}
                </h1>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {me.profile.eduNexaId} · {me.profile.email}
                  {me.profile.phone ? ` · ${me.profile.phone}` : ""}
                </p>
              </div>
            </div>

            {me.role === "STUDENT" && me.student && (
              <div className="grid gap-5 md:grid-cols-2">
                <Card title="My class">
                  <p className="p-5 text-sm font-semibold text-slate-800">
                    {classLabel(me.student.className, me.student.sectionName)}
                  </p>
                </Card>
                <Card title="My parents / guardians">
                  {me.student.guardians.length === 0 ? (
                    <Empty text="No parent or guardian linked yet." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {me.student.guardians.map((guardian) => (
                        <li
                          key={`${guardian.name}-${guardian.relation}`}
                          className="flex justify-between px-4 py-3 text-sm"
                        >
                          <span className="font-semibold text-slate-800">
                            {guardian.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {guardian.relation.toLowerCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                {me.student.program !== undefined && (
                  <div className="md:col-span-2">
                    <Card title="My program">
                      {me.student.program === null ? (
                        <Empty text="You are not assigned to a program yet. Please contact the college office." />
                      ) : (
                        <div className="p-4">
                          <p className="text-sm font-bold text-slate-900">
                            {me.student.program.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {me.student.program.department} · Semester{" "}
                            {me.student.program.semester} of{" "}
                            {me.student.program.totalSemesters}
                            {me.student.program.rollNo
                              ? ` · Roll ${me.student.program.rollNo}`
                              : ""}
                          </p>
                          {me.student.program.courses.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-500">
                              No courses added for this semester yet.
                            </p>
                          ) : (
                            <ul className="mt-3 divide-y divide-slate-100 border border-slate-200">
                              {me.student.program.courses.map((course) => (
                                <li
                                  key={course.id}
                                  className="flex justify-between px-3 py-2 text-sm"
                                >
                                  <span className="text-slate-800">
                                    {course.title}{" "}
                                    <span className="text-xs text-slate-500">
                                      {course.code}
                                    </span>
                                  </span>
                                  <span className="text-xs text-slate-600">
                                    {course.credits} cr
                                  </span>
                                </li>
                              ))}
                              <li className="flex justify-between bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                                <span>Total</span>
                                <span>{me.student.program.totalCredits} credits</span>
                              </li>
                            </ul>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                )}
                {me.student.transcript && (
                  <div className="md:col-span-2">
                    <Card title="My results">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div>
                          <p className="text-3xl font-bold text-slate-900">
                            CGPA {me.student.transcript.cgpa ?? "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {me.student.transcript.semesters
                              .map((item) => `Sem ${item.semester}: ${item.sgpa ?? "-"}`)
                              .join(" · ")}
                          </p>
                        </div>
                        <Link
                          href="/dashboard/transcript"
                          className="text-xs font-semibold text-blue-800 underline"
                        >
                          View / print transcript
                        </Link>
                      </div>
                    </Card>
                  </div>
                )}
                {me.student.shortCourses && (
                  <div className="md:col-span-2">
                    <Card title="My courses & certificates">
                      {me.student.shortCourses.length === 0 ? (
                        <Empty text="You are not enrolled in any course yet." />
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {me.student.shortCourses.map((course) => (
                            <li
                              key={course.id}
                              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                            >
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {course.title}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {course.durationWeeks} weeks ·{" "}
                                  {course.status.toLowerCase()}
                                  {course.grade ? ` · grade ${course.grade}` : ""}
                                </p>
                              </div>
                              {course.certificateNo && (
                                <Link
                                  href={`/verify/${course.certificateNo}`}
                                  target="_blank"
                                  className="text-xs font-semibold text-blue-800 underline"
                                >
                                  View certificate
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </div>
                )}
                {me.student.attendance && (
                  <div className="md:col-span-2">
                    <Card title="My attendance">
                      <AttendanceBox data={me.student.attendance} />
                    </Card>
                  </div>
                )}
                {me.student.tests && (
                  <div className="md:col-span-2">
                    <Card title="My test results">
                      <TestList tests={me.student.tests} />
                    </Card>
                  </div>
                )}
              </div>
            )}

            {me.role === "TEACHER" &&
              (me.institution.type === "SCHOOL" ||
                me.institution.type === "COACHING") && (
                <Card title="My tools">
                  <div className="flex flex-wrap gap-2 p-4">
                    <Link
                      href="/dashboard/teacher/attendance"
                      className="h-9 bg-blue-800 px-4 text-xs font-semibold leading-9 text-white hover:bg-blue-900"
                    >
                      Take attendance
                    </Link>
                    {me.institution.type === "COACHING" && (
                      <Link
                        href="/dashboard/teacher/tests"
                        className="h-9 bg-blue-800 px-4 text-xs font-semibold leading-9 text-white hover:bg-blue-900"
                      >
                        Tests &amp; marks
                      </Link>
                    )}
                  </div>
                </Card>
              )}

            {me.role === "TEACHER" && me.teacher && (
              <Card title={`My subjects (${me.teacher.assignments.length})`}>
                {me.teacher.assignments.length === 0 ? (
                  <Empty text="No subjects assigned to you yet. Your school head can assign them." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {me.teacher.assignments.map((item) => (
                      <li
                        key={item.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {item.subject}{" "}
                            <span className="text-xs font-normal text-slate-500">
                              {item.subjectCode}
                            </span>
                          </p>
                          <p className="text-xs text-slate-500">
                            {classLabel(item.className, item.sectionName)}
                          </p>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {item.weeklyPeriods} periods / week
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {me.role === "PARENT" && me.parent && (
              <Card title={`My children (${me.parent.children.length})`}>
                {me.parent.children.length === 0 ? (
                  <Empty text="No student is linked to your account yet. Please contact the school." />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {me.parent.children.map((child) => (
                      <li
                        key={child.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{child.name}</p>
                          <p className="text-xs text-slate-500">
                            {child.eduNexaId} ·{" "}
                            {classLabel(child.className, child.sectionName)}
                          </p>
                        </div>
                        <span className="bg-slate-100 px-2 py-1 text-xs text-slate-700">
                          {child.relation.toLowerCase()}
                        </span>
                        {child.program && (
                          <p className="w-full text-xs text-slate-600">
                            {child.program.name} · Semester {child.program.semester}
                            {child.cgpa !== undefined && child.cgpa !== null
                              ? ` · CGPA ${child.cgpa}`
                              : ""}
                          </p>
                        )}
                        {child.attendance && (
                          <div className="w-full border-t border-slate-100 pt-2">
                            <p className="mb-1 text-xs font-bold text-slate-700">
                              Attendance
                            </p>
                            <AttendanceBox data={child.attendance} />
                          </div>
                        )}
                        {child.tests && (
                          <div className="w-full border-t border-slate-100 pt-2">
                            <p className="mb-1 text-xs font-bold text-slate-700">
                              Test results
                            </p>
                            <TestList tests={child.tests} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {!["STUDENT", "TEACHER", "PARENT"].includes(me.role) && (
              <Card title="Your workspace">
                <Empty text="Your tools for this role are being built. Nothing to show yet." />
              </Card>
            )}

            {me.other && (
              <div className="grid gap-5 md:grid-cols-2">
                <Card title="My groups">
                  {me.other.groups.length === 0 ? (
                    <Empty text="You are not in any group yet." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {me.other.groups.map((group) => (
                        <li key={group.id} className="px-4 py-3 text-sm">
                          <p className="font-semibold text-slate-900">{group.name}</p>
                          {group.description && (
                            <p className="text-xs text-slate-500">{group.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
                <Card title="Notices">
                  {me.other.notices.length === 0 ? (
                    <Empty text="No notice for you yet." />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {me.other.notices.map((notice) => (
                        <li key={notice.id} className="px-4 py-3 text-sm">
                          <p className="font-semibold text-slate-900">{notice.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(notice.createdAt).toLocaleDateString("en-IN")} ·{" "}
                            {notice.groupName ? `Group: ${notice.groupName}` : "Everyone"}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-700">
                            {notice.body}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            )}

            {me.role !== "HEAD" && <NoticeInbox />}

            <Card title="Coming soon">
              <p className="px-4 pb-1 pt-3 text-xs text-slate-500">
                These are not built yet, so no numbers are shown.
              </p>
              <div className="flex flex-wrap gap-2 p-4">
                {["Attendance", "Exams & results", "Fees"].map((name) => (
                  <span
                    key={name}
                    className="border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
