export type FeatureDefinition = {
  key: string;
  label: string;
  description: string;
};

export const FEATURE_CATALOG: FeatureDefinition[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Institution dashboard' },
  { key: 'students', label: 'Students', description: 'Student management' },
  { key: 'teachers', label: 'Teachers', description: 'Teacher management' },
  { key: 'staff', label: 'Staff', description: 'Staff management' },
  { key: 'parents', label: 'Parents', description: 'Parent management' },
  { key: 'classes', label: 'Classes', description: 'Class management' },
  { key: 'sections', label: 'Sections', description: 'Section management' },
  { key: 'subjects', label: 'Subjects', description: 'Subject management' },
  { key: 'courses', label: 'Courses', description: 'Course management' },
  { key: 'departments', label: 'Departments', description: 'Department management' },
  { key: 'programs', label: 'Programs', description: 'Academic programs' },
  { key: 'semesters', label: 'Semesters', description: 'Semester management' },
  { key: 'batches', label: 'Batches', description: 'Batch management' },
  { key: 'attendance', label: 'Attendance', description: 'Attendance management' },
  { key: 'fees', label: 'Fees', description: 'Fees and payments' },
  { key: 'exams', label: 'Exams', description: 'Exams and tests' },
  { key: 'results', label: 'Results', description: 'Academic results' },
  { key: 'homework', label: 'Homework', description: 'Homework management' },
  { key: 'assignments', label: 'Assignments', description: 'Assignment management' },
  { key: 'study-material', label: 'Study Material', description: 'Learning material' },
  { key: 'timetable', label: 'Timetable', description: 'Schedule management' },
  { key: 'library', label: 'Library', description: 'Library management' },
  { key: 'hostel', label: 'Hostel', description: 'Hostel management' },
  { key: 'transport', label: 'Transport', description: 'Transport management' },
  { key: 'certificates', label: 'Certificates', description: 'Certificate management' },
  { key: 'documents', label: 'Documents', description: 'Document management' },
  { key: 'research', label: 'Research', description: 'Research management' },
  { key: 'thesis', label: 'Thesis', description: 'Thesis management' },
  { key: 'notifications', label: 'Notifications', description: 'Notifications and notices' },
  { key: 'reports', label: 'Reports', description: 'Reports and analytics' },
  { key: 'settings', label: 'Settings', description: 'System settings' },
];
