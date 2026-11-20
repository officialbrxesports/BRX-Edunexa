import {
  type DocSpec,
  type Field,
  type Profile,
  type Section,
} from '../students/admission-profiles';

/* =========================================================
   STAFF JOINING FORMS
   One form each for Teacher, Staff (office / support) and
   Security Guard. Name, contact, address and Aadhaar last 4
   digits are common fields stored on the application itself.
========================================================= */

export type JoinRole = 'TEACHER' | 'STAFF' | 'GUARD' | 'PARENT';

export const JOIN_ROLES: JoinRole[] = ['TEACHER', 'STAFF', 'GUARD', 'PARENT'];

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

const date = (key: string, label: string, extra: Partial<Field> = {}): Field => ({
  key,
  label,
  type: 'date',
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

const personal: Section = {
  id: 'personal',
  title: 'Personal Details',
  fields: [
    text('nationality', 'Nationality', { defaultValue: 'Indian', required: true }),
    select('maritalStatus', 'Marital status', ['Single', 'Married', 'Other']),
    text('bloodGroup', 'Blood group', { maxLength: 5 }),
    select('category', 'Category', ['General', 'OBC', 'SC', 'ST', 'EWS']),
  ],
};

const emergency: Section = {
  id: 'emergency',
  title: 'Emergency Contact',
  fields: [
    text('emergencyName', 'Contact person name', { required: true }),
    text('emergencyRelation', 'Relation'),
    text('emergencyPhone', 'Contact mobile number', {
      required: true,
      pattern: '^[0-9+\\-\\s]{7,20}$',
      patternHint: 'Enter a valid mobile number.',
    }),
  ],
};

const experience = (label: string): Section => ({
  id: 'experience',
  title: 'Work Experience',
  fields: [
    num('experienceYears', 'Total experience (years)', { min: 0, max: 60, defaultValue: '0' }),
    text('lastEmployer', `Last ${label} (if any)`),
    text('lastDesignation', 'Last designation / post'),
    text('leavingReason', 'Reason for leaving'),
  ],
});

const PHOTO: DocSpec = { type: 'PHOTO', label: 'Passport size photo', required: true };
const SIGN: DocSpec = { type: 'SIGNATURE', label: 'Signature', required: true };
const AADHAAR: DocSpec = {
  type: 'AADHAAR',
  label: 'Aadhaar card (or other photo ID)',
  required: true,
};
const ADDRESS: DocSpec = {
  type: 'ADDRESS_PROOF',
  label: 'Address proof',
  required: false,
};
const EXPERIENCE: DocSpec = {
  type: 'EXPERIENCE_LETTER',
  label: 'Experience / relieving letter',
  required: false,
  note: 'Only if you have worked before.',
};
const BANK: DocSpec = {
  type: 'BANK_PASSBOOK',
  label: 'Bank passbook first page',
  required: false,
};

const INSTRUCTIONS = [
  'Fill the form in capital letters with a blue or black pen.',
  'Attach self-attested photocopies. Bring originals for verification.',
  'Joining is final only after document verification and approval.',
];

export const JOIN_PROFILES: Profile[] = [
  {
    id: 'JOIN_TEACHER',
    title: 'Teacher Joining Form',
    classLabel: 'Teacher',
    description: 'For teaching staff: lecturers, school teachers and tutors.',
    sections: [
      personal,
      {
        id: 'qualification',
        title: 'Qualification',
        fields: [
          select('highestQualification', 'Highest qualification', [
            'Graduate',
            'Post graduate',
            'M.Phil',
            'PhD',
          ], { required: true }),
          text('graduationDegree', 'Graduation degree and subject', { required: true }),
          text('graduationUniversity', 'University / board', { required: true }),
          num('graduationYear', 'Year of passing', { min: 1950, max: 2100, required: true }),
          num('graduationPercent', 'Percentage / CGPA', { min: 0, max: 100 }),
          text('postGradDegree', 'Post graduation degree and subject'),
          text('postGradUniversity', 'Post graduation university'),
          num('postGradYear', 'Year of passing (post graduation)', { min: 1950, max: 2100 }),
          yesno('hasBEd', 'B.Ed. / teaching degree completed?'),
          select('eligibility', 'Eligibility test passed', [
            'None',
            'CTET',
            'State TET',
            'NET',
            'SET',
            'Other',
          ]),
        ],
      },
      {
        id: 'teaching',
        title: 'Teaching Details',
        fields: [
          text('subjects', 'Subjects you can teach', { required: true }),
          text('classesToTeach', 'Classes / programs you can teach', { required: true }),
          select('employmentType', 'Applying for', ['Full time', 'Part time', 'Visiting']),
          date('expectedJoining', 'Expected joining date'),
        ],
      },
      experience('institution'),
      emergency,
    ],
    documents: [
      PHOTO,
      SIGN,
      AADHAAR,
      { type: 'DEGREE_CERTIFICATE', label: 'Graduation degree / marksheet', required: true },
      { type: 'POST_GRAD_CERTIFICATE', label: 'Post graduation degree / marksheet', required: false },
      { type: 'BED_CERTIFICATE', label: 'B.Ed. / teaching certificate', required: false },
      { type: 'ELIGIBILITY_CERTIFICATE', label: 'NET / SET / TET certificate', required: false },
      EXPERIENCE,
      { type: 'PAN_CARD', label: 'PAN card', required: false },
      BANK,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
  {
    id: 'JOIN_STAFF',
    title: 'Staff Joining Form',
    classLabel: 'Staff',
    description:
      'For office and support staff: clerk, accountant, lab assistant, librarian, driver and others.',
    sections: [
      personal,
      {
        id: 'post',
        title: 'Post and Qualification',
        fields: [
          select(
            'postApplied',
            'Post applied for',
            [
              'Office Clerk',
              'Accountant',
              'Lab Assistant',
              'Librarian',
              'Computer Operator',
              'Driver',
              'Peon / Attendant',
              'Cleaning Staff',
              'Other',
            ],
            { required: true },
          ),
          text('postOther', 'Post name', {
            showIf: { key: 'postApplied', equals: 'Other' },
          }),
          select(
            'highestQualification',
            'Highest qualification',
            ['Below 10th', '10th', '12th', 'Diploma / ITI', 'Graduate', 'Post graduate'],
            { required: true },
          ),
          text('qualificationDetail', 'Course / trade and board / university'),
          num('qualificationYear', 'Year of passing', { min: 1950, max: 2100 }),
          yesno('computerSkills', 'Basic computer knowledge?'),
          text('drivingLicense', 'Driving licence number (drivers only)', {
            showIf: { key: 'postApplied', equals: 'Driver' },
          }),
          date('expectedJoining', 'Expected joining date'),
        ],
      },
      experience('employer'),
      emergency,
    ],
    documents: [
      PHOTO,
      SIGN,
      AADHAAR,
      {
        type: 'QUALIFICATION_PROOF',
        label: 'Highest qualification certificate / marksheet',
        required: true,
      },
      ADDRESS,
      EXPERIENCE,
      { type: 'DRIVING_LICENSE', label: 'Driving licence (drivers)', required: false },
      BANK,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
  {
    id: 'JOIN_GUARD',
    title: 'Security Guard Joining Form',
    classLabel: 'Security Guard',
    description: 'For security guards, directly hired or sent by a security agency.',
    sections: [
      personal,
      {
        id: 'duty',
        title: 'Duty Details',
        fields: [
          select('employmentType', 'Joining type', ['Direct (by institution)', 'Through agency'], {
            required: true,
          }),
          text('agencyName', 'Agency name', {
            showIf: { key: 'employmentType', equals: 'Through agency' },
          }),
          text('agencyPhone', 'Agency contact number', {
            showIf: { key: 'employmentType', equals: 'Through agency' },
          }),
          select('shift', 'Shift', ['Day', 'Night', 'Any shift'], { required: true }),
          yesno('exServiceman', 'Ex-serviceman?'),
          text('serviceDetails', 'Force / rank and years of service', {
            showIf: { key: 'exServiceman', equals: 'Yes' },
          }),
          date('expectedJoining', 'Expected joining date'),
        ],
      },
      {
        id: 'verification',
        title: 'Verification',
        fields: [
          yesno('policeVerificationDone', 'Police verification completed?', { required: true }),
          text('policeStation', 'Police station / district of verification', {
            showIf: { key: 'policeVerificationDone', equals: 'Yes' },
          }),
          yesno('medicalFit', 'Medical fitness certificate available?'),
        ],
      },
      experience('employer'),
      emergency,
    ],
    documents: [
      PHOTO,
      SIGN,
      AADHAAR,
      {
        type: 'POLICE_VERIFICATION',
        label: 'Police verification certificate',
        required: true,
      },
      { type: 'MEDICAL_FITNESS', label: 'Medical fitness certificate', required: false },
      { type: 'AGENCY_ID', label: 'Agency ID / appointment letter', required: false, note: 'If sent by an agency.' },
      { type: 'DISCHARGE_BOOK', label: 'Discharge book (ex-servicemen)', required: false },
      ADDRESS,
      EXPERIENCE,
    ],
    instructions: INSTRUCTIONS,
    requiresPreviousSchool: false,
    requiresDeclarationName: true,
  },
];

JOIN_PROFILES.push({
  id: 'JOIN_PARENT',
  title: 'Parent / Guardian Registration Form',
  classLabel: 'Parent / Guardian',
  description:
    'For parents and guardians who need a login to see their child\'s attendance, results and notices.',
  sections: [
    {
      id: 'relation',
      title: 'Relation and Occupation',
      fields: [
        select('relation', 'Relation with the student', ['Father', 'Mother', 'Guardian', 'Other'], {
          required: true,
        }),
        text('relationOther', 'Please specify relation', {
          showIf: { key: 'relation', equals: 'Other' },
        }),
        text('occupation', 'Occupation'),
        select('qualification', 'Education', [
          'Below 10th',
          '10th',
          '12th',
          'Graduate',
          'Post graduate',
          'Other',
        ]),
        select('familyIncome', 'Annual family income', [
          'Below 1 lakh',
          '1 to 2.5 lakh',
          '2.5 to 5 lakh',
          '5 to 8 lakh',
          'Above 8 lakh',
        ]),
        text('studentName', 'Name of the student (child / ward)', { required: true }),
        text('studentClass', 'Class / program of the student'),
      ],
    },
    {
      id: 'alternate',
      title: 'Alternate Contact',
      fields: [
        text('alternateName', 'Alternate contact person'),
        text('alternatePhone', 'Alternate mobile number', {
          pattern: '^[0-9+\\-\\s]{7,20}$',
          patternHint: 'Enter a valid mobile number.',
        }),
      ],
    },
  ],
  documents: [
    PHOTO,
    AADHAAR,
    SIGN,
    {
      type: 'GUARDIAN_PROOF',
      label: 'Guardianship proof (for guardians)',
      required: false,
      note: 'Only if you are not the father or mother.',
    },
    ADDRESS,
  ],
  instructions: [
    'Fill the form in capital letters with a blue or black pen.',
    'The login is created only after the Head approves this form.',
    'Bring the original Aadhaar for verification.',
  ],
  requiresPreviousSchool: false,
  requiresDeclarationName: true,
});

export function profileForRole(role: string): Profile {
  return (
    JOIN_PROFILES.find((p) => p.id === `JOIN_${role}`) || JOIN_PROFILES[0]
  );
}

export const JOIN_DOCUMENT_TYPES: string[] = Array.from(
  new Set(JOIN_PROFILES.flatMap((p) => p.documents.map((d) => d.type))),
).concat('OTHER');

export function missingJoinDocuments(
  role: string,
  uploadedTypes: string[],
): string[] {
  return profileForRole(role)
    .documents.filter((doc) => doc.required && !uploadedTypes.includes(doc.type))
    .map((doc) => doc.label);
}
