"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
};

type ClassItem = {
  id: string;
  name: string;
  code: string;
};

type Section = {
  id: string;
  name: string;
  code: string;
};

type Fee = {
  id: string;
  totalAmount: string | number;
  paidAmount: string | number;
  dueAmount: string | number;
  dueDate: string;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
  student: {
    id: string;
    firstName: string;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  class: {
    id: string;
    name: string;
    code: string;
  };
  section: {
    id: string;
    name: string;
    code: string;
  };
};

type FeePlan = {
  id: string;
  classId: string;
  sectionId?: string | null;
  name: string;
  description?: string | null;
  amount: string | number;
  frequency:
    | "ONE_TIME"
    | "MONTHLY"
    | "QUARTERLY"
    | "HALF_YEARLY"
    | "YEARLY"
    | "CUSTOM";
  customDays?: number | null;
  dueDay?: number | null;
  lateFeeType: "NONE" | "FIXED" | "DAILY" | "PERCENTAGE";
  lateFeeAmount: string | number;
  discountAllowed: boolean;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  class: ClassItem;
  section?: Section | null;
};

type Summary = {
  totalRecords: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  pendingCount: number;
  partialCount: number;
  paidCount: number;
  overdueCount: number;
};

const API_URL = "http://localhost:3000";

function money(value: string | number) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function frequencyLabel(frequency: FeePlan["frequency"]) {
  const labels: Record<FeePlan["frequency"], string> = {
    ONE_TIME: "One Time",
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
    CUSTOM: "Custom",
  };

  return labels[frequency];
}

function statusClass(status: Fee["status"]) {
  if (status === "PAID") {
    return "bg-green-100 text-green-700";
  }

  if (status === "PARTIAL") {
    return "bg-yellow-100 text-yellow-700";
  }

  if (status === "OVERDUE") {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

function planStatusClass(isActive: boolean) {
  return isActive
    ? "bg-green-100 text-green-700"
    : "bg-slate-100 text-slate-600";
}

export default function FeesPage() {
  const [token, setToken] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);

  const [summary, setSummary] = useState<Summary>({
    totalRecords: 0,
    totalAmount: 0,
    paidAmount: 0,
    dueAmount: 0,
    pendingCount: 0,
    partialCount: 0,
    paidCount: 0,
    overdueCount: 0,
  });

  // Fee record form
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Fee plan form
  const [planClassId, setPlanClassId] = useState("");
  const [planSectionId, setPlanSectionId] = useState("");
  const [planSections, setPlanSections] = useState<Section[]>([]);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planAmount, setPlanAmount] = useState("");
  const [planFrequency, setPlanFrequency] =
    useState<FeePlan["frequency"]>("MONTHLY");
  const [planCustomDays, setPlanCustomDays] = useState("");
  const [planDueDay, setPlanDueDay] = useState("");
  const [planLateFeeType, setPlanLateFeeType] =
    useState<FeePlan["lateFeeType"]>("NONE");
  const [planLateFeeAmount, setPlanLateFeeAmount] = useState("");
  const [planDiscountAllowed, setPlanDiscountAllowed] =
    useState(false);
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [message, setMessage] = useState("");

              // Generate fees form
  const [generateClassId, setGenerateClassId] = useState("");
  const [generateSectionId, setGenerateSectionId] = useState("");
  const [generateSections, setGenerateSections] = useState<Section[]>([]);
  const [generateDueDate, setGenerateDueDate] = useState("");
  const [generatingFees, setGeneratingFees] = useState(false);

  async function apiFetch(
    path: string,
    options: RequestInit = {},
  ) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Something went wrong",
      );
    }

    return data;
  }

  async function loadStudents() {
    const data = await apiFetch("/users");

    const onlyStudents = data.filter(
      (user: Student & { role?: string }) =>
        user.role === "STUDENT",
    );

    setStudents(onlyStudents);
  }

  async function loadClasses() {
    const data = await apiFetch("/academics/classes");
    setClasses(data);
  }

  async function loadFees() {
    const data = await apiFetch("/academics/fees");
    setFees(data);
  }

  async function loadSummary() {
    const data = await apiFetch("/academics/fees/summary");
    setSummary(data);
  }

  async function loadFeePlans() {
    const data = await apiFetch("/academics/fees/plans");

    setFeePlans(
      Array.isArray(data)
        ? data
        : data
          ? [data]
          : [],
    );
  }

  async function loadInitialData() {
    try {
      setLoading(true);
      setMessage("");

      await Promise.all([
        loadStudents(),
        loadClasses(),
        loadFees(),
        loadSummary(),
        loadFeePlans(),
      ]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load fee data",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadSections(selectedClassId: string) {
    setSectionId("");
    setSections([]);

    if (!selectedClassId) {
      return;
    }

    try {
      const data = await apiFetch(
        `/academics/classes/${selectedClassId}/sections`,
      );

      setSections(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load sections",
      );
    }
  }

  async function loadPlanSections(selectedClassId: string) {
    setPlanSectionId("");
    setPlanSections([]);

    if (!selectedClassId) {
      return;
    }

    try {
      const data = await apiFetch(
        `/academics/classes/${selectedClassId}/sections`,
      );

      setPlanSections(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to load plan sections",
      );
    }
  }

  async function loadGenerateSections(selectedClassId: string) {
  setGenerateSectionId("");
  setGenerateSections([]);

  if (!selectedClassId) {
    return;
  }

  try {
    const data = await apiFetch(
      `/academics/classes/${selectedClassId}/sections`,
    );

    setGenerateSections(data);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Failed to load sections",
    );
  }
}

async function generateFees() {
  if (!generateClassId || !generateDueDate) {
    setMessage(
      "Please select a class and due date.",
    );
    return;
  }

  if (feePlans.length === 0) {
    setMessage(
      "No fee plan is available. Create a fee plan first.",
    );
    return;
  }

    const matchingPlans = feePlans.filter(
      (plan) =>
        plan.classId === generateClassId &&
        plan.isActive &&
        (!generateSectionId ||
          !plan.sectionId ||
          plan.sectionId === generateSectionId),
    );

  if (matchingPlans.length === 0) {
    setMessage(
      "No active fee plan found for the selected class/section.",
    );
    return;
  }

  const selectedPlan =
    matchingPlans.find(
      (plan) =>
        generateSectionId &&
        plan.sectionId === generateSectionId,
    ) ??
    matchingPlans.find(
      (plan) => !plan.sectionId,
    ) ??
    matchingPlans[0];

  try {
    setGeneratingFees(true);
    setMessage("");

    const result = await apiFetch(
      "/academics/fees/generate",
      {
        method: "POST",
        body: JSON.stringify({
          feePlanId: selectedPlan.id,
          sectionId: generateSectionId || undefined,
          dueDate: new Date(
            `${generateDueDate}T00:00:00`,
          ).toISOString(),
        }),
      },
    );

    setMessage(
      `Fees generated successfully. Created: ${result.created}, Skipped: ${result.skipped}.`,
    );

    await Promise.all([
      loadFees(),
      loadSummary(),
    ]);
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Failed to generate fees",
    );
  } finally {
    setGeneratingFees(false);
  }
}

  async function createFee(event: FormEvent) {
    event.preventDefault();

    if (
      !studentId ||
      !classId ||
      !sectionId ||
      !totalAmount ||
      !dueDate
    ) {
      setMessage("Please fill all required fee fields.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await apiFetch("/academics/fees", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          classId,
          sectionId,
          totalAmount: Number(totalAmount),
          dueDate,
        }),
      });

      setMessage("Fee record created successfully.");

      setStudentId("");
      setClassId("");
      setSectionId("");
      setSections([]);
      setTotalAmount("");
      setDueDate("");

      await Promise.all([
        loadFees(),
        loadSummary(),
      ]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create fee",
      );
    } finally {
      setSaving(false);
    }
  }

  async function createFeePlan(event: FormEvent) {
    event.preventDefault();

    if (
      !planClassId ||
      !planName ||
      !planAmount ||
      !planStartDate ||
      !planLateFeeType
    ) {
      setMessage(
        "Please fill all required fee plan fields.",
      );
      return;
    }

    if (
      planFrequency === "CUSTOM" &&
      !planCustomDays
    ) {
      setMessage(
        "Custom days are required for CUSTOM frequency.",
      );
      return;
    }

    try {
      setSavingPlan(true);
      setMessage("");

      const body: Record<string, unknown> = {
        classId: planClassId,
        name: planName,
        description: planDescription || undefined,
        amount: Number(planAmount),
        frequency: planFrequency,
        customDays:
          planFrequency === "CUSTOM"
            ? Number(planCustomDays)
            : undefined,
        dueDay: planDueDay
          ? Number(planDueDay)
          : undefined,
        lateFeeType: planLateFeeType,
        lateFeeAmount: planLateFeeAmount
          ? Number(planLateFeeAmount)
          : undefined,
        discountAllowed: planDiscountAllowed,
        startDate: new Date(
          `${planStartDate}T00:00:00`,
        ).toISOString(),
        endDate: planEndDate
          ? new Date(
              `${planEndDate}T00:00:00`,
            ).toISOString()
          : undefined,
      };

      if (planSectionId) {
        body.sectionId = planSectionId;
      }

      await apiFetch("/academics/fees/plans", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setMessage(
        "Fee plan created successfully.",
      );

      setPlanClassId("");
      setPlanSectionId("");
      setPlanSections([]);
      setPlanName("");
      setPlanDescription("");
      setPlanAmount("");
      setPlanFrequency("MONTHLY");
      setPlanCustomDays("");
      setPlanDueDay("");
      setPlanLateFeeType("NONE");
      setPlanLateFeeAmount("");
      setPlanDiscountAllowed(false);
      setPlanStartDate("");
      setPlanEndDate("");

      await loadFeePlans();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to create fee plan",
      );
    } finally {
      setSavingPlan(false);
    }
  }

  useEffect(() => {
    const savedToken =
      localStorage.getItem("brx_access_token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    loadInitialData();
  }, [token]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300">
                BRX EduNexa
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                Fees Management
              </h1>

              <p className="mt-2 text-sm text-slate-300">
                Manage fee plans, student fees,
                payments and outstanding dues.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/fees/payments"
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-700"
              >
                Payments
              </Link>

              <Link
                href="/fees/history"
                className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20"
              >
                History
              </Link>

              <Link
                href="/fees/reports"
                className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-700"
              >
                📊 Reports
              </Link>
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-800">
            {message}
          </div>
        )}

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Fee
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {money(summary.totalAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {summary.totalRecords} fee records
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Paid
            </p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {money(summary.paidAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {summary.paidCount} fully paid
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Due
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {money(summary.dueAmount)}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Pending + partial
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Overdue
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {summary.overdueCount}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Records overdue
            </p>
          </div>
        </section>

        {/* GENERATE FEES */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-emerald-600">
              BULK FEE GENERATION
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Generate Student Fees
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Generate fees automatically for all enrolled students
              using an active fee plan.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class *
              </label>

              <select
                value={generateClassId}
                onChange={(event) => {
                  const value = event.target.value;

                  setGenerateClassId(value);
                  loadGenerateSections(value);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Section
              </label>

              <select
                value={generateSectionId}
                onChange={(event) =>
                  setGenerateSectionId(event.target.value)
                }
                disabled={!generateClassId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-emerald-500"
              >
                <option value="">
                  All sections
                </option>

                {generateSections.map((section) => (
                  <option
                    key={section.id}
                    value={section.id}
                  >
                    {section.name} ({section.code})
                  </option>
                ))}
              </select>
            </div>

            {/* DUE DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Date *
              </label>

              <input
                type="date"
                value={generateDueDate}
                onChange={(event) =>
                  setGenerateDueDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* BUTTON */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={generateFees}
                disabled={
                  generatingFees ||
                  !generateClassId ||
                  !generateDueDate
                }
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingFees
                  ? "Generating..."
                  : "Generate Fees"}
              </button>
            </div>
          </div>

          {/* INFO */}
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">
              How it works
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              The system uses the active fee plan for the selected
              class and creates fee records for enrolled students.
              Existing duplicate fees are skipped automatically.
            </p>
          </div>
        </section>

        {/* FEE PLANS */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600">
              FEE PLANS
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Class-wise Fee Plans
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure one-time or recurring fees for
              classes and sections.
            </p>
          </div>

          <form
            onSubmit={createFeePlan}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class *
              </label>

              <select
                value={planClassId}
                onChange={(event) => {
                  const value = event.target.value;

                  setPlanClassId(value);
                  loadPlanSections(value);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Section
              </label>

              <select
                value={planSectionId}
                onChange={(event) =>
                  setPlanSectionId(
                    event.target.value,
                  )
                }
                disabled={!planClassId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-blue-500"
              >
                <option value="">
                  All sections
                </option>

                {planSections.map((section) => (
                  <option
                    key={section.id}
                    value={section.id}
                  >
                    {section.name} ({section.code})
                  </option>
                ))}
              </select>
            </div>

            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Plan Name *
              </label>

              <input
                value={planName}
                onChange={(event) =>
                  setPlanName(event.target.value)
                }
                placeholder="Class 10 Monthly Fee"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <input
                value={planDescription}
                onChange={(event) =>
                  setPlanDescription(
                    event.target.value,
                  )
                }
                placeholder="Monthly tuition fee"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Amount *
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={planAmount}
                onChange={(event) =>
                  setPlanAmount(event.target.value)
                }
                placeholder="1000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* FREQUENCY */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Frequency *
              </label>

              <select
                value={planFrequency}
                onChange={(event) =>
                  setPlanFrequency(
                    event.target
                      .value as FeePlan["frequency"],
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="ONE_TIME">
                  One Time
                </option>

                <option value="MONTHLY">
                  Monthly
                </option>

                <option value="QUARTERLY">
                  Quarterly
                </option>

                <option value="HALF_YEARLY">
                  Half Yearly
                </option>

                <option value="YEARLY">
                  Yearly
                </option>

                <option value="CUSTOM">
                  Custom
                </option>
              </select>
            </div>

            {/* CUSTOM DAYS */}
            {planFrequency === "CUSTOM" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Custom Days *
                </label>

                <input
                  type="number"
                  min="1"
                  value={planCustomDays}
                  onChange={(event) =>
                    setPlanCustomDays(
                      event.target.value,
                    )
                  }
                  placeholder="30"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* DUE DAY */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Day
              </label>

              <input
                type="number"
                min="1"
                max="31"
                value={planDueDay}
                onChange={(event) =>
                  setPlanDueDay(event.target.value)
                }
                placeholder="10"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* LATE FEE TYPE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Late Fee Type
              </label>

              <select
                value={planLateFeeType}
                onChange={(event) =>
                  setPlanLateFeeType(
                    event.target
                      .value as FeePlan["lateFeeType"],
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="NONE">
                  No Late Fee
                </option>

                <option value="FIXED">
                  Fixed
                </option>

                <option value="DAILY">
                  Daily
                </option>

                <option value="PERCENTAGE">
                  Percentage
                </option>
              </select>
            </div>

            {/* LATE FEE */}
            {planLateFeeType !== "NONE" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Late Fee Amount
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planLateFeeAmount}
                  onChange={(event) =>
                    setPlanLateFeeAmount(
                      event.target.value,
                    )
                  }
                  placeholder="50"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* START DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Start Date *
              </label>

              <input
                type="date"
                value={planStartDate}
                onChange={(event) =>
                  setPlanStartDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* END DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                End Date
              </label>

              <input
                type="date"
                value={planEndDate}
                onChange={(event) =>
                  setPlanEndDate(
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* DISCOUNT */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                id="discountAllowed"
                type="checkbox"
                checked={planDiscountAllowed}
                onChange={(event) =>
                  setPlanDiscountAllowed(
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              <label
                htmlFor="discountAllowed"
                className="text-sm font-semibold text-slate-700"
              >
                Allow discount
              </label>
            </div>

            {/* SUBMIT */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={savingPlan}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPlan
                  ? "Creating Plan..."
                  : "Create Fee Plan"}
              </button>
            </div>
          </form>

          {/* PLAN LIST */}
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Existing Fee Plans
                </h3>

                <p className="text-sm text-slate-500">
                  {feePlans.length} plan
                  {feePlans.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={loadFeePlans}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>

            {feePlans.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-700">
                  No fee plans found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a fee plan above.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {feePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                          {plan.class.name}
                        </p>

                        <h4 className="mt-1 text-lg font-bold text-slate-900">
                          {plan.name}
                        </h4>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${planStatusClass(
                          plan.isActive,
                        )}`}
                      >
                        {plan.isActive
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Amount
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {money(plan.amount)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">
                          Frequency
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {frequencyLabel(
                            plan.frequency,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Section
                        </span>

                        <span className="font-semibold text-slate-800">
                          {plan.section?.name ||
                            "All sections"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Due day
                        </span>

                        <span className="font-semibold text-slate-800">
                          {plan.dueDay
                            ? `Day ${plan.dueDay}`
                            : "—"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Late fee
                        </span>

                        <span className="font-semibold text-slate-800">
                          {plan.lateFeeType ===
                          "NONE"
                            ? "None"
                            : `${plan.lateFeeType} · ${money(
                                plan.lateFeeAmount,
                              )}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Discount
                        </span>

                        <span className="font-semibold text-slate-800">
                          {plan.discountAllowed
                            ? "Allowed"
                            : "Not allowed"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-500">
                          Start
                        </span>

                        <span className="font-semibold text-slate-800">
                          {formatDate(
                            plan.startDate,
                          )}
                        </span>
                      </div>
                    </div>

                    {plan.description && (
                      <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                        {plan.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* STATUS */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 p-5">
            <p className="text-sm font-medium text-blue-700">
              Pending
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-900">
              {summary.pendingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-yellow-50 p-5">
            <p className="text-sm font-medium text-yellow-700">
              Partial
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-900">
              {summary.partialCount}
            </p>
          </div>

          <div className="rounded-2xl bg-green-50 p-5">
            <p className="text-sm font-medium text-green-700">
              Paid
            </p>

            <p className="mt-1 text-2xl font-bold text-green-900">
              {summary.paidCount}
            </p>
          </div>
        </section>

        {/* CREATE FEE RECORD */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <p className="text-sm font-semibold text-blue-600">
              FEE RECORD
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Create Student Fee
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add an individual fee record for an enrolled
              student.
            </p>
          </div>

          <form
            onSubmit={createFee}
            className="grid gap-5 md:grid-cols-2"
          >
            {/* STUDENT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Student
              </label>

              <select
                value={studentId}
                onChange={(event) =>
                  setStudentId(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select student
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.firstName}{" "}
                    {student.lastName || ""} —{" "}
                    {student.email}
                  </option>
                ))}
              </select>
            </div>

            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Class
              </label>

              <select
                value={classId}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  setClassId(value);
                  loadSections(value);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  Select class
                </option>

                {classes.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Section
              </label>

              <select
                value={sectionId}
                onChange={(event) =>
                  setSectionId(
                    event.target.value,
                  )
                }
                disabled={!classId}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100 focus:border-blue-500"
              >
                <option value="">
                  Select section
                </option>

                {sections.map((section) => (
                  <option
                    key={section.id}
                    value={section.id}
                  >
                    {section.name} ({section.code})
                  </option>
                ))}
              </select>
            </div>

            {/* AMOUNT */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Total Fee
              </label>

              <input
                type="number"
                min="1"
                step="0.01"
                value={totalAmount}
                onChange={(event) =>
                  setTotalAmount(
                    event.target.value,
                  )
                }
                placeholder="5000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* DUE DATE */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Due Date
              </label>

              <input
                type="date"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* SUBMIT */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Fee"}
              </button>
            </div>
          </form>
        </section>

        {/* FEE TABLE */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                FEE RECORDS
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Student Fees
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                All fee records for your institution.
              </p>
            </div>

            <button
              onClick={loadInitialData}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Loading fee records...
            </div>
          ) : fees.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <p className="font-semibold text-slate-700">
                No fee records found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create your first fee record above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="px-4 py-3">
                      Student
                    </th>

                    <th className="px-4 py-3">
                      Class
                    </th>

                    <th className="px-4 py-3">
                      Total
                    </th>

                    <th className="px-4 py-3">
                      Paid
                    </th>

                    <th className="px-4 py-3">
                      Due
                    </th>

                    <th className="px-4 py-3">
                      Due Date
                    </th>

                    <th className="px-4 py-3">
                      Status
                    </th>

                    <th className="px-4 py-3">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {fees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {fee.student.firstName}{" "}
                          {fee.student.lastName || ""}
                        </p>

                        <p className="text-xs text-slate-500">
                          {fee.student.email}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {fee.class.name} -{" "}
                        {fee.section.name}
                      </td>

                      <td className="px-4 py-4 font-semibold">
                        {money(fee.totalAmount)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-green-600">
                        {money(fee.paidAmount)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-orange-600">
                        {money(fee.dueAmount)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-600">
                        {formatDate(fee.dueDate)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(
                            fee.status,
                          )}`}
                        >
                          {fee.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <Link
                          href={`/fees/payments?feeId=${fee.id}`}
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          Payment
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}