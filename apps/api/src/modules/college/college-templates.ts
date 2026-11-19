/* =========================================================
   Ready-made college structure.
   These are common Indian degree programs with typical
   semester-wise subjects. Universities change their syllabus,
   so the Head can edit or delete anything after loading.
========================================================= */

export type CollegeTemplate = {
  id: string;
  level: 'UG' | 'PG';
  faculty: { name: string; code: string };
  department: { name: string; code: string };
  program: { name: string; code: string };
  /** Subject titles for each semester, in order. */
  semesters: string[][];
};

const ENV = 'Environmental Studies';

export const COLLEGE_TEMPLATES: CollegeTemplate[] = [
  {
    id: 'BA',
    level: 'UG',
    faculty: { name: 'Faculty of Arts', code: 'ARTS' },
    department: { name: 'Arts and Humanities', code: 'HUM' },
    program: { name: 'Bachelor of Arts (B.A.)', code: 'BA' },
    semesters: [
      ['Hindi Language', 'English Language', 'Political Science I', 'History I', 'Sociology I'],
      ['Hindi Literature', 'English Literature', 'Political Science II', 'History II', ENV],
      ['Indian Political Thought', 'Medieval Indian History', 'Economics I', 'Sociology II', 'Geography I'],
      ['Western Political Thought', 'Modern Indian History', 'Economics II', 'Social Research Methods', 'Geography II'],
      ['International Relations', 'World History', 'Public Administration', 'Rural Sociology', 'Elective I'],
      ['Indian Constitution', 'Contemporary India', 'Human Rights', 'Elective II', 'Project Work'],
    ],
  },
  {
    id: 'BSC',
    level: 'UG',
    faculty: { name: 'Faculty of Science', code: 'SCI' },
    department: { name: 'Science', code: 'SCI' },
    program: { name: 'Bachelor of Science (B.Sc.)', code: 'BSC' },
    semesters: [
      ['Physics I', 'Chemistry I', 'Mathematics I', 'English Communication', 'Physics Practical I'],
      ['Physics II', 'Chemistry II', 'Mathematics II', ENV, 'Chemistry Practical I'],
      ['Mechanics and Waves', 'Organic Chemistry', 'Calculus', 'Computer Fundamentals', 'Physics Practical II'],
      ['Thermal Physics', 'Inorganic Chemistry', 'Differential Equations', 'Statistics', 'Chemistry Practical II'],
      ['Electromagnetism', 'Physical Chemistry', 'Linear Algebra', 'Research Methodology', 'Laboratory Practical III'],
      ['Modern Physics', 'Applied Chemistry', 'Numerical Methods', 'Elective', 'Project Work'],
    ],
  },
  {
    id: 'BCOM',
    level: 'UG',
    faculty: { name: 'Faculty of Commerce', code: 'COMM' },
    department: { name: 'Commerce', code: 'COM' },
    program: { name: 'Bachelor of Commerce (B.Com.)', code: 'BCOM' },
    semesters: [
      ['Financial Accounting', 'Business Organisation', 'Business Economics', 'English Communication', 'Business Mathematics'],
      ['Corporate Accounting', 'Business Law', 'Macro Economics', ENV, 'Business Statistics'],
      ['Cost Accounting', 'Company Law', 'Banking and Insurance', 'Marketing Management', 'Computer Applications in Business'],
      ['Management Accounting', 'Income Tax Law', 'Human Resource Management', 'Entrepreneurship', 'Business Communication'],
      ['Auditing', 'Goods and Services Tax (GST)', 'Financial Management', 'International Business', 'Elective I'],
      ['Financial Markets', 'E-Commerce', 'Consumer Protection', 'Elective II', 'Project Work'],
    ],
  },
  {
    id: 'BBA',
    level: 'UG',
    faculty: { name: 'Faculty of Management', code: 'MGMT' },
    department: { name: 'Management Studies', code: 'MGT' },
    program: { name: 'Bachelor of Business Administration (BBA)', code: 'BBA' },
    semesters: [
      ['Principles of Management', 'Business Economics', 'Financial Accounting', 'Business Communication', 'Computer Applications'],
      ['Organisational Behaviour', 'Business Statistics', 'Cost Accounting', 'Business Law', ENV],
      ['Marketing Management', 'Human Resource Management', 'Financial Management', 'Operations Management', 'Business Research Methods'],
      ['Consumer Behaviour', 'Management Accounting', 'Entrepreneurship Development', 'Management Information Systems', 'Banking and Insurance'],
      ['Strategic Management', 'International Business', 'Digital Marketing', 'Elective I', 'Summer Internship'],
      ['Business Ethics', 'Supply Chain Management', 'Project Management', 'Elective II', 'Project Work'],
    ],
  },
  {
    id: 'BCA',
    level: 'UG',
    faculty: { name: 'Faculty of Computer Applications', code: 'COMP' },
    department: { name: 'Computer Applications', code: 'CA' },
    program: { name: 'Bachelor of Computer Applications (BCA)', code: 'BCA' },
    semesters: [
      ['Programming in C', 'Computer Fundamentals', 'Mathematics I', 'English Communication', 'C Programming Lab'],
      ['Data Structures', 'Digital Electronics', 'Mathematics II', ENV, 'Data Structures Lab'],
      ['Object Oriented Programming (C++)', 'Database Management Systems', 'Operating Systems', 'Statistics', 'DBMS Lab'],
      ['Java Programming', 'Computer Networks', 'Software Engineering', 'Web Technologies', 'Java Lab'],
      ['Python Programming', 'Computer Graphics', 'Data Mining', 'Elective I', 'Web Development Lab'],
      ['Artificial Intelligence', 'Cyber Security', 'Cloud Computing', 'Elective II', 'Major Project'],
    ],
  },
  {
    id: 'BTECH-CSE',
    level: 'UG',
    faculty: { name: 'Faculty of Engineering and Technology', code: 'ENGG' },
    department: { name: 'Computer Science and Engineering', code: 'CSE' },
    program: { name: 'Bachelor of Technology in Computer Science (B.Tech CSE)', code: 'BTECH-CSE' },
    semesters: [
      ['Engineering Mathematics I', 'Engineering Physics', 'Programming for Problem Solving', 'Basic Electrical Engineering', 'Engineering Graphics'],
      ['Engineering Mathematics II', 'Engineering Chemistry', 'English for Engineers', 'Workshop Practice', 'Programming Lab'],
      ['Data Structures', 'Discrete Mathematics', 'Digital Logic Design', 'Computer Organisation', 'Data Structures Lab'],
      ['Design and Analysis of Algorithms', 'Operating Systems', 'Database Management Systems', 'Object Oriented Programming', 'DBMS Lab'],
      ['Computer Networks', 'Theory of Computation', 'Software Engineering', 'Microprocessors', 'Networks Lab'],
      ['Compiler Design', 'Artificial Intelligence', 'Web Technologies', 'Elective I', 'Mini Project'],
      ['Machine Learning', 'Cloud Computing', 'Information Security', 'Elective II', 'Industrial Training'],
      ['Big Data Analytics', 'Professional Ethics', 'Elective III', 'Seminar', 'Major Project'],
    ],
  },
  {
    id: 'MA',
    level: 'PG',
    faculty: { name: 'Faculty of Arts', code: 'ARTS' },
    department: { name: 'Arts and Humanities', code: 'HUM' },
    program: { name: 'Master of Arts (M.A.)', code: 'MA' },
    semesters: [
      ['Core Paper I', 'Core Paper II', 'Research Methodology', 'Elective I'],
      ['Core Paper III', 'Core Paper IV', 'Contemporary Issues', 'Elective II'],
      ['Advanced Paper I', 'Advanced Paper II', 'Elective III', 'Seminar'],
      ['Advanced Paper III', 'Advanced Paper IV', 'Elective IV', 'Dissertation'],
    ],
  },
  {
    id: 'MSC',
    level: 'PG',
    faculty: { name: 'Faculty of Science', code: 'SCI' },
    department: { name: 'Science', code: 'SCI' },
    program: { name: 'Master of Science (M.Sc.)', code: 'MSC' },
    semesters: [
      ['Core Paper I', 'Core Paper II', 'Research Methodology', 'Practical I'],
      ['Core Paper III', 'Core Paper IV', 'Instrumentation Techniques', 'Practical II'],
      ['Advanced Paper I', 'Advanced Paper II', 'Elective I', 'Practical III'],
      ['Advanced Paper III', 'Elective II', 'Seminar', 'Dissertation'],
    ],
  },
  {
    id: 'MCOM',
    level: 'PG',
    faculty: { name: 'Faculty of Commerce', code: 'COMM' },
    department: { name: 'Commerce', code: 'COM' },
    program: { name: 'Master of Commerce (M.Com.)', code: 'MCOM' },
    semesters: [
      ['Advanced Financial Accounting', 'Managerial Economics', 'Organisational Behaviour', 'Research Methodology'],
      ['Corporate Tax Planning', 'Financial Management', 'Marketing Management', 'Statistical Analysis'],
      ['Security Analysis and Portfolio Management', 'International Business', 'Elective I', 'Seminar'],
      ['Strategic Management', 'Business Ethics', 'Elective II', 'Dissertation'],
    ],
  },
  {
    id: 'MBA',
    level: 'PG',
    faculty: { name: 'Faculty of Management', code: 'MGMT' },
    department: { name: 'Management Studies', code: 'MGT' },
    program: { name: 'Master of Business Administration (MBA)', code: 'MBA' },
    semesters: [
      ['Management Principles', 'Managerial Economics', 'Financial Accounting', 'Organisational Behaviour', 'Business Statistics'],
      ['Marketing Management', 'Financial Management', 'Human Resource Management', 'Operations Management', 'Business Research Methods'],
      ['Strategic Management', 'Business Analytics', 'Specialisation I', 'Specialisation II', 'Summer Internship'],
      ['Corporate Governance', 'Entrepreneurship', 'Specialisation III', 'Specialisation IV', 'Final Project'],
    ],
  },
  {
    id: 'MCA',
    level: 'PG',
    faculty: { name: 'Faculty of Computer Applications', code: 'COMP' },
    department: { name: 'Computer Applications', code: 'CA' },
    program: { name: 'Master of Computer Applications (MCA)', code: 'MCA' },
    semesters: [
      ['Advanced Data Structures', 'Advanced Database Systems', 'Computer Networks', 'Discrete Mathematics', 'Programming Lab'],
      ['Design and Analysis of Algorithms', 'Software Engineering', 'Operating Systems', 'Web Technologies', 'Web Lab'],
      ['Machine Learning', 'Cloud Computing', 'Information Security', 'Elective I', 'Mini Project'],
      ['Big Data Analytics', 'Elective II', 'Research Methodology', 'Seminar', 'Major Project'],
    ],
  },
];

/** Credits: practical, lab, project and similar work counts less. */
export function creditsFor(title: string): number {
  return /lab|practical|project|seminar|dissertation|internship|training|workshop|graphics/i.test(
    title,
  )
    ? 2
    : 4;
}

export function courseCode(programCode: string, semester: number, index: number) {
  return `${programCode}-S${semester}-${String(index + 1).padStart(2, '0')}`.slice(0, 30);
}
