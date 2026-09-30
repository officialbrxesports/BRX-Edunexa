export const ROLE_FEATURE_MAP = {
  HEAD: [
    'dashboard','students','teachers','staff','parents',
    'classes','sections','subjects','courses','departments',
    'programs','semesters','batches','attendance','fees',
    'exams','results','homework','assignments','study-material',
    'timetable','library','hostel','transport','certificates',
    'documents','research','thesis','notifications','reports','settings',
  ],

  TEACHER: [
    'dashboard','students','classes','sections','subjects',
    'courses','batches','attendance','exams','results',
    'homework','assignments','study-material','timetable',
    'notifications','documents',
  ],

  STUDENT: [
    'dashboard','classes','sections','subjects','courses','batches',
    'attendance','fees','exams','results','homework','assignments',
    'study-material','timetable','notifications','certificates','documents',
  ],

  STAFF: [
    'dashboard','students','attendance','fees',
    'documents','notifications','reports',
  ],
} as const;

export type RoleKey = keyof typeof ROLE_FEATURE_MAP;
