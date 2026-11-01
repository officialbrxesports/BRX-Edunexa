"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Download,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
  Microscope,
  Globe2,
  Landmark,
  UserRoundCheck,
  Library,
  BriefcaseBusiness,
  Award,
} from "lucide-react";

type Campus = { id: number; name: string; city: string; schools: number; students: number; status: "Active" | "Review" };
type Research = { id: number; title: string; department: string; lead: string; status: "Ongoing" | "Completed" | "Proposed" };
type Student = { id: number; name: string; programme: string; faculty: string; roll: string; status: "Active" | "Inactive" };

const navigation = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Faculties & Schools", icon: Landmark },
  { label: "Departments", icon: Building2 },
  { label: "Campuses", icon: Globe2 },
  { label: "Faculty & Staff", icon: Users },
  { label: "Students & Scholars", icon: GraduationCap },
  { label: "Admissions", icon: UserRoundCheck },
  { label: "Programmes", icon: BookOpen },
  { label: "Research & Projects", icon: Microscope },
  { label: "Examinations", icon: ClipboardCheck },
  { label: "Academic Calendar", icon: CalendarDays },
  { label: "Finance & Grants", icon: Wallet },
  { label: "Library", icon: Library },
  { label: "Accreditation", icon: Award },
  { label: "Notices", icon: Megaphone },
  { label: "Reports", icon: FileBarChart },
  { label: "Settings", icon: Settings },
];

const initialCampuses: Campus[] = [
  { id: 1, name: "Main Campus", city: "Patna", schools: 8, students: 5200, status: "Active" },
  { id: 2, name: "North Campus", city: "Gaya", schools: 4, students: 2100, status: "Active" },
  { id: 3, name: "Research Centre", city: "Nalanda", schools: 2, students: 850, status: "Review" },
];

const initialResearch: Research[] = [
  { id: 1, title: "Applied AI in Learning Systems", department: "Computer Science", lead: "Dr. A. Kumar", status: "Ongoing" },
  { id: 2, title: "Sustainable Water Resource Study", department: "Environmental Studies", lead: "Dr. N. Singh", status: "Proposed" },
  { id: 3, title: "Regional Language Digital Archive", department: "Humanities", lead: "Prof. R. Das", status: "Completed" },
];

const initialStudents: Student[] = [
  { id: 1, name: "Aarav Kumar", programme: "Ph.D. Computer Science", faculty: "Engineering", roll: "PH24001", status: "Active" },
  { id: 2, name: "Ananya Singh", programme: "M.Sc. Mathematics", faculty: "Science", roll: "MS24018", status: "Active" },
  { id: 3, name: "Vivaan Sharma", programme: "M.A. English", faculty: "Humanities", roll: "MA23027", status: "Active" },
  { id: 4, name: "Diya Kumari", programme: "MBA", faculty: "Management", roll: "MB24012", status: "Inactive" },
];

const initialNotices = [
  { title: "Research proposal submission window", detail: "Departments may submit proposals for the upcoming review cycle.", category: "Research" },
  { title: "Academic council meeting", detail: "The academic council meeting is scheduled for the coming week.", category: "Administration" },
  { title: "Library database orientation", detail: "A session for research scholars and faculty members.", category: "Library" },
];

function Metric({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
  return <article className="border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div><span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800"><Icon size={19} /></span></div><p className="mt-3 flex items-center gap-1 text-xs text-slate-500"><Activity size={13} />{note}</p></article>;
}

function Heading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>{action}</div>;
}

export default function UniversityDashboardOverview() {
  const [active, setActive] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState(initialStudents);
  const [campuses] = useState(initialCampuses);
  const [research, setResearch] = useState(initialResearch);
  const [notices, setNotices] = useState(initialNotices);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [studentModal, setStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState("");
  const [newProgramme, setNewProgramme] = useState("Ph.D. Computer Science");
  const [researchModal, setResearchModal] = useState(false);
  const [researchTitle, setResearchTitle] = useState("");
  const [calendarDate, setCalendarDate] = useState("2026-11-02");
  const [attendanceDone, setAttendanceDone] = useState(false);

  const filteredStudents = useMemo(() => students.filter((student) =>
    `${student.name} ${student.programme} ${student.roll} ${student.faculty}`.toLowerCase().includes(search.toLowerCase())
  ), [students, search]);

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function addStudent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStudent.trim()) return;
    setStudents((current) => [...current, { id: Date.now(), name: newStudent.trim(), programme: newProgramme, faculty: "To be assigned", roll: `UNI${String(current.length + 1).padStart(3, "0")}`, status: "Active" }]);
    setNewStudent("");
    setStudentModal(false);
    setActive("Students & Scholars");
  }

  function exportStudents() {
    const rows = [["Name", "Programme", "Faculty", "Roll", "Status"], ...students.map((s) => [s.name, s.programme, s.faculty, s.roll, s.status])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "university-students-scholars.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-blue-950 bg-[#193f88] text-white shadow-sm">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center hover:bg-white/10 lg:hidden" aria-label="Toggle menu"><Menu size={20} /></button>
            <Link href="/" className="flex items-center gap-2 font-bold"><span className="flex h-9 w-9 items-center justify-center bg-white text-blue-800"><Landmark size={21} /></span>BRX EduNexa</Link>
            <span className="hidden border-l border-white/30 pl-3 text-sm text-blue-100 sm:block">University Administration</span>
          </div>
          <div className="flex items-center gap-2"><span className="hidden text-xs text-blue-100 md:block">{today}</span><button type="button" title="Notices" onClick={() => setActive("Notices")} className="relative flex h-9 w-9 items-center justify-center hover:bg-white/10"><Bell size={19} /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-amber-300" /></button><Link href="/login" title="Logout" className="flex h-9 w-9 items-center justify-center hover:bg-white/10"><LogOut size={18} /></Link></div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden" />}
        <aside className={`${mobileOpen ? "fixed inset-y-16 left-0 z-30 flex" : "hidden"} w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-64px)]`}>
          <div className="border-b border-slate-100 px-5 py-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-blue-50 text-blue-800"><Landmark size={21} /></span><div><p className="text-sm font-bold text-slate-900">My University</p><p className="text-xs text-slate-500">Central administration</p></div></div></div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>{navigation.map(({ label, icon: Icon }) => <button key={label} type="button" onClick={() => { setActive(label); setMobileOpen(false); }} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${active === label ? "bg-blue-50 font-semibold text-blue-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={17} /><span>{label}</span></button>)}</nav>
          <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15} className="text-emerald-600" />Institution-wide secure workspace</div></div>
        </aside>

        <main className="min-w-0 flex-1"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">University workspace</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{active}</h1><p className="mt-1 text-sm text-slate-500">Coordinate faculties, campuses, research and academic governance.</p></div><span className="border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><CalendarDays size={14} className="mr-2 inline" />Academic year 2026–27</span></div>

          {active === "Overview" ? <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total learners" value="8,150" note="Across university programmes" icon={GraduationCap} />
              <Metric label="Faculty & staff" value="412" note="Academic and administration" icon={Users} />
              <Metric label="Faculties & schools" value="14" note="Academic units" icon={Landmark} />
              <Metric label="Research projects" value="68" note="Illustrative sample figure" icon={Microscope} />
            </div>
            <div className="mt-6 grid gap-5 xl:grid-cols-3">
              <section className="border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2"><Heading title="University operations" description="Quick access to institution-wide workflows." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{navigation.slice(1, 13).map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className="flex items-center gap-3 border border-slate-200 p-3 text-left hover:border-blue-300 hover:bg-blue-50/40"><span className="flex h-9 w-9 items-center justify-center bg-blue-50 text-blue-800"><Icon size={18} /></span><span className="text-sm font-semibold text-slate-700">{label}</span></button>)}</div></section>
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Institution snapshot" description="Illustrative university summary" /><div className="space-y-4">{[["Campuses", "3"], ["Academic programmes", "74"], ["Research scholars", "620"], ["Library resources", "85,000"]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0"><span className="text-sm text-slate-600">{label}</span><strong className="text-sm text-slate-900">{value}</strong></div>)}</div></section>
            </div>
            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Campus overview" description="Campus-wise academic footprint" action={<button onClick={() => setActive("Campuses")} className="text-xs font-semibold text-blue-800">View campuses</button>} /><div className="divide-y divide-slate-100">{campuses.map((campus) => <div key={campus.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{campus.name}</p><p className="text-xs text-slate-500">{campus.city} · {campus.schools} schools</p></div><div className="text-right text-xs text-slate-500"><p>{campus.students.toLocaleString("en-IN")} learners</p><p>{campus.status}</p></div></div>)}</div></section>
              <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Research highlights" description="Selected institutional projects" action={<button onClick={() => setActive("Research & Projects")} className="text-xs font-semibold text-blue-800">View projects</button>} /><div className="space-y-3">{research.map((item) => <div key={item.id} className="border-l-2 border-blue-600 bg-slate-50 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-semibold">{item.title}</p><span className="text-[10px] text-blue-700">{item.status}</span></div><p className="mt-1 text-xs text-slate-500">{item.department} · {item.lead}</p></div>)}</div></section>
            </div>
            <section className="mt-5 border border-slate-200 bg-white p-5 shadow-sm"><Heading title="University calendar preview" description="Illustrative upcoming academic events" /><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[["02 Nov", "Research committee review"], ["05 Nov", "Academic council"], ["09 Nov", "Ph.D. progress seminar"], ["12 Nov", "Inter-campus faculty meet"]].map(([date, event]) => <div key={date} className="flex items-center gap-3 border border-slate-100 p-3"><span className="text-xs font-bold text-blue-800">{date}</span><span className="text-xs text-slate-700">{event}</span></div>)}</div></section>
          </> : active === "Campuses" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Campus directory" description="University locations and academic footprint" /><div className="overflow-x-auto"><table className="w-full min-w-155 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Campus", "City", "Schools / Centres", "Learners", "Status"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{campuses.map((c) => <tr key={c.id}><td className="px-3 py-3 font-semibold">{c.name}</td><td className="px-3 py-3">{c.city}</td><td className="px-3 py-3">{c.schools}</td><td className="px-3 py-3">{c.students.toLocaleString("en-IN")}</td><td className="px-3 py-3">{c.status}</td></tr>)}</tbody></table></div></section>
          : active === "Students & Scholars" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Students & research scholars" description={`${students.length} sample records in this browser session`} action={<div className="flex gap-2"><button onClick={exportStudents} className="flex h-9 items-center gap-2 border border-slate-300 px-3 text-xs"><Download size={14} />Export CSV</button><button onClick={() => setStudentModal(true)} className="flex h-9 items-center gap-2 bg-blue-800 px-3 text-xs text-white"><Plus size={14} />Add learner</button></div>} /><div className="mb-4 flex items-center gap-2 border border-slate-300 px-3"><Search size={16} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, programme, faculty or roll" className="h-10 w-full text-sm outline-none" /></div><div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Name", "Programme", "Faculty", "Roll number", "Status", "Action"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredStudents.map((s) => <tr key={s.id}><td className="px-3 py-3 font-semibold">{s.name}</td><td className="px-3 py-3">{s.programme}</td><td className="px-3 py-3">{s.faculty}</td><td className="px-3 py-3">{s.roll}</td><td className="px-3 py-3">{s.status}</td><td className="px-3 py-3"><button onClick={() => setStudents((current) => current.map((item) => item.id === s.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } : item))} className="text-xs font-semibold text-blue-800">{s.status === "Active" ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No matching records.</p>}</div></section>
          : active === "Research & Projects" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Research & projects" description="Track institutional research activity" action={<button onClick={() => setResearchModal(true)} className="flex h-9 items-center gap-2 bg-blue-800 px-3 text-xs text-white"><Plus size={14} />Add project</button>} /><div className="overflow-x-auto"><table className="w-full min-w-155 text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Project", "Department", "Principal investigator", "Status"].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{research.map((r) => <tr key={r.id}><td className="px-3 py-3 font-semibold">{r.title}</td><td className="px-3 py-3">{r.department}</td><td className="px-3 py-3">{r.lead}</td><td className="px-3 py-3">{r.status}</td></tr>)}</tbody></table></div></section>
          : active === "Notices" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="University notices" description="Create local draft announcements." /><form onSubmit={(event) => { event.preventDefault(); if (noticeTitle.trim()) { setNotices((items) => [{ title: noticeTitle.trim(), detail: "Created in this browser session.", category: "Draft" }, ...items]); setNoticeTitle(""); } }} className="mb-5 flex flex-wrap gap-2"><input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} placeholder="Write notice title" className="h-10 min-w-55 flex-1 border border-slate-300 px-3 text-sm" /><button className="flex h-10 items-center gap-2 bg-blue-800 px-4 text-xs font-semibold text-white"><Plus size={14} />Add draft</button></form><div className="space-y-3">{notices.map((n, i) => <article key={`${n.title}-${i}`} className="border border-slate-200 p-4"><div className="flex justify-between gap-2"><h3 className="text-sm font-semibold">{n.title}</h3><span className="text-xs text-blue-700">{n.category}</span></div><p className="mt-1 text-xs text-slate-500">{n.detail}</p></article>)}</div></section>
          : active === "Academic Calendar" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Academic calendar" description="Choose a date for a local calendar planning preview." /><label className="flex flex-wrap items-center gap-3 text-sm">Selected date <input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} className="h-10 border border-slate-300 px-3" /></label><div className="mt-4 border-l-2 border-blue-600 bg-slate-50 p-4"><p className="text-sm font-semibold">Calendar planning entry</p><p className="mt-1 text-xs text-slate-500">Selected date: {calendarDate}. Live event creation will be connected to the API later.</p></div></section>
          : active === "Examinations" ? <section className="border border-slate-200 bg-white p-5 shadow-sm"><Heading title="Examination operations" description="Sample examination workflow controls." /><div className="mb-4 flex flex-wrap items-center gap-3"><label className="text-xs">Examination date <input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} className="ml-2 h-9 border border-slate-300 px-2" /></label><button onClick={() => setAttendanceDone(true)} className="h-9 bg-blue-800 px-4 text-xs text-white">Confirm schedule (demo)</button></div>{attendanceDone && <p className="text-xs text-emerald-700">Demo schedule confirmed for {calendarDate} in this session.</p>}<div className="mt-4 divide-y divide-slate-100">{["Undergraduate semester examinations", "Postgraduate practical examinations", "Research scholar viva schedule"].map((item) => <div key={item} className="py-3 text-sm">{item}</div>)}</div></section>
          : <section className="border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center bg-blue-50 text-blue-800"><BriefcaseBusiness size={22} /></span><div><h2 className="text-lg font-bold text-slate-900">{active}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">This module is included in the university workspace navigation. Its full workflow and live database integration will be connected to the EduNexa API in the next development phase.</p><p className="mt-3 text-xs text-amber-700">Showing sample workspace data only; not connected to live university records.</p></div></div></section>}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 py-4 text-[11px] text-slate-400"><span>BRX EduNexa · University management workspace</span><span>Sample data until live API integration is completed.</span></footer>
        </div></main>
      </div>

      {studentModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={addStudent} className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Add learner / scholar</h2><button type="button" onClick={() => setStudentModal(false)} aria-label="Close" className="p-1 text-slate-500"><X size={19} /></button></div><label className="mb-3 block text-xs font-semibold text-slate-600">Full name<input required value={newStudent} onChange={(event) => setNewStudent(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 text-sm font-normal" placeholder="Enter full name" /></label><label className="mb-5 block text-xs font-semibold text-slate-600">Programme<select value={newProgramme} onChange={(event) => setNewProgramme(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 bg-white px-3 text-sm font-normal"><option>Ph.D. Computer Science</option><option>M.Sc. Mathematics</option><option>M.A. English</option><option>MBA</option><option>MCA</option><option>M.Com</option></select></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setStudentModal(false)} className="h-9 border border-slate-300 px-4 text-xs">Cancel</button><button type="submit" className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Save learner</button></div></form></div>}

      {researchModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><form onSubmit={(event) => { event.preventDefault(); if (researchTitle.trim()) { setResearch((items) => [...items, { id: Date.now(), title: researchTitle.trim(), department: "To be assigned", lead: "To be assigned", status: "Proposed" }]); setResearchTitle(""); setResearchModal(false); } }} className="w-full max-w-md border border-slate-200 bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Add research project</h2><button type="button" onClick={() => setResearchModal(false)} aria-label="Close" className="p-1 text-slate-500"><X size={19} /></button></div><label className="mb-5 block text-xs font-semibold text-slate-600">Project title<input required value={researchTitle} onChange={(event) => setResearchTitle(event.target.value)} className="mt-1 h-10 w-full border border-slate-300 px-3 text-sm font-normal" placeholder="Enter project title" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setResearchModal(false)} className="h-9 border border-slate-300 px-4 text-xs">Cancel</button><button type="submit" className="h-9 bg-blue-800 px-4 text-xs font-semibold text-white">Save project</button></div></form></div>}
    </div>
  );
}
