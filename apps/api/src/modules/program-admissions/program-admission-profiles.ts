import {
  type DocSpec,
  type Field,
  type Profile,
} from '../students/admission-profiles';

/* =========================================================
   COACHING AND INSTITUTE ADMISSION FORMS
   Coaching: admission into a batch.
   Institute: admission into a short course.
========================================================= */

export type ProgramKind = 'COACHING' | 'INSTITUTE';

const text = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: 'text',
  ...extra,
});

const num = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: 'number',
  ...extra,
});

const select = (
  key: string,
  label: string,
  options: string[],
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'select', options, ...extra });

const yesno = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: 'yesno',
  ...extra,
});

const multi = (
  key: string,
  label: string,
  options: string[],
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'multi', options, ...extra });

const PHOTO: DocSpec = { type: 'PHOTO', label: 'Passport size photo', required: true };
const AADHAAR: DocSpec = {
  type: 'AADHAAR',
  label: 'Aadhaar card (or other photo ID)',
  required: true,
};

const SOURCES = [
  'Walk-in',
  'Friend / referral',
  'Social media',
  'Newspaper / hoarding',
  'Website',
  'Other',
];

export const PROGRAM_PROFILES: Profile[] = [
  {
    id: 'COACHING',
    title: 'Coaching Admission Form',
    classLabel: 'Batch',
    description:
      'For students joining a coaching batch: school, college and competitive exam preparation.',
    sections: [
      {
        id: 'personal',
        title: 'Personal Details',
        fields: [
          text('nationality', 'Nationality', { defaultValue: 'Indian', required: true }),
          select('category', 'Category', ['General', 'OBC', 'SC', 'ST', 'EWS']),
          text('bloodGroup', 'Blood group', { maxLength: 5 }),
        ],
      },
      {
        id: 'education',
        title: 'Present Education',
        fields: [
          select(
            'currentStage',
            'Studying in',
            [
              'Class 8',
              'Class 9',
              'Class 10',
              'Class 11',
              'Class 12',
              'Dropper / 12th pass',
              'Graduate',
              'Other',
            ],
            { required: true },
          ),
          text('schoolName', 'School / college name', { required: true }),
          select('board', 'Board / university', [
            'CBSE',
            'ICSE / ISC',
            'State Board',
            'NIOS',
            'University',
            'Other',
          ]),
          num('lastResult', 'Last exam percentage', { min: 0, max: 100 }),
          select('medium', 'Medium', ['English', 'Hindi', 'Other']),
        ],
      },
      {
        id: 'course',
        title: 'Coaching Details',
        fields: [
          select(
            'targetExam',
            'Preparing for',
            [
              'JEE',
              'NEET',
              'UPSC / Civil Services',
              'SSC',
              'Banking',
              'Board exams',
              'Foundation (Class 8 to 10)',
              'Other',
            ],
            { required: true },
          ),
          multi('subjects', 'Subjects needed', [
            'Physics',
            'Chemistry',
            'Mathematics',
            'Biology',
            'English',
            'Reasoning',
            'General Studies',
            'Other',
          ]),
          yesno('demoAttended', 'Attended a demo class?'),
          yesno('previousCoaching', 'Studied in another coaching before?'),
          text('previousCoachingName', 'Previous coaching name', {
            showIf: { key: 'previousCoaching', equals: 'Yes' },
          }),
          select('source', 'How did you know about us?', SOURCES),
        ],
      },
    ],
    documents: [
      PHOTO,
      AADHAAR,
      { type: 'MARKSHEET', label: 'Last marksheet / result', required: true },
      { type: 'SCHOOL_ID', label: 'School / college ID card', required: false },
      { type: 'PREVIOUS_RESULT', label: 'Previous coaching result', required: false },
    ],
    instructions: [
      'Fill the form in capital letters with a blue or black pen.',
      'Attach self-attested photocopies. Bring originals for verification.',
      'A seat is confirmed only after document verification and approval.',
    ],
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
  {
    id: 'INSTITUTE',
    title: 'Institute Course Admission Form',
    classLabel: 'Course',
    description:
      'For students joining a short course: computer, language, skill and vocational training.',
    sections: [
      {
        id: 'personal',
        title: 'Personal Details',
        fields: [
          text('nationality', 'Nationality', { defaultValue: 'Indian', required: true }),
          select('category', 'Category', ['General', 'OBC', 'SC', 'ST', 'EWS']),
        ],
      },
      {
        id: 'background',
        title: 'Qualification and Occupation',
        fields: [
          select(
            'highestQualification',
            'Highest qualification',
            ['Below 10th', '10th', '12th', 'Diploma / ITI', 'Graduate', 'Post graduate'],
            { required: true },
          ),
          text('qualificationDetail', 'Course / board / university and year'),
          select(
            'occupation',
            'Present occupation',
            ['Student', 'Working', 'Self employed', 'Homemaker', 'Other'],
            { required: true },
          ),
        ],
      },
      {
        id: 'course',
        title: 'Course Preferences',
        fields: [
          select('batchTiming', 'Preferred timing', ['Morning', 'Afternoon', 'Evening', 'Weekend'], {
            required: true,
          }),
          select('purpose', 'Why do you want this course?', [
            'Get a job',
            'Start a business',
            'Upgrade skills',
            'Hobby / personal interest',
            'Other',
          ]),
          yesno('priorKnowledge', 'Any earlier knowledge of this subject?'),
          text('priorKnowledgeDetail', 'Tell us briefly', {
            showIf: { key: 'priorKnowledge', equals: 'Yes' },
          }),
          select('source', 'How did you know about us?', SOURCES),
        ],
      },
    ],
    documents: [
      PHOTO,
      AADHAAR,
      {
        type: 'QUALIFICATION_CERTIFICATE',
        label: 'Last qualification certificate',
        required: false,
      },
    ],
    instructions: [
      'Fill the form in capital letters with a blue or black pen.',
      'Attach self-attested photocopies. Bring originals for verification.',
      'Admission is final only after document verification and approval.',
    ],
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
];

export function profileForKind(kind: string): Profile {
  return PROGRAM_PROFILES.find((p) => p.id === kind) || PROGRAM_PROFILES[0];
}

export const PROGRAM_DOCUMENT_TYPES: string[] = Array.from(
  new Set(PROGRAM_PROFILES.flatMap((p) => p.documents.map((d) => d.type))),
).concat('OTHER');

export function missingProgramDocuments(
  kind: string,
  uploadedTypes: string[],
): string[] {
  return profileForKind(kind)
    .documents.filter((doc) => doc.required && !uploadedTypes.includes(doc.type))
    .map((doc) => doc.label);
}
