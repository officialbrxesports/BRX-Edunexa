import {
  PROFILES as SCHOOL_PROFILES,
  type DocSpec,
  type Field,
  type Profile,
  type Section,
} from '../students/admission-profiles';

/* =========================================================
   COLLEGE / UNIVERSITY ADMISSION FORMS
   Three forms: UG (after Class 12), PG (after graduation) and
   Diploma / Lateral entry. The web app loads these from
   GET /public/apply/:code (colleges) and /college/admissions.
========================================================= */

const text = (
  key: string,
  label: string,
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'text', ...extra });

const num = (
  key: string,
  label: string,
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'number', ...extra });

const select = (
  key: string,
  label: string,
  options: string[],
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'select', options, ...extra });

const yesno = (
  key: string,
  label: string,
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'yesno', ...extra });

const BOARDS = ['CBSE', 'ICSE / ISC', 'State Board', 'NIOS', 'Other'];

const ENTRANCE_NONE = 'None (merit based)';

const personal: Section = {
  id: 'personal',
  title: 'Personal Details',
  fields: [
    text('nationality', 'Nationality', { defaultValue: 'Indian', required: true }),
    text('motherTongue', 'Mother tongue'),
    text('apaarId', 'APAAR / ABC ID (if available)', {
      pattern: '^[0-9]{11,12}$',
      patternHint: 'APAAR ID must be 11 or 12 digits.',
      maxLength: 12,
    }),
    select(
      'familyIncome',
      'Annual family income',
      [
        'Below 1 lakh',
        '1 to 2.5 lakh',
        '2.5 to 5 lakh',
        '5 to 8 lakh',
        'Above 8 lakh',
      ],
      { required: true },
    ),
    yesno('hasDisability', 'Person with disability (PwD)?', { required: true }),
    text('disabilityType', 'Type of disability', {
      showIf: { key: 'hasDisability', equals: 'Yes' },
      required: true,
    }),
    num('disabilityPercent', 'Disability percentage', {
      min: 40,
      max: 100,
      patternHint: 'Disability percentage must be 40 or more.',
      showIf: { key: 'hasDisability', equals: 'Yes' },
      required: true,
    }),
    yesno('needsHostel', 'Hostel needed?', { required: true }),
    yesno('needsScholarship', 'Applying for a scholarship?'),
  ],
};

const choices: Section = {
  id: 'choices',
  title: 'Other Program Choices (optional)',
  fields: [
    text('choice2', 'Second choice program'),
    text('choice3', 'Third choice program'),
  ],
};

const entrance = (examOptions: string[]): Section => ({
  id: 'entrance',
  title: 'Entrance Exam',
  fields: [
    select('entranceExam', 'Entrance exam', [...examOptions, ENTRANCE_NONE], {
      required: true,
    }),
    text('entranceRoll', 'Entrance roll number', {
      showIf: { key: 'entranceExam', notEquals: ENTRANCE_NONE },
    }),
    num('entranceScore', 'Score / percentile', {
      min: 0,
      showIf: { key: 'entranceExam', notEquals: ENTRANCE_NONE },
    }),
    num('entranceRank', 'Rank (if any)', {
      min: 1,
      showIf: { key: 'entranceExam', notEquals: ENTRANCE_NONE },
    }),
  ],
});

const PHOTO: DocSpec = {
  type: 'STUDENT_PHOTO',
  label: 'Passport size photo',
  required: true,
};
const SIGN: DocSpec = {
  type: 'SIGNATURE',
  label: 'Applicant signature',
  required: true,
};
const AADHAAR: DocSpec = {
  type: 'IDENTITY_DOCUMENT',
  label: 'Aadhaar / photo ID',
  required: true,
};
const TC: DocSpec = {
  type: 'TRANSFER_CERTIFICATE',
  label: 'Transfer / leaving certificate',
  required: true,
};
const MIGRATION: DocSpec = {
  type: 'MIGRATION_CERTIFICATE',
  label: 'Migration certificate',
  required: false,
  note: 'Needed when the previous board or university is different.',
};
const TENTH: DocSpec = {
  type: 'TENTH_MARKSHEET',
  label: 'Class 10 marksheet',
  required: true,
};
const CASTE: DocSpec = {
  type: 'CASTE_CERTIFICATE',
  label: 'Caste certificate',
  required: false,
};
const PWD: DocSpec = {
  type: 'PWD_CERTIFICATE',
  label: 'Disability certificate',
  required: false,
};
const INCOME: DocSpec = {
  type: 'INCOME_CERTIFICATE',
  label: 'Income certificate',
  required: false,
};
const SCORECARD: DocSpec = {
  type: 'ENTRANCE_SCORECARD',
  label: 'Entrance exam scorecard',
  required: false,
};
const CHARACTER: DocSpec = {
  type: 'CHARACTER_CERTIFICATE',
  label: 'Character certificate',
  required: false,
};

const INSTRUCTIONS = [
  'Fill the form in capital letters with a blue or black pen.',
  'Name and date of birth must match your Class 10 certificate.',
  'Attach self-attested photocopies. Bring originals for verification.',
  'Admission is final only after document verification and fee payment.',
];

export const COLLEGE_PROFILES: Profile[] = [
  {
    id: 'COLLEGE_UG',
    title: 'Undergraduate (UG) Admission Form',
    classLabel: 'UG: B.A., B.Sc., B.Com., B.Tech., BBA, BCA and similar',
    description: 'For students who have passed or are appearing in Class 12.',
    sections: [
      personal,
      {
        id: 'class12',
        title: 'Class 12 Record',
        fields: [
          select('board12', 'Board / council', BOARDS, { required: true }),
          text('school12', 'School name', { required: true }),
          text('roll12', 'Roll number', { required: true }),
          num('year12', 'Year of passing', { required: true, min: 2000, max: 2035 }),
          select(
            'stream12',
            'Stream',
            [
              'Science (PCM)',
              'Science (PCB)',
              'Science (PCMB)',
              'Commerce',
              'Arts / Humanities',
              'Vocational',
            ],
            { required: true },
          ),
          select('result12', 'Result status', ['Pass', 'Result awaited'], {
            required: true,
          }),
          text('subjects12', 'Subject names in the order of marks below', {
            showIf: { key: 'result12', equals: 'Pass' },
            maxLength: 200,
          }),
        ],
        marks: {
          title: 'Class 12 marks',
          subjects: [
            'English',
            'Main subject 1',
            'Main subject 2',
            'Main subject 3',
            'Main subject 4',
          ],
          maxMarks: 100,
          skipIf: { key: 'result12', equals: 'Result awaited' },
        },
      },
      entrance(['CUET (UG)', 'JEE Main', 'NEET', 'State CET', 'University entrance']),
      choices,
    ],
    documents: [
      PHOTO,
      SIGN,
      TENTH,
      {
        type: 'MARKSHEET',
        label: 'Class 12 marksheet',
        required: true,
        note: 'Not needed while the result is awaited.',
      },
      TC,
      MIGRATION,
      AADHAAR,
      SCORECARD,
      CASTE,
      PWD,
      INCOME,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
  {
    id: 'COLLEGE_PG',
    title: 'Postgraduate (PG) Admission Form',
    classLabel: 'PG: M.A., M.Sc., M.Com., M.Tech., MBA, MCA and similar',
    description: 'For students who have completed or are in the final year of graduation.',
    sections: [
      personal,
      {
        id: 'graduation',
        title: 'Graduation Record',
        fields: [
          text('degree', 'Degree (for example B.Sc., B.A.)', { required: true }),
          text('specialization', 'Main subject / specialization', { required: true }),
          text('university', 'University', { required: true }),
          text('collegeName', 'College name', { required: true }),
          num('gradYear', 'Year of passing', { required: true, min: 1990, max: 2035 }),
          select('gradResult', 'Result status', ['Pass', 'Final year appearing'], {
            required: true,
          }),
          select('scoreType', 'Score type', ['Percentage', 'CGPA'], {
            required: true,
            showIf: { key: 'gradResult', equals: 'Pass' },
          }),
          num('gradScore', 'Percentage / CGPA', {
            required: true,
            min: 0,
            max: 100,
            showIf: { key: 'gradResult', equals: 'Pass' },
          }),
          yesno('backlog', 'Any backlog or compartment?', {
            required: true,
            showIf: { key: 'gradResult', equals: 'Pass' },
          }),
        ],
      },
      {
        id: 'earlier',
        title: 'Class 10 and Class 12',
        fields: [
          num('percent10', 'Class 10 percentage', { required: true, min: 0, max: 100 }),
          num('percent12', 'Class 12 percentage', { required: true, min: 0, max: 100 }),
        ],
      },
      entrance(['CUET (PG)', 'GATE', 'CAT / MAT', 'University entrance']),
      {
        id: 'work',
        title: 'Work Experience (if any)',
        fields: [
          yesno('hasExperience', 'Work experience?'),
          text('organisation', 'Organisation', {
            showIf: { key: 'hasExperience', equals: 'Yes' },
          }),
          num('experienceYears', 'Years of experience', {
            min: 0,
            max: 50,
            showIf: { key: 'hasExperience', equals: 'Yes' },
          }),
        ],
      },
      choices,
    ],
    documents: [
      PHOTO,
      SIGN,
      TENTH,
      { type: 'MARKSHEET', label: 'Class 12 marksheet', required: true },
      {
        type: 'GRADUATION_MARKSHEET',
        label: 'Graduation marksheets (all semesters / years)',
        required: true,
      },
      {
        type: 'DEGREE_CERTIFICATE',
        label: 'Degree or provisional certificate',
        required: false,
        note: 'Not needed if the final year is running.',
      },
      TC,
      MIGRATION,
      AADHAAR,
      SCORECARD,
      CHARACTER,
      CASTE,
      PWD,
      INCOME,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
  {
    id: 'COLLEGE_DIPLOMA',
    title: 'Diploma / Lateral Entry Admission Form',
    classLabel: 'Diploma after Class 10 or 12, and lateral entry after Diploma',
    description: 'For Diploma programs and direct second-year (lateral) entry.',
    sections: [
      personal,
      {
        id: 'previous',
        title: 'Previous Qualification',
        fields: [
          select(
            'qualification',
            'Last qualification passed',
            ['Class 10', 'Class 12', 'Diploma'],
            { required: true },
          ),
          text('board', 'Board / council / university', { required: true }),
          text('institutionName', 'School or institute name', { required: true }),
          text('rollNo', 'Roll number', { required: true }),
          num('passYear', 'Year of passing', { required: true, min: 2000, max: 2035 }),
          num('percent', 'Percentage', { required: true, min: 0, max: 100 }),
          select('prevResult', 'Result status', ['Pass', 'Result awaited'], {
            required: true,
          }),
          text('trade', 'Branch / trade studied (for Class 12 or Diploma)', {
            showIf: { key: 'qualification', notEquals: 'Class 10' },
          }),
        ],
      },
      entrance(['State polytechnic entrance (JEECUP / POLYCET)', 'JEXPO', 'Other']),
      choices,
    ],
    documents: [
      PHOTO,
      SIGN,
      TENTH,
      {
        type: 'MARKSHEET',
        label: 'Last qualification marksheet',
        required: true,
        note: 'Not needed while the result is awaited.',
      },
      TC,
      MIGRATION,
      AADHAAR,
      SCORECARD,
      CASTE,
      PWD,
      INCOME,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
];

/* Class 9 to 12 forms for colleges that also run school classes
   (junior wing). They reuse the school forms. */
const CLASS_IDS = ['CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12'];

COLLEGE_PROFILES.push(
  ...SCHOOL_PROFILES.filter((p) => CLASS_IDS.includes(p.id)).map(
    (p): Profile => ({
      ...p,
      id: `COLLEGE_${p.id}`,
      requiresPreviousSchool: false,
    }),
  ),
);

export function getCollegeProfile(id: string | null | undefined): Profile {
  return (
    COLLEGE_PROFILES.find((profile) => profile.id === id) ||
    COLLEGE_PROFILES[0]
  );
}

export const COLLEGE_DOCUMENT_TYPES: string[] = Array.from(
  new Set(COLLEGE_PROFILES.flatMap((p) => p.documents.map((d) => d.type))),
).concat('OTHER');

export function missingCollegeDocuments(
  profileId: string,
  uploadedTypes: string[],
  details?: unknown,
): string[] {
  const profile = getCollegeProfile(profileId);

  const d = (
    details && typeof details === 'object' ? details : {}
  ) as Record<string, unknown>;

  const awaited =
    d.result12 === 'Result awaited' ||
    d.prevResult === 'Result awaited' ||
    d.result9 === 'Result awaited' ||
    d.result10 === 'Result awaited' ||
    d.result11 === 'Result awaited' ||
    d.gradResult === 'Final year appearing';

  return profile.documents
    .filter(
      (doc) =>
        doc.required &&
        !uploadedTypes.includes(doc.type) &&
        !(
          awaited &&
          (doc.type === 'MARKSHEET' ||
            doc.type === 'GRADUATION_MARKSHEET' ||
            doc.type === 'BOARD_CERTIFICATE')
        ),
    )
    .map((doc) => doc.label);
}
