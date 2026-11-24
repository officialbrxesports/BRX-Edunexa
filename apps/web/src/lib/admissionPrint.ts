import {
  documentLabel,
  isFieldVisible,
  marksSkipped,
  type AdmissionProfile,
  type Details,
  type MarkRow,
  type ProfileField,
} from "./admissionProfiles";

/* Builds the printable admission form (blank or filled).
   Print uses a hidden frame so pop-up blockers do not interfere.
   Use the browser's "Save as PDF" to download. */

export type PrintData = {
  applicationNumber?: string;
  className?: string;
  sectionName?: string;
  submittedAt?: string;
  status?: string;
  base?: Record<string, unknown>;
  details?: Details;
  uploadedTypes?: string[];
  photoUrl?: string;
  signUrl?: string;
};

/** Reads an uploaded photo / signature (image) as a data URL so it can be printed. */
export async function loadPrintImages(
  docs: { id: string; type: string }[],
  urlFor: (id: string) => string,
): Promise<{ photoUrl?: string; signUrl?: string }> {
  const read = async (id?: string): Promise<string | undefined> => {
    if (!id) return undefined;

    try {
      const response = await fetch(urlFor(id), { credentials: "include" });

      if (!response.ok) return undefined;

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) return undefined;

      return await new Promise<string | undefined>((resolve) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  };

  const photo = docs.find((d) => d.type === "STUDENT_PHOTO" || d.type === "PHOTO");
  const sign = docs.find((d) => d.type === "SIGNATURE");
  const [photoUrl, signUrl] = await Promise.all([read(photo?.id), read(sign?.id)]);

  return { photoUrl, signUrl };
}

function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) =>
    (
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }) as Record<string, string>
    )[c],
  );
}

function fmtDate(value: unknown): string {
  if (!value) return "";

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const BASE_SECTIONS: {
  title: string;
  fields: { key: string; label: string; wide?: boolean; date?: boolean; options?: string[] }[];
  needsPrevious?: boolean;
}[] = [
  {
    title: "A. Student Details",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Last name" },
      { key: "dateOfBirth", label: "Date of birth", date: true },
      { key: "gender", label: "Gender", options: ["Male", "Female", "Other"] },
      { key: "bloodGroup", label: "Blood group" },
      { key: "category", label: "Category (General / OBC / SC / ST / EWS)" },
      { key: "religion", label: "Religion" },
      { key: "motherTongue", label: "Mother tongue" },
      { key: "identityLast4", label: "Aadhaar (last 4 digits only)" },
      { key: "studentEmail", label: "Student email", wide: true },
    ],
  },
  {
    title: "B. Parent / Guardian Details",
    fields: [
      { key: "fatherName", label: "Father's name" },
      { key: "fatherOccupation", label: "Father's occupation" },
      { key: "motherName", label: "Mother's name" },
      { key: "motherOccupation", label: "Mother's occupation" },
      { key: "guardianName", label: "Guardian's name" },
      { key: "guardianPhone", label: "Guardian's phone" },
      { key: "parentPhone", label: "Parent mobile" },
      { key: "whatsappPhone", label: "WhatsApp number" },
      { key: "parentEmail", label: "Parent email", wide: true },
    ],
  },
  {
    title: "C. Present Address",
    fields: [
      { key: "address", label: "Address", wide: true },
      { key: "city", label: "City / district" },
      { key: "state", label: "State" },
      { key: "pinCode", label: "PIN code" },
      { key: "country", label: "Country" },
    ],
  },
  {
    title: "D. Previous School",
    needsPrevious: true,
    fields: [
      { key: "previousSchool", label: "School name", wide: true },
      { key: "previousClass", label: "Last class attended" },
      { key: "previousBoard", label: "Board" },
      { key: "previousMarks", label: "Marks / percentage" },
      { key: "previousTCNumber", label: "Transfer certificate no." },
    ],
  },
];

const COLLEGE_BASE_SECTIONS: typeof BASE_SECTIONS = [
  {
    title: "A. Applicant Details",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Last name" },
      { key: "dateOfBirth", label: "Date of birth", date: true },
      { key: "gender", label: "Gender", options: ["Male", "Female", "Other"] },
      { key: "category", label: "Category (General / OBC / SC / ST / EWS)" },
      { key: "fatherName", label: "Father's name" },
      { key: "motherName", label: "Mother's name" },
      { key: "identityLast4", label: "Aadhaar (last 4 digits only)" },
      { key: "parentPhone", label: "Mobile number" },
      { key: "studentEmail", label: "Email", wide: true },
    ],
  },
  {
    title: "B. Address",
    fields: [
      { key: "address", label: "Address", wide: true },
      { key: "city", label: "City / district" },
      { key: "state", label: "State" },
      { key: "pinCode", label: "PIN code" },
    ],
  },
];

const STAFF_BASE_SECTIONS: typeof BASE_SECTIONS = [
  {
    title: "A. Applicant Details",
    fields: [
      { key: "firstName", label: "First name" },
      { key: "middleName", label: "Middle name" },
      { key: "lastName", label: "Last name" },
      { key: "dateOfBirth", label: "Date of birth", date: true },
      { key: "gender", label: "Gender", options: ["Male", "Female", "Other"] },
      { key: "fatherName", label: "Father's / husband's name" },
      { key: "identityLast4", label: "Aadhaar (last 4 digits only)" },
      { key: "phone", label: "Mobile number" },
      { key: "email", label: "Email", wide: true },
    ],
  },
  {
    title: "B. Address",
    fields: [
      { key: "address", label: "Address", wide: true },
      { key: "city", label: "City / district" },
      { key: "state", label: "State" },
      { key: "pinCode", label: "PIN code" },
    ],
  },
];

const STYLE = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 11px; margin: 0; }
.head { display: flex; justify-content: space-between; gap: 12px; border-bottom: 2px solid #111; padding-bottom: 8px; }
.head h1 { margin: 0; font-size: 18px; }
.head h2 { margin: 4px 0 0; font-size: 13px; font-weight: 600; }
.head p { margin: 3px 0 0; color: #333; }
.photo { width: 34mm; height: 42mm; border: 1px solid #111; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 9px; color: #444; flex: none; }
.meta { display: flex; flex-wrap: wrap; gap: 4px 18px; margin: 8px 0; }
.meta span b { font-weight: 700; }
.sec { margin-top: 10px; break-inside: avoid; page-break-inside: avoid; }
.sec h3 { margin: 0 0 5px; font-size: 12px; background: #e9edf3; padding: 4px 6px; border: 1px solid #b8c0cc; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 10px; }
.f { min-width: 0; }
.f.wide { grid-column: span 3; }
.f.half { grid-column: span 2; }
.l { font-size: 8.5px; color: #444; text-transform: uppercase; letter-spacing: .03em; }
.v { min-height: 17px; border-bottom: 1px solid #555; padding: 1px 2px; font-weight: 600; word-break: break-word; }
.v.tall { min-height: 34px; }
.opt { font-weight: 400; margin-right: 10px; white-space: nowrap; }
table { width: 100%; border-collapse: collapse; margin-top: 4px; }
th, td { border: 1px solid #555; padding: 4px 6px; text-align: left; }
th { background: #f0f2f5; font-size: 10px; }
td.n { text-align: right; width: 70px; }
.rowh { height: 22px; }
ul.inst { margin: 4px 0 0 16px; padding: 0; }
.decl { margin-top: 10px; border: 1px solid #555; padding: 8px; break-inside: avoid; page-break-inside: avoid; }
.sign { display: flex; justify-content: space-between; gap: 20px; margin-top: 34px; }
.sign div { flex: 1; border-top: 1px solid #111; padding-top: 3px; text-align: center; font-size: 10px; }
.office { margin-top: 12px; border: 1px dashed #555; padding: 8px; break-inside: avoid; page-break-inside: avoid; }
.office h3 { margin: 0 0 6px; font-size: 11px; }
.chk { font-size: 14px; line-height: 1; }
.small { font-size: 9.5px; color: #333; }
`;

function fieldHtml(
  label: string,
  value: string,
  options: string[] | undefined,
  blank: boolean,
  cls = "",
  tall = false,
): string {
  let inner: string;

  if (blank) {
    inner = options
      ? options.map((o) => `<span class="opt">&#9744; ${esc(o)}</span>`).join("")
      : "";
  } else {
    inner = esc(value);
  }

  return `<div class="f ${cls}"><div class="l">${esc(label)}</div><div class="v${
    tall ? " tall" : ""
  }">${inner}</div></div>`;
}

function profileFieldValue(field: ProfileField, details: Details): string {
  const raw = details[field.key];

  if (Array.isArray(raw)) return (raw as unknown[]).join(", ");
  if (raw === undefined || raw === null) return "";

  return String(raw);
}

function marksHtml(
  title: string,
  subjects: string[],
  maxMarks: number,
  rows: MarkRow[] | undefined,
  blank: boolean,
): string {
  const list: MarkRow[] = blank
    ? [
        ...subjects.map((subject) => ({
          subject,
          max: maxMarks,
          obtained: "",
        })),
      ]
    : rows || [];

  const body = list
    .map(
      (row) =>
        `<tr class="rowh"><td>${esc(row.subject)}</td><td class="n">${esc(
          row.max,
        )}</td><td class="n">${esc(row.obtained)}</td></tr>`,
    )
    .join("");

  let total = "";

  if (!blank && list.length) {
    const max = list.reduce((s, r) => s + Number(r.max || 0), 0);
    const got = list.reduce((s, r) => s + Number(r.obtained || 0), 0);

    total = `<tr><td><b>Total</b></td><td class="n"><b>${max}</b></td><td class="n"><b>${got}${
      max ? ` (${((got / max) * 100).toFixed(2)}%)` : ""
    }</b></td></tr>`;
  } else if (blank) {
    total = `<tr class="rowh"><td><b>Total / Percentage</b></td><td class="n"></td><td class="n"></td></tr>`;
  }

  return `<div style="margin-top:6px"><div class="l">${esc(
    title,
  )}</div><table><tr><th>Subject</th><th>Max marks</th><th>Marks obtained</th></tr>${body}${total}</table></div>`;
}

export function buildFormHtml(
  profile: AdmissionProfile,
  institutionName: string,
  data?: PrintData,
  options?: { variant?: "college" | "staff" | "program" },
): string {
  const college = options?.variant === "college";
  const staff = options?.variant === "staff";
  const program = options?.variant === "program";
  const blank = !data;
  const base = data?.base || {};
  const details: Details = data?.details || {};
  const uploaded = data?.uploadedTypes || [];

  const baseHtml = (staff ? STAFF_BASE_SECTIONS : college || program ? COLLEGE_BASE_SECTIONS : BASE_SECTIONS)
    .filter((s) => !s.needsPrevious || profile.requiresPreviousSchool)
    .map((section) => {
      const fields = section.fields
        .map((field) => {
          let value = String(base[field.key] ?? "");

          if (field.date) value = fmtDate(base[field.key]);
          if (field.options && !blank) {
            value =
              field.options.find(
                (o) => o.toLowerCase() === value.toLowerCase(),
              ) || value;
          }

          return fieldHtml(
            field.label,
            value,
            field.options,
            blank,
            field.wide ? "wide" : "",
            field.key === "address",
          );
        })
        .join("");

      return `<div class="sec"><h3>${esc(section.title)}</h3><div class="grid">${fields}</div></div>`;
    })
    .join("");

  const letters = college || staff || program ? "CDEFGHIJKL" : "EFGHIJKLMN";

  const profileHtml = profile.sections
    .map((section, index) => {
      const fields = section.fields
        .filter((f) => blank || isFieldVisible(f, details))
        .map((field) => {
          const wide =
            field.type === "textarea" || field.type === "multi" ? "wide" : "";
          const options =
            field.type === "yesno"
              ? ["Yes", "No"]
              : field.type === "select" || field.type === "multi"
                ? field.options
                : undefined;

          const label =
            blank && field.showIf
              ? `${field.label} (if applicable)`
              : field.label;

          return fieldHtml(
            label,
            profileFieldValue(field, details),
            options,
            blank,
            wide,
            field.type === "textarea",
          );
        })
        .join("");

      let marks = "";

      if (section.marks && (blank || !marksSkipped(section.marks, details))) {
        marks = marksHtml(
          section.marks.title,
          section.marks.subjects,
          section.marks.maxMarks,
          Array.isArray(details.marks)
            ? (details.marks as MarkRow[])
            : undefined,
          blank,
        );
      }

      return `<div class="sec"><h3>${letters[index] || "+"}. ${esc(
        section.title,
      )}</h3><div class="grid">${fields}</div>${marks}</div>`;
    })
    .join("");

  const docRows = profile.documents
    .map((doc) => {
      const has = uploaded.includes(doc.type);
      const status = blank
        ? "&#9744; Attached"
        : has
          ? "&#9745; Attached"
          : "&#9744; Not attached";

      return `<tr class="rowh"><td>${esc(doc.label)}${
        doc.note ? `<div class="small">${esc(doc.note)}</div>` : ""
      }</td><td>${doc.required ? "Required" : "Optional"}</td><td>${status}</td></tr>`;
    })
    .join("");

  const documentsHtml = `<div class="sec"><h3>Documents to attach (self-attested photocopies, bring originals)</h3><table><tr><th>Document</th><th>Need</th><th>Status</th></tr>${docRows}</table><p class="small">Allowed upload formats: JPG, PNG or PDF, maximum 2 MB each.</p></div>`;

  const signer = String(details.declarationName || "");
  const signImg = data?.signUrl
    ? `<img src="${data.signUrl}" alt="" style="position:absolute;left:50%;bottom:100%;transform:translateX(-50%);max-height:30px;max-width:90%">`
    : "";

  const declaration = `<div class="decl"><b>Declaration</b><p style="margin:5px 0 0">I declare that all information given in this form is true and complete to the best of my knowledge. I will follow the rules of the institution. If any information is found false, the ${staff ? "appointment" : "admission"} may be cancelled.${
    signer ? `</p><p style="margin:6px 0 0">Signed (typed): <b>${esc(signer)}</b>` : ""
  }</p><div class="sign">${staff ? `<div style="position:relative">${signImg}Signature of applicant</div><div>Signature of Head / Principal</div><div>Date &amp; place</div>` : `<div>Signature of parent / guardian</div><div style="position:relative">${signImg}Signature of student</div><div>Date &amp; place</div>`}</div></div>`;

  const office = `<div class="office"><h3>For office use only</h3><div class="grid"><div class="f"><div class="l">Application no.</div><div class="v">${esc(
    data?.applicationNumber || "",
  )}</div></div><div class="f"><div class="l">Date received</div><div class="v">${esc(
    data?.submittedAt ? fmtDate(data.submittedAt) : "",
  )}</div></div><div class="f"><div class="l">Documents verified by</div><div class="v"></div></div><div class="f"><div class="l">${staff ? "Appointment letter no." : "Fee receipt no."}</div><div class="v"></div></div><div class="f"><div class="l">${staff ? "Joining date" : "Section allotted"}</div><div class="v">${esc(
    staff ? "" : data?.sectionName || "",
  )}</div></div><div class="f"><div class="l">Remarks / decision</div><div class="v"></div></div></div></div>`;

  const instructions = profile.instructions.length
    ? `<div class="sec"><h3>Instructions</h3><ul class="inst">${profile.instructions
        .map((i) => `<li>${esc(i)}</li>`)
        .join("")}</ul></div>`
    : "";

  const classLine = blank
    ? `<span><b>${staff ? "Post applied for" : program ? `${profile.classLabel} applying for` : college ? "Program applying for" : "Class applying for"}:</b> ${
        staff ? esc(profile.classLabel) : program || college ? "______________________" : esc(profile.classLabel)
      }</span><span><b>Session:</b> ____________</span>`
    : `<span><b>${staff ? "Post" : program ? profile.classLabel : college ? "Program" : "Class"}:</b> ${esc(data?.className || "")}${
        data?.sectionName ? ` (${esc(data.sectionName)})` : ""
      }</span><span><b>Application no.:</b> ${esc(
        data?.applicationNumber || "",
      )}</span><span><b>Date:</b> ${esc(
        data?.submittedAt ? fmtDate(data.submittedAt) : "",
      )}</span>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(
    profile.title,
  )}</title><style>${STYLE}</style></head><body>
<div class="head"><div><h1>${esc(
    institutionName || "School name: ______________________________",
  )}</h1><h2>${esc(profile.title)}</h2><p>${esc(
    profile.description,
  )}</p></div><div class="photo">${
    data?.photoUrl
      ? `<img src="${data.photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover">`
      : "Affix recent passport size photo"
  }</div></div>
<div class="meta">${classLine}</div>
${instructions}${baseHtml}${profileHtml}${documentsHtml}${declaration}${office}
</body></html>`;
}

/* Opens the browser print dialog for the given HTML. */
export function printHtml(html: string): void {
  const frame = document.createElement("iframe");

  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";

  frame.onload = () => {
    const win = frame.contentWindow;

    if (!win) return;

    win.focus();
    win.print();

    window.setTimeout(() => frame.remove(), 60000);
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);
}
