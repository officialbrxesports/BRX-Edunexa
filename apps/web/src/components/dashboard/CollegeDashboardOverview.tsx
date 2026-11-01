"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity, Bell, BookOpen, Building2, CalendarDays, CalendarCheck,
  ClipboardCheck, Clock3, Download, FileBarChart, GraduationCap,
  LayoutDashboard, LogOut, Menu, Megaphone, Plus, Search, Settings,
  ShieldCheck, Users, Wallet, X, UserRoundCheck, Library, BriefcaseBusiness,
} from "lucide-react";

type Faculty = {
  id: number;
  name: string;
  department: string;
  designation: string;
  status: "Active" | "On leave";
};

type Student = {
  id: number;
  name: string;
  programme: string;
  semester: string;
  roll: string;
  status: "Active" | "Inactive";
};

const menuItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Departments", icon: Building2 },
  { label: "Faculty & Staff", icon: Users },
  { label: "Students", icon: GraduationCap },
  { label: "Admissions", icon: UserRoundCheck },
  { label: "Courses & Programmes", icon: BookOpen },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Timetable", icon: Clock3 },
  { label: "Examinations", icon: ClipboardCheck },
  { label: "Fees & Finance", icon: Wallet },
  { label: "Library", icon: Library },
  { label: "Notices", icon: Megaphone },
  { label: "Reports", icon: FileBarChart },
  { label: "Settings", icon: Settings },
];

const initialFaculty: Faculty[] = [
  { id: 1, name: "Dr. Anil Kumar", department: "Computer Science", designation: "Professor", status: "Active" },
  { id: 2, name: "Dr. Neha Singh", department: "Mathematics", designation: "Associate Professor", status: "Active" },
  { id: 3, name: "Prof. Rahul Verma", department: "Commerce", designation: "Assistant Professor", status: "On leave" },
  { id: 4, name: "Dr. Priya Sharma", department: "Physics", designation: "Head of Department", status: "Active" },
];

const initialStudents: Student[] = [
  { id: 1, name: "Aarav Kumar", programme: "B.Sc. Computer Science", semester: "Semester 3", roll: "CS23041", status: "Active" },
  { id: 2, name: "Ananya Singh", programme: "B.Com", semester: "Semester 1", roll: "BC24018", status: "Active" },
  { id: 3, name: "Vivaan Sharma", programme: "B.A. English", semester: "Semester 5", roll: "BA22027", status: "Active" },
  { id: 4, name: "Diya Kumari", programme: "B.Sc. Mathematics", semester: "Semester 3", roll: "MA23012", status: "Inactive" },
  { id: 5, name: "Aditya Raj", programme: "BCA", semester: "Semester 1", roll: "CA24033", status: "Active" },
];

const departments = [
  { name: "Computer Science", hod: "Dr. Anil Kumar", faculty: 18, students: 420 },
  { name: "Mathematics", hod: "Dr. Neha Singh", faculty: 12, students: 285 },
  { name: "Commerce", hod: "Prof. Rahul Verma", faculty: 15, students: 360 },
  { name: "Physics", hod: "Dr. Priya Sharma", faculty: 10, students: 198 },
  { name: "English", hod: "Dr. Meera Das", faculty: 9, students: 175 },
];

const initialNotices = [
  { title: "Semester examination form submission", detail: "Students should complete the examination form process before the published deadline.", tag: "Examination" },
  { title: "Faculty meeting", detail: "Department coordinators meeting in the conference room.", tag: "Faculty" },
  { title: "Library orientation", detail: "Orientation session for newly admitted students.", tag: "Campus" },
];

function StatCard({ title, value, note, icon: Icon }: {
  title: string; value: string; note: string; icon: typeof Users;
}) {
  return (
    <article className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800"><Icon size={19} /></span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Activity size={13} />{note}</p>
    </article>
  );
}

function SectionTitle({ title, description, action }: {
  title: string; description: string; action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
      {action}
    </div>
  );
}

export default function CollegeDashboardOverview() {
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState(initialStudents);
  const [faculty] = useState(initialFaculty);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-10-30");
  const [noticeText, setNoticeText] = useState("");
  const [notices, setNotices] = useState(initialNotices);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentProgramme, setStudentProgramme] = useState("B.Sc. Computer Science");

  const filteredStudents = useMemo(
    () => students.filter((student) =>
      `${student.name} ${student.programme} ${student.roll}`.toLowerCase().includes(query.toLowerCase())
    ),
    [students, query],
  );

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentName.trim()) return;
    setStudents((current) => [...current, {
      id: Date.now(),
      name: studentName.trim(),
      programme: studentProgramme,
      semester: "Semester 1",
      roll: `NEW${String(current.length + 1).padStart(3, "0")}`,
      status: "Active",
    }]);
    setStudentName("");
    setShowStudentForm(false);
    setActive("Students");
  }

  function exportStudents() {
    const rows = [
      ["Name", "Programme", "Semester", "Roll number", "Status"],
      ...students.map((student) => [
        student.name, student.programme, student.semester, student.roll, student.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) =>
      `"${String(value).replace(/"/g, '""')}"`
    ).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "college-students.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="inline-flex h-9 w-9 items-center justify-center hover:bg-white/10 lg:hidden" aria-label="Toggle menu"><Menu size={20} /></button>
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="flex h-9 w-9 items-center justify-center bg-white text-blue-800"><Building2 size={21} /></span>
              <span>BRX EduNexa</span>
            </Link>
            <span className="hidden border-l border-white/30 pl-3 text-sm text-blue-100 sm:block">College Administration</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-blue-100 md:block">{today}</span>
            <button type="button" title="Notifications" onClick={() => setActive("Notices")} className="relative flex h-9 w-9 items-center justify-center hover:bg-white/10"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-300" /></button>
            <Link href="/login" title="Logout" className="flex h-9 w-9 items-center justify-center hover:bg-white/10"><LogOut size={18} /></Link>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {sidebarOpen && <button aria-label="Close menu overlay" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" />}
        <aside className={`${sidebarOpen ? "fixed inset-y-16 left-0 z-30 flex" : "hidden"} w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)]`}>
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800"><Building2 size={21} /></span>
              <div><p className="text-sm font-bold text-slate-900">My College</p><p className="text-xs text-slate-500">Administration panel</p></div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
            {menuItems.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => { setActive(label); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${active === label ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon size={17} /><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-emerald-600" />Secure institution workspace</div></div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">College workspace</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{active}</h1><p className="mt-1 text-sm text-slate-500">Manage academic operations, people and campus activities.</p></div>
              <span className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><CalendarDays size={14} className="mr-2 inline" />Academic year 2026â€“27</span>
            </div>

            {active === "Overview" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Total students" value="1,438" note="Across all programmes" icon={GraduationCap} />
                  <StatCard title="Faculty & staff" value="86" note="Teaching and non-teaching" icon={Users} />
                  <StatCard title="Departments" value="12" note="Academic departments" icon={Building2} />
                  <StatCard title="Attendance today" value="92.4%" note="Illustrative sample figure" icon={CalendarCheck} />
                </div>
                <div className="mt-6 grid gap-5 xl:grid-cols-3">
                  <section className="border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <SectionTitle title="Academic operations" description="Quick access to the college's key workflows." />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {menuItems.slice(1, 10).map(({ label, icon: Icon }) => (
                        <button key={label} onClick={() => setActive(label)} className="flex items-center gap-3 border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/40">
                          <span className="flex h-9 w-9 items-center justify-center bg-blue-50 text-blue-800"><Icon size={18} /></span>
                          <span className="text-sm font-semibold text-slate-700">{label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle title="Campus snapshot" description="Illustrative institution summary" />
                    <div className="space-y-4">
                      {[["Admissions this term", "324"], ["Programmes offered", "28"], ["Exams scheduled", "6"], ["Library resources", "12,500"]].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-sm text-slate-600">{label}</span><strong className="text-sm text-slate-900">{value}</strong></div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <section className="border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle title="Department summary" description="Faculty and student distribution" action={<button onClick={() => setActive("Departments")} className="text-xs font-semibold text-blue-800">View departments</button>} />
                    <div className="divide-y divide-slate-100">
                      {departments.slice(0, 4).map((department) => (
                        <div key={department.name} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{department.name}</p><p className="text-xs text-slate-500">HOD: {department.hod}</p></div><div className="text-right text-xs text-slate-500"><p>{department.faculty} faculty</p><p>{department.students} students</p></div></div>
                      ))}
                    </div>
                  </section>
                  <section className="border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle title="Recent notices" description="Campus announcements" action={<button onClick={() => setActive("Notices")} className="text-xs font-semibold text-blue-800">All notices</button>} />
                    <div className="space-y-3">{notices.slice(0, 3).map((notice) => <div key={notice.title} className="border-l-2 border-blue-600 bg-slate-50 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{notice.title}</p><span className="text-[10px] text-blue-700">{notice.tag}</span></div><p className="mt-1 text-xs text-slate-500">{notice.detail}</p></div>)}</div>
                  </section>
                </div>
                <section className="mt-5 border border-slate-200 bg-white p-5 shadow-sm">
                  <SectionTitle title="Today's campus schedule" description="Example schedule preview" />
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[["09:00", "Lecture Â· Computer Science"], ["10:00", "Practical Â· Physics Lab"], ["11:30", "Department meeting"], ["14:00", "Library orientation"]].map(([time, event]) => <div key={time} className="flex items-center gap-3 border border-slate-100 p-3"><span className="text-xs font-bold text-blue-800">{time}</span><span className="text-xs text-slate-700">{event}</span></div>)}</div>
                </section>
              </>
            ) : active === "Departments" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Academic departments" description={`${departments.length} sample departments`} />
                <div className="overflow-x-auto"><table className="w-full min-w-155 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Department", "Head of department", "Faculty", "Students"].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{departments.map((department) => <tr key={department.name}><td className="px-3 py-3 font-semibold">{department.name}</td><td className="px-3 py-3">{department.hod}</td><td className="px-3 py-3">{department.faculty}</td><td className="px-3 py-3">{department.students}</td></tr>)}</tbody></table></div>
              </section>
            ) : active === "Faculty & Staff" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Faculty & staff directory" description={`${faculty.length} sample staff records`} />
                <div className="overflow-x-auto"><table className="w-full min-w-155 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Name", "Department", "Designation", "Status"].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{faculty.map((person) => <tr key={person.id}><td className="px-3 py-3 font-semibold">{person.name}</td><td className="px-3 py-3">{person.department}</td><td className="px-3 py-3">{person.designation}</td><td className="px-3 py-3">{person.status}</td></tr>)}</tbody></table></div>
              </section>
            ) : active === "Students" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Student directory" description={`${students.length} records in this browser session`} action={<div className="flex gap-2"><button onClick={exportStudents} className="flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs hover:bg-slate-50"><Download size={14} />Export CSV</button><button onClick={() => setShowStudentForm(true)} className="flex h-9 items-center gap-2 bg-blue-800 px-3 text-xs text-white"><Plus size={14} />Add student</button></div>} />
                <div className="mb-4 flex items-center gap-2 border border-slate-300 px-3"><Search size={16} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, programme or roll number" className="h-10 w-full text-sm outline-none" /></div>
                <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Student", "Programme", "Semester", "Roll number", "Status", "Action"].map((heading) => <th key={heading} className="px-3 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredStudents.map((student) => <tr key={student.id}><td className="px-3 py-3 font-semibold">{student.name}</td><td className="px-3 py-3">{student.programme}</td><td className="px-3 py-3">{student.semester}</td><td className="px-3 py-3">{student.roll}</td><td className="px-3 py-3"><span className={`px-2 py-1 text-xs ${student.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{student.status}</span></td><td className="px-3 py-3"><button onClick={() => setStudents((current) => current.map((item) => item.id === student.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item))} className="text-xs font-semibold text-blue-800">{student.status === "Active" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No matching students found.</p>}</div>
              </section>
            ) : active === "Attendance" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Student attendance" description="Choose a date and mark attendance for the active sample roster." />
                <div className="mb-4 flex flex-wrap items-center gap-3"><label className="text-xs font-medium">Date <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="ml-2 h-9 border border-slate-300 px-2" /></label><button onClick={() => setAttendanceMarked(true)} className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Mark all present (demo)</button>{attendanceMarked && <span className="text-xs text-emerald-700">Attendance marked for {selectedDate} in this session.</span>}</div>
                <div className="divide-y divide-slate-100">{students.filter((student) => student.status === "Active").map((student) => <div key={student.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold">{student.name}</p><p className="text-xs text-slate-500">{student.programme} Â· {student.roll}</p></div><span className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{attendanceMarked ? "Present" : "Not marked"}</span></div>)}</div>
              </section>
            ) : active === "Notices" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Campus notice board" description="Create and view local draft announcements." />
                <form onSubmit={(event) => { event.preventDefault(); if (noticeText.trim()) { setNotices((current) => [{ title: noticeText.trim(), detail: "Created in this browser session.", tag: "Draft" }, ...current]); setNoticeText(""); } }} className="mb-5 flex flex-wrap gap-2"><input value={noticeText} onChange={(event) => setNoticeText(event.target.value)} placeholder="Write a notice title" className="h-10 min-w-55 flex-1 border border-slate-300 px-3 text-sm" /><button className="flex h-10 items-center gap-2 bg-blue-800 px-4 text-xs font-semibold text-white"><Plus size={14} />Add draft</button></form>
                <div className="space-y-3">{notices.map((notice) => <article key={notice.title} className="border border-slate-200 p-4"><div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{notice.title}</h3><span className="text-xs text-blue-700">{notice.tag}</span></div><p className="mt-1 text-xs text-slate-500">{notice.detail}</p></article>)}</div>
              </section>
            ) : (
              <section className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-800"><BriefcaseBusiness size={22} /></span><div><h2 className="text-lg font-bold text-slate-900">{active}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">This module is included in the college workspace navigation. Its complete workflow and live database integration will be connected to the EduNexa API in the next development phase.</p><p className="mt-3 text-xs text-amber-700">Showing sample workspace data only; not connected to live college records.</p></div></div>
              </section>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-4 text-[11px] text-slate-400"><span>BRX EduNexa Â· College management workspace</span><span>Sample data is shown until API integration is completed.</span></footer>
          </div>
        </main>
      </div>

      {showStudentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={addStudent} className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Add college student</h2><button type="button" onClick={() => setShowStudentForm(false)} aria-label="Close" className="p-1 text-slate-500 hover:bg-slate-100"><X size={19} /></button></div>
            <label className="mb-3 block text-xs font-semibold text-slate-600">Student name<input required value={studentName} onChange={(event) => setStudentName(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600" placeholder="Enter full name" /></label>
            <label className="mb-5 block text-xs font-semibold text-slate-600">Programme<select value={studentProgramme} onChange={(event) => setStudentProgramme(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal"><option>B.Sc. Computer Science</option><option>B.Com</option><option>B.A. English</option><option>B.Sc. Mathematics</option><option>BCA</option><option>BBA</option><option>B.A. Economics</option></select></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowStudentForm(false)} className="h-9 border border-slate-300 px-4 text-xs">Cancel</button><button type="submit" className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Save student</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

