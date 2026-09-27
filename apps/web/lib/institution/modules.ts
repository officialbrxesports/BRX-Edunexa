export type InstitutionType =
  | "SCHOOL"
  | "PRIVATE_SCHOOL"
  | "COLLEGE"
  | "UNIVERSITY"
  | "COACHING"
  | "TUITION"
  | "INSTITUTE"
  | "OTHER";

export type ModuleKey =
  | "dashboard"
  | "students"
  | "teachers"
  | "staff"
  | "parents"
  | "classes"
  | "sections"
  | "subjects"
  | "courses"
  | "departments"
  | "programs"
  | "semesters"
  | "batches"
  | "attendance"
  | "fees"
  | "exams"
  | "results"
  | "homework"
  | "study-material"
  | "assignments"
  | "timetable"
  | "library"
  | "hostel"
  | "transport"
  | "certificates"
  | "research"
  | "thesis"
  | "notifications"
  | "reports"
  | "documents"
  | "settings";

export type ModuleDefinition = {
  key: ModuleKey;
  label: string;
  icon: string;
  description: string;
  path: string;
};

export const MODULES: Record<
  ModuleKey,
  ModuleDefinition
> = {
  dashboard: {
    key: "dashboard",
    label: "Dashboard",
    icon: "⌂",
    description: "Institution overview",
    path: "/dashboard",
  },

  students: {
    key: "students",
    label: "Students",
    icon: "👨‍🎓",
    description: "Manage students",
    path: "/students",
  },

  teachers: {
    key: "teachers",
    label: "Teachers",
    icon: "👨‍🏫",
    description: "Manage teachers",
    path: "/users",
  },

  staff: {
    key: "staff",
    label: "Staff",
    icon: "👥",
    description: "Manage institution staff",
    path: "/users",
  },

  parents: {
    key: "parents",
    label: "Parents",
    icon: "👨‍👩‍👧",
    description: "Manage parents",
    path: "/parents",
  },

  classes: {
    key: "classes",
    label: "Classes",
    icon: "🏫",
    description: "Manage classes",
    path: "/classes",
  },

  sections: {
    key: "sections",
    label: "Sections",
    icon: "▦",
    description: "Manage sections",
    path: "/classes",
  },

  subjects: {
    key: "subjects",
    label: "Subjects",
    icon: "📚",
    description: "Manage subjects",
    path: "/subjects",
  },

  courses: {
    key: "courses",
    label: "Courses",
    icon: "🎓",
    description: "Manage courses",
    path: "/courses",
  },

  departments: {
    key: "departments",
    label: "Departments",
    icon: "🏢",
    description: "Manage departments",
    path: "/departments",
  },

  programs: {
    key: "programs",
    label: "Programs",
    icon: "🎯",
    description: "Manage academic programs",
    path: "/programs",
  },

  semesters: {
    key: "semesters",
    label: "Semesters",
    icon: "📅",
    description: "Manage semesters",
    path: "/semesters",
  },

  batches: {
    key: "batches",
    label: "Batches",
    icon: "👥",
    description: "Manage batches",
    path: "/batches",
  },

  attendance: {
    key: "attendance",
    label: "Attendance",
    icon: "✓",
    description: "Track attendance",
    path: "/attendance",
  },

  fees: {
    key: "fees",
    label: "Fees",
    icon: "₹",
    description: "Manage fees and payments",
    path: "/fees",
  },

  exams: {
    key: "exams",
    label: "Exams",
    icon: "📝",
    description: "Manage exams and tests",
    path: "/exams",
  },

  results: {
    key: "results",
    label: "Results",
    icon: "📊",
    description: "Academic results",
    path: "/results",
  },

  homework: {
    key: "homework",
    label: "Homework",
    icon: "📖",
    description: "Manage homework",
    path: "/homework",
  },

  "study-material": {
    key: "study-material",
    label: "Study Material",
    icon: "📚",
    description: "Notes and learning material",
    path: "/study-material",
  },

  assignments: {
    key: "assignments",
    label: "Assignments",
    icon: "📋",
    description: "Manage assignments",
    path: "/assignments",
  },

  timetable: {
    key: "timetable",
    label: "Timetable",
    icon: "🗓️",
    description: "Manage schedules",
    path: "/timetable",
  },

  library: {
    key: "library",
    label: "Library",
    icon: "📚",
    description: "Manage library",
    path: "/library",
  },

  hostel: {
    key: "hostel",
    label: "Hostel",
    icon: "🏠",
    description: "Manage hostel",
    path: "/hostel",
  },

  transport: {
    key: "transport",
    label: "Transport",
    icon: "🚌",
    description: "Manage transport",
    path: "/transport",
  },

  certificates: {
    key: "certificates",
    label: "Certificates",
    icon: "📜",
    description: "Manage certificates",
    path: "/certificates",
  },

  research: {
    key: "research",
    label: "Research",
    icon: "🔬",
    description: "Research management",
    path: "/research",
  },

  thesis: {
    key: "thesis",
    label: "Thesis",
    icon: "📕",
    description: "Thesis management",
    path: "/thesis",
  },

  notifications: {
    key: "notifications",
    label: "Notifications",
    icon: "🔔",
    description: "Announcements and alerts",
    path: "/notifications",
  },

  reports: {
    key: "reports",
    label: "Reports",
    icon: "📈",
    description: "Reports and analytics",
    path: "/reports",
  },

  documents: {
    key: "documents",
    label: "Documents",
    icon: "📁",
    description: "Institution documents",
    path: "/documents",
  },

  settings: {
    key: "settings",
    label: "Settings",
    icon: "⚙️",
    description: "System settings",
    path: "/settings",
  },
};