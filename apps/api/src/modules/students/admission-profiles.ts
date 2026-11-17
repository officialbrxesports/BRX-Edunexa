import { BadRequestException } from '@nestjs/common';

/* =========================================================
   CLASS-WISE ADMISSION FORM PROFILES
   One source of truth. The web app loads these from
   GET /students/admissions/form-profiles and renders the
   form, the blank printout and the document checklist.
========================================================= */

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'yesno'
  | 'textarea'
  | 'multi';

export type ShowIf = {
  key: string;
  equals?: string;
  notEquals?: string;
};

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  pattern?: string;
  patternHint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  upper?: boolean;
  pick?: number;
  defaultValue?: string;
  hint?: string;
  showIf?: ShowIf;
};

export type MarksTable = {
  title: string;
  subjects: string[];
  maxMarks: number;
  skipIf?: ShowIf;
};

export type Section = {
  id: string;
  title: string;
  fields: Field[];
  marks?: MarksTable;
};

export type DocSpec = {
  type: string;
  label: string;
  required: boolean;
  note?: string;
};

export type Profile = {
  id: string;
  title: string;
  classLabel: string;
  description: string;
  sections: Section[];
  documents: DocSpec[];
  instructions: string[];
  requiresPreviousSchool: boolean;
  requiresDeclarationName: boolean;
};

/* ---------- small builders ---------- */

const text = (
  key: string,
  label: string,
  extra: Partial<Field> = {},
): Field => ({ key, label, type: 'text', ...extra });

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

const RESULTS = [
  'Pass',
  'Promoted',
  'Compartment / Supplementary',
  'Result awaited',
];

const BOARDS = [
  'CBSE',
  'CISCE (ICSE / ISC)',
  'State Board',
  'NIOS',
  'Other',
];

const INCOME = [
  'Below Rs 1 lakh',
  'Rs 1 - 2.5 lakh',
  'Rs 2.5 - 5 lakh',
  'Rs 5 - 10 lakh',
  'Above Rs 10 lakh',
];

const YEAR = {
  pattern: '^(19|20)\\d{2}$',
  patternHint: 'Enter a 4 digit year, for example 2025.',
};

/* ---------- shared sections ---------- */

const personalExtra = (opts: {
  marksRequired: boolean;
  apaarRequired: boolean;
}): Section => ({
  id: 'personal',
  title: 'Additional Student Details',
  fields: [
    text('nameHindi', 'Student name in Hindi', {
      maxLength: 100,
    }),
    text('nationality', 'Nationality', {
      defaultValue: 'Indian',
      required: true,
    }),
    text('apaarId', 'APAAR / PEN number', {
      required: opts.apaarRequired,
      pattern: '^\\d{11,12}$',
      patternHint: 'APAAR / PEN must be 11 or 12 digits.',
    }),
    text('identificationMark1', 'Identification mark 1', {
      required: opts.marksRequired,
      maxLength: 120,
    }),
    text('identificationMark2', 'Identification mark 2', {
      required: opts.marksRequired,
      maxLength: 120,
    }),
    yesno('hasDisability', 'Person with disability (PwD)?'),
    select(
      'disabilityType',
      'Type of disability',
      [
        'Visual',
        'Hearing',
        'Locomotor',
        'Intellectual',
        'Multiple',
        'Other',
      ],
      {
        required: true,
        showIf: { key: 'hasDisability', equals: 'Yes' },
      },
    ),
    {
      key: 'disabilityPercent',
      label: 'Disability percentage (minimum 40)',
      type: 'number',
      required: true,
      min: 40,
      max: 100,
      showIf: { key: 'hasDisability', equals: 'Yes' },
    },
    yesno('hasSibling', 'Brother / sister already in this school?'),
    text('siblingName', 'Sibling name', {
      required: true,
      showIf: { key: 'hasSibling', equals: 'Yes' },
    }),
    text('siblingClass', 'Sibling class', {
      required: true,
      showIf: { key: 'hasSibling', equals: 'Yes' },
    }),
    select('familyIncome', 'Annual family income', INCOME),
    yesno('needsTransport', 'School transport required?'),
  ],
});

const permanentAddress: Section = {
  id: 'permanent',
  title: 'Permanent Address',
  fields: [
    yesno('sameAsPresent', 'Same as present address?', {
      required: true,
    }),
    {
      key: 'permAddress',
      label: 'Village / street / post office',
      type: 'textarea',
      required: true,
      maxLength: 300,
      showIf: { key: 'sameAsPresent', equals: 'No' },
    },
    text('permDistrict', 'District', {
      required: true,
      showIf: { key: 'sameAsPresent', equals: 'No' },
    }),
    text('permState', 'State', {
      required: true,
      showIf: { key: 'sameAsPresent', equals: 'No' },
    }),
    text('permPin', 'PIN code', {
      required: true,
      pattern: '^\\d{6}$',
      patternHint: 'PIN code must be 6 digits.',
      showIf: { key: 'sameAsPresent', equals: 'No' },
    }),
  ],
};

const bankSection: Section = {
  id: 'bank',
  title: 'Bank Details (for scholarship / DBT, optional)',
  fields: [
    text('bankHolder', 'Account holder name'),
    text('bankName', 'Bank name'),
    text('bankIfsc', 'IFSC code', {
      upper: true,
      pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
      patternHint: 'IFSC must look like SBIN0001234.',
    }),
    text('bankAccountLast4', 'Account number (last 4 digits only)', {
      pattern: '^\\d{4}$',
      patternHint: 'Enter exactly 4 digits.',
      hint: 'Full account numbers are never stored.',
    }),
  ],
};

const emergencySection: Section = {
  id: 'emergency',
  title: 'Emergency & Health',
  fields: [
    text('emergencyName', 'Emergency contact name', {
      required: true,
    }),
    text('emergencyPhone', 'Emergency contact phone', {
      required: true,
      pattern: '^[0-9+\\-\\s()]{7,20}$',
      patternHint: 'Enter a valid phone number.',
    }),
    text('allergies', 'Allergies (if any)'),
    {
      key: 'medicalConditions',
      label: 'Medical conditions (if any)',
      type: 'textarea',
      maxLength: 300,
    },
  ],
};

const subjectPick = (): Field[] => [
  select('stream', 'Stream', ['Science', 'Commerce', 'Arts'], {
    required: true,
  }),
  select('sciGroup', 'Science group', ['PCM', 'PCB', 'PCMB'], {
    required: true,
    hint: 'Physics 042, Chemistry 043, Mathematics 041, Biology 044.',
    showIf: { key: 'stream', equals: 'Science' },
  }),
  select(
    'comGroup',
    'Commerce subjects',
    [
      'Accountancy + Business Studies + Economics',
      'Accountancy + Business Studies + Mathematics',
      'Accountancy + Economics + Mathematics',
    ],
    {
      required: true,
      hint: 'Accountancy 055, Business Studies 054, Economics 030.',
      showIf: { key: 'stream', equals: 'Commerce' },
    },
  ),
  {
    key: 'artsSubjects',
    label: 'Arts subjects (choose 3)',
    type: 'multi',
    required: true,
    pick: 3,
    options: [
      'History (027)',
      'Political Science (028)',
      'Geography (029)',
      'Economics (030)',
      'Sociology (039)',
      'Psychology (037)',
      'Hindi Elective (002)',
      'Home Science (064)',
    ],
    showIf: { key: 'stream', equals: 'Arts' },
  },
  select(
    'secondLanguage',
    'Second language (English Core 301 is compulsory)',
    ['Hindi Core (302)', 'Sanskrit (322)', 'Urdu Core (303)', 'Other'],
    { required: true },
  ),
  select('additionalSubject', 'Additional (6th) subject', [
    'None',
    'Computer Science (083)',
    'Informatics Practices (065)',
    'Physical Education (048)',
    'Painting (049)',
  ]),
];

const boardReference = (label: string): Field[] => [
  select('board10', `${label} board`, BOARDS, { required: true }),
  text('rollCode10', `${label} roll code`),
  text('rollNo10', `${label} roll number`, { required: true }),
  text('year10', `${label} passing year`, { required: true, ...YEAR }),
  select('result10', `${label} result`, RESULTS, { required: true }),
];

const SUBJECTS_SIX = [
  'English',
  'Hindi',
  'Mathematics',
  'Science',
  'Social Science',
  'Other / Optional',
];

/* ---------- documents ---------- */

const PHOTO: DocSpec = {
  type: 'STUDENT_PHOTO',
  label: 'Passport size photo',
  required: true,
};
const SIGN: DocSpec = {
  type: 'SIGNATURE',
  label: 'Student signature',
  required: true,
};
const AADHAAR: DocSpec = {
  type: 'IDENTITY_DOCUMENT',
  label: 'Aadhaar card (or other photo ID)',
  required: true,
};
const CASTE: DocSpec = {
  type: 'CASTE_CERTIFICATE',
  label: 'Caste certificate (SC / ST / OBC / EBC)',
  required: false,
  note: 'Only if a category benefit is claimed.',
};
const PWD: DocSpec = {
  type: 'PWD_CERTIFICATE',
  label: 'Disability certificate',
  required: false,
  note: 'Only for PwD students.',
};

/* ---------- the profiles ---------- */

export const PROFILES: Profile[] = [
  {
    id: 'NURSERY_8',
    title: 'Nursery to Class 8 Admission Form',
    classLabel: 'Nursery, LKG, UKG and Class 1 to 8',
    description:
      'Basic admission form. Previous school details are needed from Class 1 onwards.',
    sections: [
      personalExtra({ marksRequired: false, apaarRequired: false }),
      permanentAddress,
      emergencySection,
    ],
    documents: [
      PHOTO,
      {
        type: 'BIRTH_CERTIFICATE',
        label: 'Birth certificate',
        required: true,
      },
      AADHAAR,
      {
        type: 'TRANSFER_CERTIFICATE',
        label: 'Transfer certificate (Class 2 onwards)',
        required: false,
      },
      {
        type: 'MARKSHEET',
        label: 'Last class report card',
        required: false,
      },
      CASTE,
    ],
    instructions: [
      'Fill the form in capital letters with a blue or black pen.',
      'Student name must match the birth certificate.',
      'Attach photocopies. Bring originals for verification.',
    ],
    requiresPreviousSchool: true,
    requiresDeclarationName: false,
  },
  {
    id: 'CLASS_9',
    title: 'Class 9 Admission Form',
    classLabel: 'Class 9',
    description:
      'Needs Class 8 result, language and skill subject choice.',
    sections: [
      personalExtra({ marksRequired: false, apaarRequired: false }),
      permanentAddress,
      {
        id: 'class8',
        title: 'Class 8 Record',
        fields: [
          select('prevResult', 'Class 8 result', RESULTS, {
            required: true,
          }),
          text('prevRollNo', 'Class 8 roll number', {
            required: true,
          }),
          text('prevYear', 'Class 8 passing year', {
            required: true,
            ...YEAR,
          }),
          {
            key: 'marksMax',
            label: 'Total maximum marks',
            type: 'number',
            required: true,
            min: 1,
            max: 2000,
            showIf: { key: 'prevResult', notEquals: 'Result awaited' },
          },
          {
            key: 'marksObtained',
            label: 'Total marks obtained',
            type: 'number',
            required: true,
            min: 0,
            max: 2000,
            showIf: { key: 'prevResult', notEquals: 'Result awaited' },
          },
        ],
      },
      {
        id: 'subjects',
        title: 'Subjects',
        fields: [
          select('medium', 'Medium of instruction', ['Hindi', 'English'], {
            required: true,
          }),
          select(
            'secondLanguage',
            'Second language',
            ['Hindi', 'Sanskrit', 'Urdu', 'Other'],
            { required: true },
          ),
          select('skillSubject', 'Skill subject (optional)', [
            'None',
            'Information Technology',
            'Retail',
            'Security',
            'Automotive',
            'Healthcare',
            'Tourism',
          ]),
        ],
      },
      bankSection,
    ],
    documents: [
      PHOTO,
      {
        type: 'MARKSHEET',
        label: 'Class 8 marksheet',
        required: true,
      },
      AADHAAR,
      {
        type: 'TRANSFER_CERTIFICATE',
        label: 'Transfer certificate',
        required: false,
      },
      {
        type: 'BIRTH_CERTIFICATE',
        label: 'Birth certificate',
        required: false,
      },
      CASTE,
      PWD,
    ],
    instructions: [
      'Fill the form in capital letters.',
      'Class 8 marksheet is compulsory unless the result is awaited.',
      'Attach photocopies. Bring originals for verification.',
    ],
    requiresPreviousSchool: true,
    requiresDeclarationName: true,
  },
  {
    id: 'CLASS_10',
    title: 'Class 10 Board Registration Form',
    classLabel: 'Class 10',
    description:
      'Board registration. Needs Class 9 registration, marks and identification marks.',
    sections: [
      personalExtra({ marksRequired: true, apaarRequired: true }),
      permanentAddress,
      {
        id: 'class9',
        title: 'Class 9 Record',
        fields: [
          text('reg9No', 'Class 9 registration number', {
            required: true,
          }),
          text('reg9Year', 'Registration year', {
            required: true,
            ...YEAR,
          }),
          text('udise', 'School UDISE code (11 digits)', {
            pattern: '^\\d{11}$',
            patternHint: 'UDISE code must be 11 digits.',
          }),
          text('rollCode9', 'Class 9 school / roll code'),
          text('rollNo9', 'Class 9 roll number', { required: true }),
          select('result9', 'Class 9 result', RESULTS, {
            required: true,
          }),
        ],
        marks: {
          title: 'Class 9 marks',
          subjects: SUBJECTS_SIX,
          maxMarks: 100,
          skipIf: { key: 'result9', equals: 'Result awaited' },
        },
      },
      {
        id: 'subjects',
        title: 'Subjects',
        fields: [
          select('medium', 'Medium of examination', ['Hindi', 'English'], {
            required: true,
          }),
          select(
            'secondLanguage',
            'Second language',
            ['Hindi', 'Sanskrit', 'Urdu', 'Other'],
            { required: true },
          ),
        ],
      },
      bankSection,
    ],
    documents: [
      PHOTO,
      SIGN,
      {
        type: 'REGISTRATION_CARD',
        label: 'Class 9 registration card',
        required: true,
      },
      {
        type: 'MARKSHEET',
        label: 'Class 9 marksheet',
        required: true,
      },
      AADHAAR,
      CASTE,
      {
        type: 'BANK_PASSBOOK',
        label: 'Bank passbook first page',
        required: false,
      },
      PWD,
    ],
    instructions: [
      'Name, father name and mother name must match the Class 9 registration.',
      'Use capital letters. Do not overwrite.',
      'Attach photo and signature. Bring originals for verification.',
    ],
    requiresPreviousSchool: true,
    requiresDeclarationName: true,
  },
  {
    id: 'CLASS_11',
    title: 'Class 11 Admission Form',
    classLabel: 'Class 11',
    description:
      'Needs Class 10 board record, marks and stream with subjects.',
    sections: [
      personalExtra({ marksRequired: false, apaarRequired: false }),
      permanentAddress,
      {
        id: 'class10',
        title: 'Class 10 Board Record',
        fields: boardReference('Class 10'),
        marks: {
          title: 'Class 10 marks',
          subjects: SUBJECTS_SIX,
          maxMarks: 100,
          skipIf: { key: 'result10', equals: 'Result awaited' },
        },
      },
      {
        id: 'stream',
        title: 'Stream & Subjects',
        fields: subjectPick(),
      },
      bankSection,
    ],
    documents: [
      PHOTO,
      SIGN,
      {
        type: 'MARKSHEET',
        label: 'Class 10 marksheet',
        required: true,
      },
      {
        type: 'TRANSFER_CERTIFICATE',
        label: 'Transfer / school leaving certificate',
        required: true,
      },
      AADHAAR,
      {
        type: 'MIGRATION_CERTIFICATE',
        label: 'Migration certificate (other board)',
        required: false,
      },
      CASTE,
      {
        type: 'INCOME_CERTIFICATE',
        label: 'Income certificate',
        required: false,
        note: 'Only for scholarship.',
      },
      PWD,
    ],
    instructions: [
      'Stream and subjects chosen here cannot be changed after the board registration.',
      'Class 10 marksheet is compulsory unless the result is awaited.',
      'Attach photocopies. Bring originals for verification.',
    ],
    requiresPreviousSchool: true,
    requiresDeclarationName: true,
  },
  {
    id: 'CLASS_12',
    title: 'Class 12 Board Registration Form',
    classLabel: 'Class 12',
    description:
      'Needs Class 11 record, minimum 75% attendance and Class 10 reference.',
    sections: [
      personalExtra({ marksRequired: false, apaarRequired: false }),
      permanentAddress,
      {
        id: 'class11',
        title: 'Class 11 Record',
        fields: [
          text('reg11No', 'Class 11 registration number', {
            required: true,
          }),
          text('rollNo11', 'Class 11 roll number', { required: true }),
          text('year11', 'Class 11 passing year', {
            required: true,
            ...YEAR,
          }),
          select('result11', 'Class 11 result', RESULTS, {
            required: true,
          }),
          {
            key: 'attendancePercent',
            label: 'Class 11 attendance % (minimum 75)',
            type: 'number',
            required: true,
            min: 75,
            max: 100,
            patternHint:
              'Minimum 75% attendance is required for the board form.',
          },
        ],
        marks: {
          title: 'Class 11 marks',
          subjects: SUBJECTS_SIX,
          maxMarks: 100,
          skipIf: { key: 'result11', equals: 'Result awaited' },
        },
      },
      {
        id: 'class10ref',
        title: 'Class 10 Reference',
        fields: boardReference('Class 10'),
      },
      {
        id: 'stream',
        title: 'Stream & Subjects',
        fields: subjectPick(),
      },
      bankSection,
    ],
    documents: [
      PHOTO,
      SIGN,
      {
        type: 'REGISTRATION_CARD',
        label: 'Class 11 registration card',
        required: true,
      },
      {
        type: 'MARKSHEET',
        label: 'Class 11 marksheet',
        required: true,
      },
      {
        type: 'BOARD_CERTIFICATE',
        label: 'Class 10 certificate / marksheet',
        required: true,
      },
      AADHAAR,
      CASTE,
      PWD,
    ],
    instructions: [
      'Minimum 75% attendance in Class 11 is compulsory for the board form.',
      'Subjects must match the Class 11 registration.',
      'Attach photo and signature. Bring originals for verification.',
    ],
    requiresPreviousSchool: true,
    requiresDeclarationName: true,
  },
  {
    id: 'GENERAL',
    title: 'General Admission Form',
    classLabel: 'Other classes',
    description: 'Used when the class does not match a school class.',
    sections: [
      personalExtra({ marksRequired: false, apaarRequired: false }),
      permanentAddress,
    ],
    documents: [
      PHOTO,
      {
        type: 'BIRTH_CERTIFICATE',
        label: 'Birth certificate',
        required: false,
      },
      {
        type: 'IDENTITY_DOCUMENT',
        label: 'Identity document',
        required: false,
      },
      {
        type: 'TRANSFER_CERTIFICATE',
        label: 'Transfer certificate',
        required: false,
      },
      {
        type: 'MARKSHEET',
        label: 'Last marksheet',
        required: false,
      },
    ],
    instructions: [
      'Fill the form in capital letters.',
      'Attach photocopies. Bring originals for verification.',
    ],
    requiresPreviousSchool: false,
    requiresDeclarationName: false,
  },
];

/* =========================================================
   CLASS NAME -> PROFILE
========================================================= */

const ROMAN: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
};

export function classLevelFromName(name: string): number | null {
  const value = (name || '').toLowerCase().trim();

  if (!value) return null;

  if (
    /\b(year|sem|semester|b\.?tech|b\.?sc|b\.?a|b\.?com|bba|bca|mba|mca|m\.?tech|diploma|batch|course)\b/.test(
      value,
    )
  ) {
    return null;
  }

  if (
    /(pre[-\s]?nursery|nursery|play\s?group|\blkg\b|\bukg\b|\bkg\b|kindergarten)/.test(
      value,
    )
  ) {
    return 0;
  }

  const digits = value.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);

  if (digits) {
    const level = Number(digits[1]);
    return level >= 1 && level <= 12 ? level : null;
  }

  const roman = value.match(
    /\b(xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/,
  );

  return roman ? ROMAN[roman[1]] : null;
}

export function profileIdForClassName(name: string): string {
  const level = classLevelFromName(name);

  if (level === null) return 'GENERAL';
  if (level <= 8) return 'NURSERY_8';

  return `CLASS_${level}`;
}

export function getProfile(id?: string | null): Profile {
  return (
    PROFILES.find((profile) => profile.id === id) ||
    PROFILES[PROFILES.length - 1]
  );
}

/* =========================================================
   VALIDATION
========================================================= */

function isVisible(
  field: { showIf?: ShowIf },
  values: Record<string, unknown>,
): boolean {
  const rule = field.showIf;

  if (!rule) return true;

  const current = String(values[rule.key] ?? '');

  if (rule.equals !== undefined) return current === rule.equals;
  if (rule.notEquals !== undefined) return current !== rule.notEquals;

  return true;
}

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return '';
  }

  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);
}

export type CleanDetails = {
  details: Record<string, unknown>;
  apaarId: string | null;
};

export function validateDetails(
  profile: Profile,
  raw: unknown,
): CleanDetails {
  const input: Record<string, unknown> =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const errors: string[] = [];
  const out: Record<string, unknown> = {};

  // First pass: copy text-like values so showIf rules can read them.
  const flat: Record<string, unknown> = {};

  for (const section of profile.sections) {
    for (const field of section.fields) {
      const value = input[field.key];

      flat[field.key] =
        field.type === 'multi'
          ? Array.isArray(value)
            ? value.map((item) => clean(item, 80)).filter(Boolean)
            : []
          : clean(value, field.maxLength ?? 200);
    }
  }

  for (const section of profile.sections) {
    for (const field of section.fields) {
      if (!isVisible(field, flat)) continue;

      let value = flat[field.key];

      if (field.type === 'multi') {
        const picked = (value as string[]).filter((item) =>
          field.options?.includes(item),
        );

        if (field.required && field.pick && picked.length !== field.pick) {
          errors.push(`${field.label}: choose exactly ${field.pick}.`);
        } else if (field.required && picked.length === 0) {
          errors.push(`${field.label} is required.`);
        }

        out[field.key] = picked;
        continue;
      }

      let str = value as string;

      if (field.upper) str = str.toUpperCase();

      if (!str) {
        if (field.required) errors.push(`${field.label} is required.`);
        continue;
      }

      if (field.type === 'select' || field.type === 'yesno') {
        const allowed =
          field.type === 'yesno' ? ['Yes', 'No'] : field.options || [];

        if (!allowed.includes(str)) {
          errors.push(`${field.label}: choose a listed option.`);
          continue;
        }
      }

      if (field.type === 'number') {
        const num = Number(str);

        if (!Number.isFinite(num)) {
          errors.push(`${field.label} must be a number.`);
          continue;
        }

        if (field.min !== undefined && num < field.min) {
          errors.push(
            field.patternHint ||
              `${field.label} must be at least ${field.min}.`,
          );
          continue;
        }

        if (field.max !== undefined && num > field.max) {
          errors.push(`${field.label} must be at most ${field.max}.`);
          continue;
        }

        value = num;
      } else if (field.type === 'date') {
        if (Number.isNaN(new Date(str).getTime())) {
          errors.push(`${field.label} is not a valid date.`);
          continue;
        }

        value = str;
      } else {
        if (field.pattern && !new RegExp(field.pattern).test(str)) {
          errors.push(field.patternHint || `${field.label} is not valid.`);
          continue;
        }

        value = str;
      }

      out[field.key] = value;
    }

    // Marks table
    if (section.marks) {
      // skipIf: when its rule matches, the marks table is not needed.
      const skipped = section.marks.skipIf
        ? isVisible({ showIf: section.marks.skipIf }, flat)
        : false;

      if (!skipped) {
        const rows = Array.isArray(input.marks) ? input.marks : [];
        const cleanRows: {
          subject: string;
          max: number;
          obtained: number;
        }[] = [];

        for (const row of rows.slice(0, 10)) {
          const r = (row || {}) as Record<string, unknown>;
          const subject = clean(r.subject, 60);
          const max = Number(r.max);
          const obtained = Number(r.obtained);

          if (!subject) continue;

          if (
            !Number.isFinite(max) ||
            !Number.isFinite(obtained) ||
            max <= 0 ||
            max > 1000 ||
            obtained < 0
          ) {
            errors.push(`${section.marks.title}: check marks for ${subject}.`);
            continue;
          }

          if (obtained > max) {
            errors.push(
              `${section.marks.title}: ${subject} marks cannot exceed ${max}.`,
            );
            continue;
          }

          cleanRows.push({ subject, max, obtained });
        }

        if (cleanRows.length < 5) {
          errors.push(`${section.marks.title}: enter at least 5 subjects.`);
        }

        out.marks = cleanRows;

        const totalMax = cleanRows.reduce((sum, row) => sum + row.max, 0);
        const totalObtained = cleanRows.reduce(
          (sum, row) => sum + row.obtained,
          0,
        );

        out.marksMax = totalMax;
        out.marksObtained = totalObtained;
        out.percentage = totalMax
          ? Math.round((totalObtained / totalMax) * 10000) / 100
          : 0;
      }
    }
  }

  // Percentage for forms that only ask for totals (Class 9).
  if (
    typeof out.marksMax === 'number' &&
    typeof out.marksObtained === 'number' &&
    out.percentage === undefined
  ) {
    if (out.marksObtained > out.marksMax) {
      errors.push('Marks obtained cannot be more than maximum marks.');
    } else {
      out.percentage =
        Math.round((out.marksObtained / out.marksMax) * 10000) / 100;
    }
  }

  // Typed signature on the declaration.
  if (profile.requiresDeclarationName) {
    const name = clean(input.declarationName, 100);

    if (!name) {
      errors.push('Declaration: type the full name of the signer.');
    } else {
      out.declarationName = name;
    }
  }

  if (errors.length > 0) {
    throw new BadRequestException(errors.slice(0, 6).join(' '));
  }

  const apaar =
    typeof out.apaarId === 'string' && out.apaarId ? out.apaarId : null;

  return { details: out, apaarId: apaar };
}

export function missingRequiredDocuments(
  profileId: string | null | undefined,
  uploadedTypes: string[],
  details?: unknown,
): string[] {
  const profile = getProfile(profileId);

  const d = (details && typeof details === 'object'
    ? details
    : {}) as Record<string, unknown>;

  // A marksheet is not needed while the last result is awaited.
  const resultAwaited = [
    d.prevResult,
    d.result9,
    d.result10,
    d.result11,
  ].some((value) => value === 'Result awaited');

  return profile.documents
    .filter(
      (doc) =>
        doc.required &&
        !uploadedTypes.includes(doc.type) &&
        !(
          resultAwaited &&
          (doc.type === 'MARKSHEET' || doc.type === 'BOARD_CERTIFICATE')
        ),
    )
    .map((doc) => doc.label);
}
