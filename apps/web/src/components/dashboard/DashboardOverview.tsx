"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell, BookOpen, CalendarDays, ClipboardCheck, Clock3, Download, FileBarChart, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquare, Plus, Search, Settings, ShieldCheck, UserCheck, Users, Wallet, X, TrendingUp, CalendarCheck, BookMarked, Building2, Bus, Library, Megaphone, MoreHorizontal, RefreshCw, School, Send, 
} from "lucide-react";

type MenuItem = { label: string; icon: typeof LayoutDashboard };
type Student = { id: number; name: string; className: string; section: string; roll: string; status: "Active" | "Inactive" };
type Teacher = { id: number; name: string; subject: string; className: string; status: "Active" | "On leave" };

const schoolMenu: MenuItem[] = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Students", icon: GraduationCap },
  { label: "Teachers & Staff", icon: Users },
  { label: "Classes & Sections", icon: School },
  { label: "Attendance", icon: CalendarCheck },
  { label: "Timetable", icon: Clock3 },
  { label: "Examinations", icon: ClipboardCheck },
  { label: "Fees & Finance", icon: Wallet },
  { label: "Assignments", icon: BookOpen },
  { label: "Notices", icon: Megaphone },
  { label: "Library", icon: Library },
  { label: "Transport", icon: Bus },
  { label: "Reports", icon: FileBarChart },
  { label: "Messages", icon: MessageSquare },
  { label: "Settings", icon: Settings },
];

const otherMenus: Record<string, { label: string; items: string[] }> = {
  coaching: { label: "Coaching Dashboard", items: ["Overview", "Teachers", "Students", "Batches", "Subjects", "Attendance", "Fees", "Reports"] },
  college: { label: "College Dashboard", items: ["Overview", "Principal / Director", "Departments", "HODs", "Faculty", "Admissions", "Courses", "Examinations", "Attendance", "Fees", "Reports"] },
  university: { label: "University Dashboard", items: ["Overview", "Registrar", "Deans & Faculties", "Departments", "HODs", "Faculty", "Admissions", "Examination Office", "Student Records", "Results", "Finance", "Reports"] },
  institute: { label: "Institute Dashboard", items: ["Overview", "Head & Staff", "Trainers", "Programmes", "Learners", "Attendance", "Fees", "Reports"] },
  other: { label: "Organisation Dashboard", items: ["Overview", "Users", "Roles", "Services", "Reports", "Settings"] },
};

const initialStudents: Student[] = [
  { id: 1, name: "Aarav Kumar", className: "Class 10", section: "A", roll: "1001", status: "Active" },
  { id: 2, name: "Ananya Singh", className: "Class 9", section: "B", roll: "902", status: "Active" },
  { id: 3, name: "Vivaan Sharma", className: "Class 8", section: "A", roll: "801", status: "Active" },
  { id: 4, name: "Diya Kumari", className: "Class 10", section: "B", roll: "1008", status: "Inactive" },
  { id: 5, name: "Aditya Raj", className: "Class 7", section: "A", roll: "704", status: "Active" },
];

const initialTeachers: Teacher[] = [
  { id: 1, name: "Priya Sharma", subject: "Mathematics", className: "9–10", status: "Active" },
  { id: 2, name: "Rahul Verma", subject: "Science", className: "8–10", status: "Active" },
  { id: 3, name: "Neha Singh", subject: "English", className: "6–8", status: "On leave" },
  { id: 4, name: "Amit Kumar", subject: "Social Science", className: "9–10", status: "Active" },
];

const notices = [
  { title: "Parent-teacher meeting", detail: "Meeting for classes 8–10 · Friday, 10:00 AM", tag: "Event" },
  { title: "Monthly assessment schedule", detail: "Assessment timetable is ready to review.", tag: "Academic" },
  { title: "School will remain closed", detail: "Please check the academic calendar for details.", tag: "General" },
];

function StatCard({ title, value, note, icon: Icon, tint }: {
  title: string; value: string; note: string; icon: typeof Users; tint: string;
}) {
  return (
    <article className="border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p></div>
        <span className={`flex h-10 w-10 items-center justify-center ${tint}`}><Icon size={19} /></span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><TrendingUp size={13} />{note}</p>
    </article>
  );
}

function SectionTitle({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}

export default function DashboardOverview({ type }: { type: string }) {
  const isSchool = type === "school";
  const other = otherMenus[type] || otherMenus.other;
  const [active, setActive] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState(initialStudents);
  const [teachers] = useState(initialTeachers);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("Class 6");
  const [noticeText, setNoticeText] = useState("");
  const [noticesList, setNoticesList] = useState(notices);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-10-30");

  const filteredStudents = useMemo(() => students.filter((student) =>
    `${student.name} ${student.className} ${student.roll}`.toLowerCase().includes(query.toLowerCase())
  ), [students, query]);

  const menu = isSchool ? schoolMenu : other.items.map((label) => ({
    label,
    icon: label === "Overview" ? LayoutDashboard : Users,
  }));

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studentName.trim()) return;
    setStudents((current) => [...current, {
      id: Date.now(), name: studentName.trim(), className: studentClass,
      section: "A", roll: String(1000 + current.length + 1), status: "Active",
    }]);
    setStudentName("");
    setShowStudentForm(false);
    setActive("Students");
  }

  function exportStudents() {
    const rows = [["Name", "Class", "Section", "Roll", "Status"], ...students.map((s) => [s.name, s.className, s.section, s.roll, s.status])];
    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "school-students.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const schoolName = "My School";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-900 bg-[#193f88] text-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="inline-flex h-9 w-9 items-center justify-center hover:bg-white/10 lg:hidden" aria-label="Toggle menu"><Menu size={20} /></button>
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight"><span className="flex h-9 w-9 items-center justify-center bg-white text-blue-800"><Building2 size={21} /></span><span>BRX EduNexa</span></Link>
            <span className="hidden border-l border-white/30 pl-3 text-sm text-blue-100 sm:block">{isSchool ? "School Administration" : other.label}</span>
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
        <aside className={`${sidebarOpen ? "fixed inset-y-16 left-0 z-30 flex" : "hidden"} w-65 shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)]`}>
          <div className="border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800"><School size={21} /></span><div><p className="text-sm font-bold text-slate-900">{isSchool ? schoolName : other.label}</p><p className="text-xs text-slate-500">Administration panel</p></div></div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
            {menu.map(({ label, icon: Icon }) => (
              <button key={label} type="button" onClick={() => { setActive(label); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${active === label ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                <Icon size={17} /><span className="flex-1">{label}</span>{active === label && <span className="h-1.5 w-1.5 bg-blue-700" />}
              </button>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-2 bg-slate-50 p-3"><ShieldCheck size={18} className="text-emerald-600" /><div><p className="text-xs font-semibold text-slate-700">Secure workspace</p><p className="text-[10px] text-slate-500">Role-protected area</p></div></div></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-375">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-blue-800">BRX EduNexa <span className="px-1 text-slate-400">/</span> {active}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{active === "Overview" ? `${isSchool ? "School" : other.label.replace(" Dashboard", "")} Dashboard` : active}</h1><p className="mt-1 text-sm text-slate-500">Welcome back. Here is your institution workspace.</p></div>
              <div className="flex items-center gap-2"><button type="button" onClick={() => window.location.reload()} className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 text-xs font-medium hover:bg-slate-50"><RefreshCw size={14} />Refresh</button><button type="button" onClick={() => setShowStudentForm(true)} className="flex h-9 items-center gap-2 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900"><Plus size={15} />Add student</button></div>
            </div>

            {!isSchool ? (
              <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">This expanded management workspace is currently configured for the school dashboard. The existing {other.label.toLowerCase()} navigation is preserved.</div>
            ) : active === "Overview" ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard title="Total students" value={String(students.length)} note="Sample workspace data" icon={GraduationCap} tint="bg-blue-50 text-blue-700" />
                  <StatCard title="Teachers & staff" value={String(teachers.length)} note="Sample workspace data" icon={Users} tint="bg-violet-50 text-violet-700" />
                  <StatCard title="Attendance today" value={attendanceMarked ? "Marked" : "Pending"} note="Update daily attendance" icon={UserCheck} tint="bg-emerald-50 text-emerald-700" />
                  <StatCard title="Fee follow-ups" value="12" note="Illustrative placeholder" icon={Wallet} tint="bg-amber-50 text-amber-700" />
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                  <section className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Attendance overview</h2><p className="mt-1 text-xs text-slate-500">Illustrative weekly attendance, not live data</p></div><CalendarDays size={19} className="text-blue-700" /></div>
                    <div className="flex h-48 items-end justify-around gap-3 border-b border-slate-100 px-2">
                      {[["Mon",82],["Tue",91],["Wed",76],["Thu",88],["Fri",68],["Sat",45]].map(([day, height]) => <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-slate-500">{height}%</span><div className="w-full max-w-12 bg-blue-600" style={{ height: `${height}%` }} /><span className="pb-2 text-xs text-slate-500">{day}</span></div>)}
                    </div>
                  </section>
                  <section className="border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-slate-900">Quick actions</h2><MoreHorizontal size={18} className="text-slate-400" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      {[["Add student", GraduationCap, "Students"],["Mark attendance", CalendarCheck, "Attendance"],["Create notice", Megaphone, "Notices"],["View reports", FileBarChart, "Reports"],["Exam schedule", ClipboardCheck, "Examinations"],["Fee records", Wallet, "Fees & Finance"]].map(([label, Icon, target]) => {
                        const QuickIcon = Icon as typeof Users;
                        return <button key={label as string} type="button" onClick={() => { if (target === "Students") setShowStudentForm(true); else setActive(target as string); }} className="flex items-center gap-2 border border-slate-200 p-3 text-left text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50"><QuickIcon size={17} className="text-blue-700" />{label as string}</button>;
                      })}
                    </div>
                  </section>
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                  <section className="border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Recent students" description="Latest entries in this sample workspace" action={<button onClick={() => setActive("Students")} className="text-xs font-semibold text-blue-800">View all</button>} /><div className="divide-y divide-slate-100">{students.slice(0,4).map((s) => <div key={s.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center bg-blue-50 text-xs font-bold text-blue-800">{s.name.split(" ").map(x=>x[0]).join("").slice(0,2)}</span><div><p className="text-sm font-semibold text-slate-800">{s.name}</p><p className="text-xs text-slate-500">{s.className} · Section {s.section}</p></div></div><span className="text-xs text-slate-500">#{s.roll}</span></div>)}</div></section>
                  <section className="border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Notice board" description="Recent school announcements" action={<button onClick={() => setActive("Notices")} className="text-xs font-semibold text-blue-800">All notices</button>} /><div className="space-y-3">{noticesList.slice(0,3).map((n) => <div key={n.title} className="border-l-2 border-blue-600 bg-slate-50 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold text-slate-800">{n.title}</p><span className="text-[10px] text-blue-700">{n.tag}</span></div><p className="mt-1 text-xs text-slate-500">{n.detail}</p></div>)}</div></section>
                </div>
                <div className="mt-5 border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Today’s schedule" description="Example timetable preview" /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[["08:00","Morning assembly"],["09:00","Mathematics · Class 10"],["10:00","Science · Class 9"],["11:30","English · Class 8"]].map(([time, event]) => <div key={time} className="flex items-center gap-3 border border-slate-100 p-3"><span className="text-xs font-bold text-blue-800">{time}</span><span className="text-xs text-slate-700">{event}</span></div>)}</div></div>
              </>
            ) : active === "Students" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle title="Student directory" description={`${students.length} records in this browser session`} action={<div className="flex gap-2"><button onClick={exportStudents} className="flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs hover:bg-slate-50"><Download size={14} />Export CSV</button><button onClick={() => setShowStudentForm(true)} className="flex h-9 items-center gap-2 bg-blue-800 px-3 text-xs text-white"><Plus size={14} />Add student</button></div>} />
                <div className="mb-4 flex items-center gap-2 border border-slate-300 px-3"><Search size={16} className="text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, class or roll number" className="h-10 w-full text-sm outline-none" /></div>
                <div className="overflow-x-auto"><table className="w-full min-w-162.5 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Student","Class","Section","Roll no.","Status","Action"].map(x=><th key={x} className="px-3 py-3 font-semibold">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredStudents.map(s=><tr key={s.id}><td className="px-3 py-3 font-semibold text-slate-800">{s.name}</td><td className="px-3 py-3">{s.className}</td><td className="px-3 py-3">{s.section}</td><td className="px-3 py-3">{s.roll}</td><td className="px-3 py-3"><span className={`px-2 py-1 text-xs ${s.status==="Active"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{s.status}</span></td><td className="px-3 py-3"><button onClick={()=>setStudents(current=>current.map(x=>x.id===s.id?{...x,status:x.status==="Active"?"Inactive":"Active"}:x))} className="text-xs font-semibold text-blue-800">{s.status==="Active"?"Deactivate":"Activate"}</button></td></tr>)}</tbody></table>{filteredStudents.length===0&&<p className="py-8 text-center text-sm text-slate-500">No matching students found.</p>}</div>
              </section>
            ) : active === "Teachers & Staff" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Teachers & staff" description="Sample staff directory" /><div className="overflow-x-auto"><table className="w-full min-w-137.5 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Name","Subject","Classes","Status"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{teachers.map(t=><tr key={t.id}><td className="px-3 py-3 font-semibold">{t.name}</td><td className="px-3 py-3">{t.subject}</td><td className="px-3 py-3">{t.className}</td><td className="px-3 py-3">{t.status}</td></tr>)}</tbody></table></div></section>
            ) : active === "Attendance" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Daily attendance" description="Mark attendance for a selected date." /><div className="mb-4 flex flex-wrap items-center gap-3"><label className="text-xs font-medium">Date <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="ml-2 h-9 border border-slate-300 px-2" /></label><button onClick={()=>{setAttendanceMarked(true);}} className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Mark all present (demo)</button>{attendanceMarked&&<span className="text-xs text-emerald-700">Attendance marked in this session.</span>}</div><div className="divide-y divide-slate-100">{students.filter(s=>s.status==="Active").map(s=><div key={s.id} className="flex items-center justify-between py-3"><div><p className="text-sm font-semibold">{s.name}</p><p className="text-xs text-slate-500">{s.className} · {s.roll}</p></div><span className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">{attendanceMarked?"Present":"Not marked"}</span></div>)}</div></section>
            ) : active === "Notices" ? (
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><SectionTitle title="Notice board" description="Create and view local draft announcements." /><form onSubmit={e=>{e.preventDefault();if(noticeText.trim()){setNoticesList(current=>[{title:noticeText.trim(),detail:"Created in this browser session.",tag:"Draft"},...current]);setNoticeText("");}}} className="mb-5 flex flex-wrap gap-2"><input value={noticeText} onChange={e=>setNoticeText(e.target.value)} placeholder="Write a notice title" className="h-10 min-w-55 flex-1 border border-slate-300 px-3 text-sm" /><button className="flex h-10 items-center gap-2 bg-blue-800 px-4 text-xs font-semibold text-white"><Send size={14}/>Add draft</button></form><div className="space-y-3">{noticesList.map(n=><article key={n.title} className="border border-slate-200 p-4"><div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{n.title}</h3><span className="text-xs text-blue-700">{n.tag}</span></div><p className="mt-1 text-xs text-slate-500">{n.detail}</p></article>)}</div></section>
            ) : (
              <section className="border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-800"><BookMarked size={22}/></span><div><h2 className="text-lg font-bold text-slate-900">{active}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">This section is prepared in the dashboard navigation. Its full workflow and live database integration will be implemented against the EduNexa API and Prisma schema in the next development phase.</p><p className="mt-3 text-xs text-amber-700">Not connected to live school records yet.</p></div></div></section>
            )}

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-4 text-[11px] text-slate-400"><span>BRX EduNexa · School management workspace</span><span>Sample data is shown until API integration is completed.</span></footer>
          </div>
        </main>
      </div>

      {showStudentForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={addStudent} className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Add student</h2><button type="button" onClick={()=>setShowStudentForm(false)} aria-label="Close" className="p-1 text-slate-500 hover:bg-slate-100"><X size={19}/></button></div><label className="mb-3 block text-xs font-semibold text-slate-600">Student name<input required value={studentName} onChange={e=>setStudentName(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 text-sm font-normal outline-none focus:border-blue-600" placeholder="Enter full name"/></label><label className="mb-5 block text-xs font-semibold text-slate-600">Class<select value={studentClass} onChange={e=>setStudentClass(e.target.value)} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal">{Array.from({length:12},(_,i)=><option key={i}>Class {i+1}</option>)}</select></label><div className="flex justify-end gap-2"><button type="button" onClick={()=>setShowStudentForm(false)} className="h-9 border border-slate-300 px-4 text-xs">Cancel</button><button type="submit" className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Save student</button></div></form></div>}
    </div>
  );
}
