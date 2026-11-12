"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { API_URL } from "../../lib/api";

import {
  CheckCircle2,
  XCircle,
  Upload,
  Download,
  RefreshCw,
  Plus,
  FileText,
  Eye,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type SchoolSection = {
  id: string;
  name: string;
  code?: string;
};

type SchoolClass = {
  id: string;
  name: string;
  sections?: SchoolSection[];
};

type AdmissionForm = {
  firstName: string;
  middleName: string;
  lastName: string;
  studentEmail: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  category: string;
  religion: string;
  motherTongue: string;
  identityLast4: string;

  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  guardianName: string;
  guardianPhone: string;
  parentPhone: string;
  whatsappPhone: string;
  parentEmail: string;

  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  previousSchool: string;
  previousClass: string;
  previousBoard: string;
  previousMarks: string;
  previousTCNumber: string;

  classId: string;
  sectionId: string;
  declarationAccepted: boolean;
};

type StringFieldKey = Exclude<
  keyof AdmissionForm,
  "declarationAccepted"
>;

type AdmissionDocument = {
  id: string;
  type: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  verified: boolean;
  remarks?: string | null;
};

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

type AdmissionReceipt = {
  id: string;
  receiptNumber: string;
  amount: string | number;
  paymentMethod?: string | null;
  transactionId?: string | null;
  paymentStatus: PaymentStatus;
  paymentDate?: string | null;
  note?: string | null;
  issuedAt: string;
};

type Admission = {
  id: string;
  applicationNumber: string;

  firstName: string;
  middleName?: string | null;
  lastName?: string | null;

  studentEmail?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  whatsappPhone?: string | null;

  dateOfBirth?: string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  category?: string | null;
  religion?: string | null;
  motherTongue?: string | null;
  identityLast4?: string | null;

  fatherName?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  pinCode?: string | null;
  country?: string | null;

  previousSchool?: string | null;
  previousClass?: string | null;
  previousBoard?: string | null;
  previousMarks?: string | null;
  previousTCNumber?: string | null;

  classId: string;
  sectionId?: string | null;

  status: string;
  reviewNote?: string | null;
  rejectionReason?: string | null;

  class?: { name: string } | null;
  section?: { name: string } | null;

  documents?: AdmissionDocument[];
};

const DOCUMENT_TYPES = [
  "STUDENT_PHOTO",
  "BIRTH_CERTIFICATE",
  "IDENTITY_DOCUMENT",
  "TRANSFER_CERTIFICATE",
  "MARKSHEET",
  "OTHER",
];

const INITIAL_FORM: AdmissionForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  studentEmail: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  category: "",
  religion: "",
  motherTongue: "",
  identityLast4: "",

  fatherName: "",
  fatherOccupation: "",
  motherName: "",
  motherOccupation: "",
  guardianName: "",
  guardianPhone: "",
  parentPhone: "",
  whatsappPhone: "",
  parentEmail: "",

  address: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",

  previousSchool: "",
  previousClass: "",
  previousBoard: "",
  previousMarks: "",
  previousTCNumber: "",

  classId: "",
  sectionId: "",
  declarationAccepted: false,
};

/* =========================================================
   HELPERS
========================================================= */

type ApiStudent = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type ApiResponse = {
  message?: string;
  error?: string;
  statusCode?: number;
  student?: ApiStudent;
  [key: string]: unknown;
};

async function readResponse(response: Response): Promise<ApiResponse> {
  let data: ApiResponse;

  try {
    data = (await response.json()) as ApiResponse;
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

function getArray<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    key in data &&
    Array.isArray((data as Record<string, unknown>)[key])
  ) {
    return (data as Record<string, T[]>)[key];
  }

  return [];
}

function formatDate(value?: string | null): string {
  if (!value) return "Not provided";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN");
}

function fullName(application: Admission): string {
  return [
    application.firstName,
    application.middleName,
    application.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function statusClass(status: string): string {
  switch (status) {
    case "ENROLLED":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "CHANGES_REQUESTED":
      return "bg-amber-50 text-amber-700";

    case "UNDER_REVIEW":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdmissionManagement() {
  /* -------------------------------------------------------
     MAIN STATES
  ------------------------------------------------------- */

  const [applications, setApplications] = useState<Admission[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [selected, setSelected] = useState<Admission | null>(null);

  const [documents, setDocuments] = useState<
    AdmissionDocument[]
  >([]);

  const [receipt, setReceipt] =
    useState<AdmissionReceipt | null>(null);

  /* -------------------------------------------------------
     RECEIPT STATES
  ------------------------------------------------------- */

  const [receiptAmount, setReceiptAmount] = useState("0");

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  const [paymentStatus, setPaymentStatus] =
    useState<PaymentStatus>("PENDING");

  const [transactionId, setTransactionId] = useState("");

  const [paymentDate, setPaymentDate] = useState("");

  const [receiptNote, setReceiptNote] = useState("");

  /* -------------------------------------------------------
     GENERAL STATES
  ------------------------------------------------------- */

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const [form, setForm] =
    useState<AdmissionForm>({ ...INITIAL_FORM });

  const [documentType, setDocumentType] =
    useState("STUDENT_PHOTO");

  const [uploadFile, setUploadFile] =
    useState<File | null>(null);

  const [sectionId, setSectionId] = useState("");

  const [rejectReason, setRejectReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  const [reviewStatus, setReviewStatus] = useState<
    "UNDER_REVIEW" | "CHANGES_REQUESTED"
  >("UNDER_REVIEW");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  /* -------------------------------------------------------
     MEMO VALUES
  ------------------------------------------------------- */

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === form.classId),
    [classes, form.classId],
  );

  const selectedAdmissionClass = useMemo(
    () =>
      classes.find((item) => item.id === selected?.classId),
    [classes, selected?.classId],
  );

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !query ||
        fullName(application).toLowerCase().includes(query) ||
        application.applicationNumber
          .toLowerCase()
          .includes(query) ||
        (application.parentPhone || "").includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const inputClass =
    "mt-1 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100";

  /* -------------------------------------------------------
     FORM FIELD HELPERS
  ------------------------------------------------------- */

  const updateTextField = useCallback(
    (key: StringFieldKey, value: string) => {
      setForm((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const textField = (
    key: StringFieldKey,
    label: string,
    options?: {
      type?: string;
      required?: boolean;
      maxLength?: number;
      placeholder?: string;
    },
  ) => (
    <label
      key={key}
      className="block text-xs font-semibold text-slate-600"
    >
      {label}

      <input
        type={options?.type || "text"}
        required={options?.required}
        maxLength={options?.maxLength}
        placeholder={options?.placeholder}
        className={inputClass}
        value={form[key]}
        onChange={(event) =>
          updateTextField(key, event.target.value)
        }
      />
    </label>
  );

  /* -------------------------------------------------------
     LOAD APPLICATIONS AND CLASSES
  ------------------------------------------------------- */

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [admissionResponse, classResponse] =
        await Promise.all([
          fetch(`${API_URL}/students/admissions`, {
            credentials: "include",
            cache: "no-store",
          }),

          fetch(`${API_URL}/students/classes`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      const [admissionData, classData] =
        await Promise.all([
          readResponse(admissionResponse),
          readResponse(classResponse),
        ]);

      setApplications(
        getArray<Admission>(
          admissionData,
          "applications",
        ),
      );

      setClasses(
        getArray<SchoolClass>(
          classData,
          "classes",
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load admission data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* -------------------------------------------------------
     LOAD DOCUMENTS
  ------------------------------------------------------- */

  const loadDocuments = useCallback(
    async (applicationId: string) => {
      try {
        const response = await fetch(
          `${API_URL}/students/admissions/${applicationId}/documents`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        const data = await readResponse(response);

        setDocuments(
          getArray<AdmissionDocument>(
            data,
            "documents",
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Could not load documents.",
        );

        setDocuments([]);
      }
    },
    [],
  );

  /* -------------------------------------------------------
     LOAD RECEIPT
  ------------------------------------------------------- */

  const loadReceipt = useCallback(
    async (applicationId: string) => {
      try {
        const response = await fetch(
          `${API_URL}/students/admissions/${applicationId}/receipt`,
          {
            credentials: "include",
            cache: "no-store",
          },
        );

        if (response.status === 404) {
          setReceipt(null);
          setReceiptAmount("0");
          setPaymentMethod("CASH");
          setPaymentStatus("PENDING");
          setTransactionId("");
          setPaymentDate("");
          setReceiptNote("");
          return;
        }

        const data = await readResponse(response);

        const result = (
          data.receipt || data
        ) as AdmissionReceipt;

        if (result?.receiptNumber) {
          setReceipt(result);

          setReceiptAmount(
            String(result.amount ?? 0),
          );

          setPaymentMethod(
            result.paymentMethod || "CASH",
          );

          setPaymentStatus(
            result.paymentStatus || "PENDING",
          );

          setTransactionId(
            result.transactionId || "",
          );

          setPaymentDate(
            result.paymentDate
              ? new Date(result.paymentDate)
                  .toISOString()
                  .slice(0, 10)
              : "",
          );

          setReceiptNote(result.note || "");
        } else {
          setReceipt(null);
        }
      } catch (err) {
        setReceipt(null);

        setError(
          err instanceof Error
            ? err.message
            : "Could not load receipt.",
        );
      }
    },
    [],
  );

  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadData();
  }, 0);

  return () => window.clearTimeout(timer);
}, [loadData]);

  /* -------------------------------------------------------
     OPEN APPLICATION
  ------------------------------------------------------- */

  async function openApplication(
    application: Admission,
  ) {
    setSelected(application);

    setSectionId(application.sectionId || "");
    setRejectReason("");
    setReviewNote("");

    setMessage("");
    setError("");

    setDocuments([]);
    setReceipt(null);

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${application.id}`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const data = await readResponse(response);

      const detail = (
        data.application || data
      ) as Admission;

      setSelected((current) =>
        current?.id === application.id
          ? { ...application, ...detail }
          : current,
      );
    } catch {
      // Keep list data available if detail request fails.
    }

    await Promise.all([
      loadDocuments(application.id),
      loadReceipt(application.id),
    ]);
  }

  /* -------------------------------------------------------
     NEW APPLICATION
  ------------------------------------------------------- */

  function startNewApplication() {
    setSelected(null);

    setDocuments([]);
    setReceipt(null);

    setForm({ ...INITIAL_FORM });
    setFormStep(1);

    setShowForm(true);

    setError("");
    setMessage("");
  }

  function closeForm() {
    setShowForm(false);
    setFormStep(1);
    setError("");
  }

  /* -------------------------------------------------------
     FORM VALIDATION
  ------------------------------------------------------- */

  function validateCurrentStep(): boolean {
    if (formStep === 1) {
      if (!form.firstName.trim()) {
        setError("Student first name is required.");
        return false;
      }

      if (!form.studentEmail.trim()) {
        setError(
          "Student email is required for student account creation.",
        );
        return false;
      }

      if (!form.classId) {
        setError("Please select an admission class.");
        return false;
      }

      if (
        form.identityLast4 &&
        !/^\d{4}$/.test(form.identityLast4)
      ) {
        setError(
          "Identity last 4 digits must contain exactly 4 numbers.",
        );
        return false;
      }
    }

    if (formStep === 2 && !form.parentPhone.trim()) {
      setError("Parent mobile number is required.");
      return false;
    }

    if (
      formStep === 4 &&
      !form.declarationAccepted
    ) {
      setError(
        "Please accept the declaration before submitting.",
      );
      return false;
    }

    setError("");
    return true;
  }

  /* -------------------------------------------------------
     CREATE APPLICATION
  ------------------------------------------------------- */

  async function createApplication(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            firstName: form.firstName.trim(),
            middleName:
              form.middleName.trim() || undefined,
            lastName:
              form.lastName.trim() || undefined,

            studentEmail:
              form.studentEmail.trim(),

            dateOfBirth:
              form.dateOfBirth || undefined,

            gender: form.gender || undefined,
            bloodGroup:
              form.bloodGroup || undefined,

            category: form.category || undefined,
            religion: form.religion || undefined,

            motherTongue:
              form.motherTongue || undefined,

            identityLast4:
              form.identityLast4 || undefined,

            fatherName:
              form.fatherName.trim() || undefined,

            fatherOccupation:
              form.fatherOccupation.trim() || undefined,

            motherName:
              form.motherName.trim() || undefined,

            motherOccupation:
              form.motherOccupation.trim() || undefined,

            guardianName:
              form.guardianName.trim() || undefined,

            guardianPhone:
              form.guardianPhone.trim() || undefined,

            parentPhone:
              form.parentPhone.trim(),

            whatsappPhone:
              form.whatsappPhone.trim() || undefined,

            parentEmail:
              form.parentEmail.trim() || undefined,

            address:
              form.address.trim() || undefined,

            city:
              form.city.trim() || undefined,

            state:
              form.state.trim() || undefined,

            pinCode:
              form.pinCode.trim() || undefined,

            country:
              form.country.trim() || "India",

            previousSchool:
              form.previousSchool.trim() || undefined,

            previousClass:
              form.previousClass.trim() || undefined,

            previousBoard:
              form.previousBoard.trim() || undefined,

            previousMarks:
              form.previousMarks.trim() || undefined,

            previousTCNumber:
              form.previousTCNumber.trim() || undefined,

            classId: form.classId,

            sectionId:
              form.sectionId || undefined,

            declarationAccepted:
              form.declarationAccepted,
          }),
        },
      );

      await readResponse(response);

      setMessage(
        "Admission application created successfully.",
      );

      setShowForm(false);
      setForm({ ...INITIAL_FORM });
      setFormStep(1);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create admission application.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     UPLOAD DOCUMENT
  ------------------------------------------------------- */

  async function uploadDocument(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selected || !uploadFile) {
      setError(
        "Select an application and document file first.",
      );
      return;
    }

    if (uploadFile.size > 5 * 1024 * 1024) {
      setError("File size must not exceed 5 MB.");
      return;
    }

    const body = new FormData();

    body.append("file", uploadFile);
    body.append("type", documentType);

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/documents`,
        {
          method: "POST",
          credentials: "include",
          body,
        },
      );

      await readResponse(response);

      setUploadFile(null);

      setMessage("Document uploaded successfully.");

      await loadDocuments(selected.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Document upload failed.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     VERIFY DOCUMENT
  ------------------------------------------------------- */

  async function verifyDocument(
    documentId: string,
    verified: boolean,
  ) {
    if (!selected) return;

    const remarks = window.prompt(
      verified
        ? "Verification remarks (optional):"
        : "Reason for un-verifying (optional):",
    );

    if (remarks === null) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/documents/${documentId}/verify`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verified,
            remarks: remarks.trim(),
          }),
        },
      );

      await readResponse(response);

      setMessage(
        verified
          ? "Document verified."
          : "Document marked unverified.",
      );

      await loadDocuments(selected.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Document verification failed.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     DOWNLOAD DOCUMENT
  ------------------------------------------------------- */

  async function downloadDocument(
    doc: AdmissionDocument,
  ) {
    if (!selected) return;

    setWorking(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/documents/${doc.id}/file`,
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        await readResponse(response);
        return;
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const anchor =
        window.document.createElement("a");

      anchor.href = url;
      anchor.download =
        doc.originalName || "admission-document";

      window.document.body.appendChild(anchor);

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Document download failed.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     RECEIPT & PAYMENT FUNCTIONS
  ========================================================= */

  /* -------------------------------------------------------
     CREATE RECEIPT
  ------------------------------------------------------- */

  async function createReceipt() {
    if (!selected) return;

    const amount = Number(receiptAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError("Please enter a valid receipt amount.");
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/receipt`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            note:
              receiptNote.trim() || undefined,
          }),
        },
      );

      await readResponse(response);

      setMessage(
        "Admission receipt created successfully.",
      );

      await loadReceipt(selected.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create receipt.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     UPDATE PAYMENT
  ------------------------------------------------------- */

  async function updatePayment() {
    if (!selected || !receipt) return;

    const amount = Number(receiptAmount);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setError("Please enter a valid payment amount.");
      return;
    }

    if (
      paymentStatus === "PAID" &&
      !paymentMethod
    ) {
      setError("Select a payment method.");
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/payment`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: paymentStatus,
            amount,

            paymentMethod:
              paymentStatus === "PAID"
                ? paymentMethod
                : undefined,

            transactionId:
              transactionId.trim() || undefined,

            paymentDate:
              paymentDate || undefined,

            note:
              receiptNote.trim() || undefined,
          }),
        },
      );

      await readResponse(response);

      setMessage(
        "Payment information updated successfully.",
      );

      await loadReceipt(selected.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update payment.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     PRINT RECEIPT
  ------------------------------------------------------- */

  function printReceipt() {
    if (!selected || !receipt) return;

    const popup = window.open(
      "",
      "_blank",
      "width=800,height=700",
    );

    if (!popup) {
      setError(
        "Please allow pop-ups to print the receipt.",
      );
      return;
    }

    const rows: [string, string][] = [
      [
        "Receipt Number",
        receipt.receiptNumber,
      ],
      [
        "Application Number",
        selected.applicationNumber,
      ],
      [
        "Student Name",
        fullName(selected),
      ],
      [
        "Student Email",
        selected.studentEmail || "Not provided",
      ],
      [
        "Parent Mobile",
        selected.parentPhone || "Not provided",
      ],
      [
        "Class",
        selected.class?.name || "Not provided",
      ],
      [
        "Section",
        selected.section?.name || "Not assigned",
      ],
      [
        "Amount",
        `₹${Number(receipt.amount).toFixed(2)}`,
      ],
      [
        "Payment Status",
        receipt.paymentStatus,
      ],
      [
        "Payment Method",
        receipt.paymentMethod || "Not provided",
      ],
      [
        "Transaction ID",
        receipt.transactionId || "Not provided",
      ],
      [
        "Payment Date",
        formatDate(receipt.paymentDate),
      ],
      [
        "Receipt Issued",
        formatDate(receipt.issuedAt),
      ],
      [
        "Note",
        receipt.note || "No note",
      ],
    ];

    const tableRows = rows
      .map(
        ([label, value]) => `
          <tr>
            <th>${escapeHtml(label)}</th>
            <td>${escapeHtml(value)}</td>
          </tr>
        `,
      )
      .join("");

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>
            Admission Receipt - ${escapeHtml(
              receipt.receiptNumber,
            )}
          </title>

          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #1e293b;
            }

            h1 {
              text-align: center;
              margin-bottom: 5px;
            }

            .subtitle {
              text-align: center;
              color: #64748b;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 30px;
            }

            th, td {
              border: 1px solid #cbd5e1;
              padding: 12px;
              text-align: left;
              font-size: 13px;
            }

            th {
              width: 38%;
              background: #f1f5f9;
            }

            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }

            @media print {
              body {
                padding: 10px;
              }
            }
          </style>
        </head>

        <body>
          <h1>Admission Payment Receipt</h1>

          <p class="subtitle">
            School Admission Record
          </p>

          <table>
            ${tableRows}
          </table>

          <div class="footer">
            This receipt was generated electronically.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  /* =========================================================
     REVIEW & ENROLLMENT FUNCTIONS
  ========================================================= */

  /* -------------------------------------------------------
     UPDATE REVIEW
  ------------------------------------------------------- */

  async function updateReview() {
    if (!selected) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/review`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: reviewStatus,
            note:
              reviewNote.trim() || undefined,
          }),
        },
      );

      await readResponse(response);

      setMessage(
        reviewStatus === "UNDER_REVIEW"
          ? "Application moved to under review."
          : "Changes requested from the applicant.",
      );

      await loadData();

      await openApplication({
        ...selected,
        status: reviewStatus,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not update application.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     APPROVE APPLICATION
  ------------------------------------------------------- */

  async function approveApplication() {
    if (!selected) return;

    if (!selected.studentEmail) {
      setError(
        "Student email is required before approval.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Approve this application and enroll the student?",
    );

    if (!confirmed) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sectionId:
              sectionId || undefined,
          }),
        },
      );

      const data = await readResponse(response);

      setMessage(
        data.temporaryPassword
          ? `Student enrolled successfully. Login email: ${
              data.student?.email ||
              selected.studentEmail
            }. A temporary password was generated; share it securely with the student or guardian.`
          : "Admission approved and student enrolled successfully.",
      );

      setSelected(null);
      setDocuments([]);
      setReceipt(null);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Admission approval failed.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* -------------------------------------------------------
     REJECT APPLICATION
  ------------------------------------------------------- */

  async function rejectApplication() {
    if (!selected) return;

    if (!rejectReason.trim()) {
      setError(
        "Please enter a rejection reason.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this admission application?",
    );

    if (!confirmed) return;

    setWorking(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/students/admissions/${selected.id}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: rejectReason.trim(),
          }),
        },
      );

      await readResponse(response);

      setMessage(
        "Admission application rejected.",
      );

      setSelected(null);
      setDocuments([]);
      setReceipt(null);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Admission rejection failed.",
      );
    } finally {
      setWorking(false);
    }
  }

  /* =========================================================
     FORM FIELD GROUPS
  ========================================================= */

  const studentFields = [
    ["firstName", "First Name *", { required: true }],
    ["middleName", "Middle Name", {}],
    ["lastName", "Last Name", {}],
    [
      "studentEmail",
      "Student Email *",
      { type: "email", required: true },
    ],
    [
      "identityLast4",
      "Identity Last 4 Digits",
      { maxLength: 4 },
    ],
    ["religion", "Religion", {}],
    ["category", "Category", {}],
    ["motherTongue", "Mother Tongue", {}],
  ] as const;

  const parentFields = [
    ["fatherName", "Father's Name"],
    ["fatherOccupation", "Father's Occupation"],
    ["motherName", "Mother's Name"],
    ["motherOccupation", "Mother's Occupation"],
    ["guardianName", "Guardian Name"],
    ["guardianPhone", "Guardian Phone"],
    ["parentPhone", "Parent Mobile Number *"],
    ["whatsappPhone", "WhatsApp Number"],
    ["parentEmail", "Parent Email"],
  ] as const;

  const addressFields = [
    ["city", "City / Village"],
    ["state", "State"],
    ["pinCode", "PIN Code"],
    ["country", "Country"],
  ] as const;

  const previousSchoolFields = [
    ["previousSchool", "Previous School Name"],
    ["previousClass", "Previous Class"],
    ["previousBoard", "Previous Board"],
    ["previousMarks", "Previous Marks / Percentage"],
    ["previousTCNumber", "Transfer Certificate Number"],
  ] as const;

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-5">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck
              className="text-blue-800"
              size={22}
            />

            <h2 className="text-xl font-bold text-slate-900">
              Admission Management
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Manage student applications, documents and enrollment.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading || working}
            className="flex h-10 items-center gap-2 rounded border border-slate-300 bg-white px-3 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button
            type="button"
            onClick={startNewApplication}
            className="flex h-10 items-center gap-2 rounded bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900"
          >
            <Plus size={15} />
            New Admission
          </button>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div
          role="alert"
          className="wrap-break-word rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="wrap-break-word rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {/* =====================================================
          FOUR STEP ADMISSION FORM
      ===================================================== */}

      {showForm && (
        <form
          onSubmit={createApplication}
          className="space-y-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              New Student Admission
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Complete the four steps and review the application before submission.
            </p>
          </div>

          {/* STEP INDICATOR */}

          <div className="grid grid-cols-4 gap-2">
            {[
              "Student",
              "Parents",
              "Previous School",
              "Review",
            ].map((label, index) => {
              const step = index + 1;
              const active = formStep === step;
              const completed = formStep > step;

              return (
                <button
                  key={label}
                  type="button"
                  disabled={step > formStep}
                  onClick={() => {
                    if (step < formStep) {
                      setError("");
                      setFormStep(step);
                    }
                  }}
                  className={`rounded border p-2 text-center text-[10px] font-semibold sm:text-xs ${
                    active
                      ? "border-blue-800 bg-blue-800 text-white"
                      : completed
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <span className="block text-sm">
                    {step}
                  </span>

                  {label}
                </button>
              );
            })}
          </div>

          {/* STEP 1 */}

          {formStep === 1 && (
            <section className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800">
                  Step 1 – Student Details
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the student&apos;s personal and academic details.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {studentFields.map(
                  ([key, label, options]) =>
                    textField(key, label, options),
                )}

                <label className="block text-xs font-semibold text-slate-600">
                  Date of Birth

                  <input
                    type="date"
                    className={inputClass}
                    value={form.dateOfBirth}
                    onChange={(event) =>
                      updateTextField(
                        "dateOfBirth",
                        event.target.value,
                      )
                    }
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Gender

                  <select
                    className={inputClass}
                    value={form.gender}
                    onChange={(event) =>
                      updateTextField(
                        "gender",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Blood Group

                  <select
                    className={inputClass}
                    value={form.bloodGroup}
                    onChange={(event) =>
                      updateTextField(
                        "bloodGroup",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select blood group
                    </option>

                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                    ].map((group) => (
                      <option
                        key={group}
                        value={group}
                      >
                        {group}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Admission Class *

                  <select
                    required
                    className={inputClass}
                    value={form.classId}
                    onChange={(event) => {
                      setForm((current) => ({
                        ...current,
                        classId: event.target.value,
                        sectionId: "",
                      }));
                    }}
                  >
                    <option value="">
                      Select class
                    </option>

                    {classes.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-600">
                  Section

                  <select
                    className={inputClass}
                    value={form.sectionId}
                    disabled={!selectedClass}
                    onChange={(event) =>
                      updateTextField(
                        "sectionId",
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Select section
                    </option>

                    {(selectedClass?.sections || []).map(
                      (section) => (
                        <option
                          key={section.id}
                          value={section.id}
                        >
                          {section.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <p className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Identity information is optional. Only the last four digits should be entered; do not enter a full identity number.
              </p>
            </section>
          )}

          {/* STEP 2 */}

          {formStep === 2 && (
            <section className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800">
                  Step 2 – Parents & Address
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Add parent, guardian and contact information.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {parentFields.map(([key, label]) =>
                  textField(key, label, {
                    required: key === "parentPhone",
                    type:
                      key === "parentEmail"
                        ? "email"
                        : "text",
                  }),
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h5 className="mb-3 text-sm font-bold text-slate-800">
                  Residential Address
                </h5>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {addressFields.map(([key, label]) =>
                    textField(key, label),
                  )}

                  <label className="block text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">
                    Full Address

                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded border border-slate-300 p-3 text-sm outline-none focus:border-blue-600"
                      value={form.address}
                      onChange={(event) =>
                        updateTextField(
                          "address",
                          event.target.value,
                        )
                      }
                    />
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3 */}

          {formStep === 3 && (
            <section className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800">
                  Step 3 – Previous School Details
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  First-time admission applicants may leave these fields blank.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {previousSchoolFields.map(
                  ([key, label]) =>
                    textField(key, label),
                )}
              </div>

              <div className="rounded border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                <strong>Document upload:</strong> Submit the application first. Then select it from the application list to upload the student&apos;s photo, birth certificate, identity document, transfer certificate and marksheet.
              </div>
            </section>
          )}

          {/* STEP 4 */}

          {formStep === 4 && (
            <section className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800">
                  Step 4 – Review & Declaration
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Check the information before submitting.
                </p>
              </div>

              {[
                {
                  title: "Student Information",
                  fields: [
                    [
                      "Student Name",
                      `${form.firstName} ${form.middleName} ${form.lastName}`,
                    ],
                    ["Student Email", form.studentEmail],
                    ["Date of Birth", form.dateOfBirth],
                    ["Gender", form.gender],
                    ["Blood Group", form.bloodGroup],
                    ["Category", form.category],
                    ["Religion", form.religion],
                    ["Class", selectedClass?.name],
                  ],
                },
                {
                  title: "Parent Information",
                  fields: [
                    ["Father", form.fatherName],
                    [
                      "Father Occupation",
                      form.fatherOccupation,
                    ],
                    ["Mother", form.motherName],
                    [
                      "Mother Occupation",
                      form.motherOccupation,
                    ],
                    ["Guardian", form.guardianName],
                    ["Parent Mobile", form.parentPhone],
                    ["WhatsApp", form.whatsappPhone],
                    ["Parent Email", form.parentEmail],
                  ],
                },
                {
                  title: "Address",
                  fields: [
                    ["Address", form.address],
                    ["City", form.city],
                    ["State", form.state],
                    ["PIN Code", form.pinCode],
                    ["Country", form.country],
                  ],
                },
                {
                  title: "Previous School",
                  fields: [
                    ["School", form.previousSchool],
                    [
                      "Previous Class",
                      form.previousClass,
                    ],
                    ["Board", form.previousBoard],
                    ["Marks", form.previousMarks],
                    [
                      "TC Number",
                      form.previousTCNumber,
                    ],
                  ],
                },
              ].map((group) => (
                <div
                  key={group.title}
                  className="rounded border border-slate-200 p-3"
                >
                  <h5 className="mb-3 text-sm font-bold text-slate-800">
                    {group.title}
                  </h5>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {group.fields.map(
                      ([label, value]) => (
                        <div
                          key={label}
                          className="min-w-0"
                        >
                          <p className="text-[10px] text-slate-500">
                            {label}
                          </p>

                          <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
                            {value || "Not provided"}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ))}

              <label className="flex items-start gap-2 rounded border border-slate-200 p-3 text-xs text-slate-700">
                <input
                  type="checkbox"
                  required
                  checked={form.declarationAccepted}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      declarationAccepted:
                        event.target.checked,
                    }))
                  }
                  className="mt-0.5"
                />

                I confirm that the information supplied in this application is accurate and complete.
              </label>
            </section>
          )}

          {/* FORM NAVIGATION */}

          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                if (formStep === 1) {
                  closeForm();
                } else {
                  setError("");
                  setFormStep(
                    (current) => current - 1,
                  );
                }
              }}
              className="flex h-10 items-center gap-2 rounded border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-50"
            >
              <ChevronLeft size={15} />

              {formStep === 1 ? "Cancel" : "Back"}
            </button>

            {formStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateCurrentStep()) {
                    setFormStep(
                      (current) => current + 1,
                    );
                  }
                }}
                className="flex h-10 items-center gap-2 rounded bg-blue-800 px-5 text-xs font-semibold text-white hover:bg-blue-900"
              >
                Continue
                <ChevronRight size={15} />
              </button>
            ) : (
              <button
                disabled={
                  working ||
                  !form.declarationAccepted
                }
                type="submit"
                className="h-10 rounded bg-emerald-700 px-5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {working
                  ? "Submitting..."
                  : "Submit Admission"}
              </button>
            )}
          </div>
        </form>
      )}

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total Applications",
            applications.length,
          ],
          [
            "Submitted",
            applications.filter(
              (item) => item.status === "SUBMITTED",
            ).length,
          ],
          [
            "Enrolled",
            applications.filter(
              (item) => item.status === "ENROLLED",
            ).length,
          ],
          [
            "Rejected",
            applications.filter(
              (item) => item.status === "REJECTED",
            ).length,
          ],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded border border-slate-200 bg-white p-4"
          >
            <p className="text-xs text-slate-500">
              {label}
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* =====================================================
          SEARCH AND FILTER
      ===================================================== */}

      <div className="flex flex-col gap-3 rounded border border-slate-200 bg-white p-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name, application number or mobile..."
            className="h-10 w-full rounded border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-blue-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="h-10 rounded border border-slate-300 bg-white px-3 text-xs"
        >
          <option value="ALL">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="CHANGES_REQUESTED">
            Changes requested
          </option>
          <option value="APPROVED">Approved</option>
          <option value="ENROLLED">Enrolled</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* =====================================================
          APPLICATION LIST AND DETAILS
      ===================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">

        {/* APPLICATION LIST */}

        <section className="min-w-0 rounded border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900">
              Admission Applications
            </h3>

            <span className="text-xs text-slate-500">
              {filteredApplications.length} records
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <Loader2
                className="animate-spin"
                size={17}
              />

              Loading applications...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="py-10 text-center">
              <ClipboardCheck
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No admission applications found.
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Create a new application or change the search filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredApplications.map(
                (application) => (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() =>
                      void openApplication(application)
                    }
                    className={`w-full rounded p-3 text-left hover:bg-blue-50 ${
                      selected?.id === application.id
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {fullName(application)}
                      </span>

                      <span
                        className={`rounded px-2 py-1 text-[10px] font-semibold ${statusClass(application.status)}`}
                      >
                        {application.status.replaceAll(
                          "_",
                          " ",
                        )}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        {application.applicationNumber}
                      </span>

                      <span>
                        {application.class?.name ||
                          "Class not set"}
                      </span>

                      <span>
                        {application.parentPhone ||
                          "No parent mobile"}
                      </span>
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
        </section>

        {/* =================================================
            DETAILS PANEL
        ================================================= */}

        <section className="min-w-0 rounded border border-slate-200 bg-white p-4 shadow-sm">
          {!selected ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <Eye
                size={28}
                className="text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Select an application
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Student details, documents and admission decisions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* STUDENT HEADER */}

              <div className="border-b border-slate-100 pb-4">
                <p className="text-xs font-semibold text-blue-800">
                  {selected.applicationNumber}
                </p>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {fullName(selected)}
                  </h3>

                  <span
                    className={`rounded px-2 py-1 text-[10px] font-semibold ${statusClass(selected.status)}`}
                  >
                    {selected.status.replaceAll(
                      "_",
                      " ",
                    )}
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {selected.studentEmail ||
                    "No student email"}

                  {" · "}

                  {selected.class?.name ||
                    "Class not set"}

                  {" · "}

                  {selected.section?.name ||
                    "Section not set"}
                </p>
              </div>

              {/* APPLICATION DETAILS */}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800">
                  Student Information
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    [
                      "Date of Birth",
                      formatDate(selected.dateOfBirth),
                    ],
                    ["Gender", selected.gender],
                    ["Blood Group", selected.bloodGroup],
                    ["Category", selected.category],
                    ["Religion", selected.religion],
                    [
                      "Mother Tongue",
                      selected.motherTongue,
                    ],
                    [
                      "Identity Last 4",
                      selected.identityLast4,
                    ],
                    [
                      "Parent Mobile",
                      selected.parentPhone,
                    ],
                    [
                      "Parent Email",
                      selected.parentEmail,
                    ],
                    [
                      "WhatsApp",
                      selected.whatsappPhone,
                    ],
                    ["Father", selected.fatherName],
                    [
                      "Father Occupation",
                      selected.fatherOccupation,
                    ],
                    ["Mother", selected.motherName],
                    [
                      "Mother Occupation",
                      selected.motherOccupation,
                    ],
                    [
                      "Guardian",
                      selected.guardianName,
                    ],
                    [
                      "Guardian Phone",
                      selected.guardianPhone,
                    ],
                    ["City", selected.city],
                    ["State", selected.state],
                    ["PIN Code", selected.pinCode],
                    ["Country", selected.country],
                    [
                      "Previous School",
                      selected.previousSchool,
                    ],
                    [
                      "Previous Class",
                      selected.previousClass,
                    ],
                    [
                      "Previous Board",
                      selected.previousBoard,
                    ],
                    [
                      "Previous Marks",
                      selected.previousMarks,
                    ],
                    [
                      "Previous TC Number",
                      selected.previousTCNumber,
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="min-w-0"
                    >
                      <p className="text-[10px] text-slate-500">
                        {label}
                      </p>

                      <p className="mt-1 wrap-break-word text-xs font-semibold text-slate-800">
                        {value || "Not provided"}
                      </p>
                    </div>
                  ))}
                </div>

                {selected.address && (
                  <div>
                    <p className="text-[10px] text-slate-500">
                      Full Address
                    </p>

                    <p className="mt-1 whitespace-pre-wrap wrap-break-word text-xs font-semibold text-slate-800">
                      {selected.address}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  DOCUMENTS
              ================================================= */}

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-800">
                  Admission Documents
                </h4>

                <form
                  onSubmit={uploadDocument}
                  className="space-y-3 rounded border border-dashed border-slate-300 p-3"
                >
                  <label className="block text-xs font-semibold text-slate-600">
                    Document Type

                    <select
                      value={documentType}
                      onChange={(event) =>
                        setDocumentType(event.target.value)
                      }
                      className={inputClass}
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <input
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) =>
                      setUploadFile(
                        event.target.files?.[0] || null,
                      )
                    }
                    className="block w-full text-xs"
                  />

                  <button
                    disabled={working || !uploadFile}
                    type="submit"
                    className="flex h-9 items-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Upload size={14} />
                    Upload Document
                  </button>

                  <p className="text-[10px] text-slate-500">
                    JPG, PNG or PDF · Maximum 5 MB
                  </p>
                </form>

                {documents.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-500">
                    No documents uploaded yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-start gap-2">
                            <FileText
                              size={17}
                              className="mt-0.5 shrink-0 text-blue-700"
                            />

                            <div className="min-w-0">
                              <p className="break-all text-xs font-semibold text-slate-800">
                                {doc.originalName}
                              </p>

                              <p className="mt-1 text-[10px] text-slate-500">
                                {doc.type.replaceAll(
                                  "_",
                                  " ",
                                )}

                                {" · "}

                                {(doc.sizeBytes / 1024).toFixed(1)} KB
                              </p>

                              <p
                                className={`mt-1 text-[10px] font-semibold ${
                                  doc.verified
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {doc.verified
                                  ? "Verified"
                                  : "Pending verification"}
                              </p>

                              {doc.remarks && (
                                <p className="mt-1 text-[10px] text-slate-500">
                                  {doc.remarks}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            title="Download document"
                            disabled={working}
                            onClick={() =>
                              void downloadDocument(doc)
                            }
                            className="rounded p-2 text-blue-800 hover:bg-blue-50 disabled:opacity-50"
                          >
                            <Download size={15} />
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={
                              working || doc.verified
                            }
                            onClick={() =>
                              void verifyDocument(
                                doc.id,
                                true,
                              )
                            }
                            className="flex items-center gap-1 rounded border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 disabled:opacity-40"
                          >
                            <CheckCircle2 size={12} />
                            Verify
                          </button>

                          <button
                            type="button"
                            disabled={
                              working || !doc.verified
                            }
                            onClick={() =>
                              void verifyDocument(
                                doc.id,
                                false,
                              )
                            }
                            className="flex items-center gap-1 rounded border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-700 disabled:opacity-40"
                          >
                            <XCircle size={12} />
                            Unverify
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* =================================================
                  ADMISSION RECEIPT & PAYMENT
              ================================================= */}

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Admission Receipt & Payment
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    Generate receipt and manage admission payment information.
                  </p>
                </div>

                {!receipt ? (
                  <div className="space-y-3 rounded border border-dashed border-slate-300 p-4">
                    <p className="text-xs text-slate-600">
                      No receipt has been generated for this application.
                    </p>

                    <label className="block text-xs font-semibold text-slate-600">
                      Admission Amount (₹)

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={receiptAmount}
                        onChange={(event) =>
                          setReceiptAmount(event.target.value)
                        }
                        className={inputClass}
                      />
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                      Receipt Note

                      <textarea
                        rows={2}
                        value={receiptNote}
                        onChange={(event) =>
                          setReceiptNote(event.target.value)
                        }
                        className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                        placeholder="Optional receipt note"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={working}
                      onClick={() =>
                        void createReceipt()
                      }
                      className="flex h-10 w-full items-center justify-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                    >
                      <FileText size={15} />

                      {working
                        ? "Creating..."
                        : "Generate Admission Receipt"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 rounded border border-slate-200 p-4">
                    {/* RECEIPT HEADER */}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500">
                          Receipt Number
                        </p>

                        <p className="text-sm font-bold text-slate-900">
                          {receipt.receiptNumber}
                        </p>
                      </div>

                      <span
                        className={`rounded px-2 py-1 text-[10px] font-bold ${
                          receipt.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : receipt.paymentStatus === "FAILED"
                              ? "bg-red-50 text-red-700"
                              : receipt.paymentStatus === "REFUNDED"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {receipt.paymentStatus}
                      </span>
                    </div>

                    {/* RECEIPT AMOUNT */}

                    <div className="rounded bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Receipt Amount
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        ₹
                        {Number(
                          receipt.amount,
                        ).toFixed(2)}
                      </p>
                    </div>

                    {/* PAYMENT FORM */}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-xs font-semibold text-slate-600">
                        Amount (₹)

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={receiptAmount}
                          onChange={(event) =>
                            setReceiptAmount(
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-600">
                        Payment Status

                        <select
                          value={paymentStatus}
                          onChange={(event) =>
                            setPaymentStatus(
                              event.target.value as PaymentStatus,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="PENDING">
                            Pending
                          </option>

                          <option value="PAID">
                            Paid
                          </option>

                          <option value="FAILED">
                            Failed
                          </option>

                          <option value="REFUNDED">
                            Refunded
                          </option>
                        </select>
                      </label>

                      <label className="block text-xs font-semibold text-slate-600">
                        Payment Method

                        <select
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="CASH">
                            Cash
                          </option>

                          <option value="UPI">
                            UPI
                          </option>

                          <option value="CARD">
                            Card
                          </option>

                          <option value="BANK_TRANSFER">
                            Bank Transfer
                          </option>

                          <option value="OTHER">
                            Other
                          </option>
                        </select>
                      </label>

                      <label className="block text-xs font-semibold text-slate-600">
                        Payment Date

                        <input
                          type="date"
                          value={paymentDate}
                          max={new Date()
                            .toISOString()
                            .slice(0, 10)}
                          onChange={(event) =>
                            setPaymentDate(
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                        Transaction ID / Reference

                        <input
                          type="text"
                          value={transactionId}
                          onChange={(event) =>
                            setTransactionId(
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Optional transaction reference"
                        />
                      </label>

                      <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">
                        Receipt Note

                        <textarea
                          rows={2}
                          value={receiptNote}
                          onChange={(event) =>
                            setReceiptNote(
                              event.target.value,
                            )
                          }
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-sm"
                          placeholder="Optional payment note"
                        />
                      </label>
                    </div>

                    {/* UPDATE PAYMENT */}

                    <button
                      type="button"
                      disabled={working}
                      onClick={() =>
                        void updatePayment()
                      }
                      className="flex h-10 w-full items-center justify-center gap-2 rounded bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />

                      {working
                        ? "Updating..."
                        : "Update Payment"}
                    </button>

                    {/* PRINT RECEIPT */}

                    <button
                      type="button"
                      disabled={working}
                      onClick={printReceipt}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <FileText size={15} />
                      Print Receipt
                    </button>

                    <p className="text-[10px] text-slate-500">
                      Receipt issued:{" "}
                      {formatDate(receipt.issuedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* =================================================
                  REVIEW ACTIONS
              ================================================= */}

              {selected.status !== "ENROLLED" &&
                selected.status !== "REJECTED" && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <h4 className="text-sm font-bold text-slate-800">
                      Application Review
                    </h4>

                    <label className="block text-xs font-semibold text-slate-600">
                      Review action

                      <select
                        value={reviewStatus}
                        onChange={(event) =>
                          setReviewStatus(
                            event.target.value as
                              | "UNDER_REVIEW"
                              | "CHANGES_REQUESTED",
                          )
                        }
                        className={inputClass}
                      >
                        <option value="UNDER_REVIEW">
                          Move to under review
                        </option>

                        <option value="CHANGES_REQUESTED">
                          Request changes
                        </option>
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-600">
                      Review note

                      <textarea
                        value={reviewNote}
                        onChange={(event) =>
                          setReviewNote(
                            event.target.value,
                          )
                        }
                        rows={2}
                        className="mt-1 w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-blue-600"
                        placeholder="Add review note or requested corrections"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={working}
                      onClick={() =>
                        void updateReview()
                      }
                      className="h-10 w-full rounded border border-blue-200 px-3 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50"
                    >
                      Save Review
                    </button>

                    {/* ENROLLMENT DECISION */}

                    <div className="border-t border-slate-100 pt-3">
                      <h4 className="mb-3 text-sm font-bold text-slate-800">
                        Enrollment Decision
                      </h4>

                      <label className="block text-xs font-semibold text-slate-600">
                        Enrollment Section

                        <select
                          value={sectionId}
                          onChange={(event) =>
                            setSectionId(
                              event.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="">
                            Use application section
                          </option>

                          {(
                            selectedAdmissionClass?.sections ||
                            []
                          ).map((section) => (
                            <option
                              key={section.id}
                              value={section.id}
                            >
                              {section.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <button
                        type="button"
                        disabled={
                          working ||
                          !selected.studentEmail
                        }
                        onClick={() =>
                          void approveApplication()
                        }
                        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        <CheckCircle2 size={15} />
                        Approve & Enroll Student
                      </button>

                      {/* REJECTION */}

                      <label className="mt-3 block text-xs font-semibold text-slate-600">
                        Rejection Reason

                        <textarea
                          value={rejectReason}
                          onChange={(event) =>
                            setRejectReason(
                              event.target.value,
                            )
                          }
                          rows={2}
                          className="mt-1 w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-red-500"
                          placeholder="Enter reason before rejecting"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={working}
                        onClick={() =>
                          void rejectApplication()
                        }
                        className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={15} />
                        Reject Application
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}