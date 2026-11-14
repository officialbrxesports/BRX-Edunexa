
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  School,
  Layers3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
  BriefcaseBusiness,
  Users,
  ClipboardList,
  FileText,
  Building2,
  Wallet,
  UserPlus,
  Plus,
  ChevronRight,
  Trash2,
  Minus,
  Save,
  Search,
  Pencil,
  Armchair,
  RefreshCw,
} from "lucide-react";

import SubjectManagement from "../../../components/dashboard/SubjectManagement";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import AdmissionManagement from "../../../components/dashboard/AdmissionManagement";
import TeacherManagement from "../../../components/dashboard/TeacherManagement";
import { API_URL } from "../../../lib/api";

/* =====================================================
   TYPES
===================================================== */

type SectionData = {
  id?: string;
  name: string;
  code: string;
  capacity: number;
};

type ApiSection = {
  id: string;
  name: string;
  code: string;
  capacity: number;
};

type ApiClass = {
  id: string;
  name: string;
  code: string;
  sections: ApiSection[];
  totalSeats?: number;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
};

type MessageType = "success" | "error" | "info";

/* =====================================================
   HELPERS
===================================================== */

async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      `Request failed (${response.status})`;

    throw new Error(
      Array.isArray(message) ? message.join(", ") : message,
    );
  }

  return result as T;
}

function getClassList(result: unknown): ApiClass[] {
  if (Array.isArray(result)) return result as ApiClass[];

  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    Array.isArray((result as ApiResponse<ApiClass[]>).data)
  ) {
    return (result as ApiResponse<ApiClass[]>).data!;
  }

  return [];
}

function makeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

/* =====================================================
   SIDEBAR CATEGORIES
===================================================== */

const categories = [
  {
    title: "ACADEMIC MANAGEMENT",
    items: [
      { name: "Class", icon: School },
      { name: "Section", icon: Layers3 },
      { name: "Subject", icon: BookOpen },
      { name: "Academic Session", icon: CalendarDays },
    ],
  },
  {
    title: "PEOPLE MANAGEMENT",
    items: [
      { name: "Admission Form", icon: GraduationCap },
      { name: "Teacher", icon: UserRound },
      { name: "Staff", icon: BriefcaseBusiness },
      { name: "Parent / Guardian", icon: Users },
    ],
  },
  {
    title: "EXAMINATION & LEARNING",
    items: [
      { name: "Exam", icon: ClipboardList },
      { name: "Assignment", icon: FileText },
      { name: "Notice", icon: BookOpen },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { name: "Department", icon: Building2 },
      { name: "Fee Plan", icon: Wallet },
      { name: "Invitation", icon: UserPlus },
    ],
  },
];

/* =====================================================
   MESSAGE
===================================================== */

function Notice({
  message,
  type = "info",
}: {
  message: string;
  type?: MessageType;
}) {
  if (!message) return null;

  const styles: Record<MessageType, string> = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div className={`border p-3 text-sm ${styles[type]}`}>
      {message}
    </div>
  );
}

/* =====================================================
   CLASS FORM
   Creates a class with multiple sections.
===================================================== */

function ClassForm({
  onCreated,
}: {
  onCreated: () => void;
}) {
  const [className, setClassName] = useState("");

  const [sections, setSections] = useState<SectionData[]>([
    { name: "A", code: "", capacity: 40 },
  ]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("info");
  const [saving, setSaving] = useState(false);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const classCode = makeCode(className);

  const updatedSections = sections.map((section) => ({
    ...section,
    code: classCode
      ? `${classCode}-${section.name}`
      : "",
  }));

  const totalSeats = sections.reduce(
    (total, section) => total + section.capacity,
    0,
  );

  function showMessage(text: string, type: MessageType) {
    setMessage(text);
    setMessageType(type);
  }

  function addSection() {
    if (sections.length >= 26) {
      showMessage(
        "Maximum 26 sections are allowed (A to Z).",
        "error",
      );
      return;
    }

    const usedLetters = sections.map(
      (section) => section.name,
    );

    const nextLetter = alphabet.find(
      (letter) => !usedLetters.includes(letter),
    );

    if (!nextLetter) return;

    setSections((current) => [
      ...current,
      {
        name: nextLetter,
        code: "",
        capacity: 40,
      },
    ]);

    setMessage("");
  }

  function updateSection(
    index: number,
    field: "name" | "capacity",
    value: string | number,
  ) {
    setSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index
          ? { ...section, [field]: value }
          : section,
      ),
    );

    setMessage("");
  }

  function removeSection(index: number) {
    if (sections.length <= 1) {
      showMessage(
        "At least one section is required.",
        "error",
      );
      return;
    }

    setSections((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function changeCapacity(index: number, amount: number) {
    setSections((current) =>
      current.map((section, currentIndex) =>
        currentIndex === index
          ? {
              ...section,
              capacity: Math.max(
                1,
                section.capacity + amount,
              ),
            }
          : section,
      ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!className.trim()) {
      showMessage("Please enter a class name.", "error");
      return;
    }

    if (!classCode) {
      showMessage("Please enter a valid class name.", "error");
      return;
    }

    if (sections.some((section) => section.capacity < 1)) {
      showMessage(
        "Every section must have at least one seat.",
        "error",
      );
      return;
    }

    if (
      new Set(sections.map((section) => section.name)).size !==
      sections.length
    ) {
      showMessage(
        "Duplicate section names are not allowed.",
        "error",
      );
      return;
    }

    if (sections.some((section) => !section.name.trim())) {
      showMessage(
        "Every section must have a name.",
        "error",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/academics/classes`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: className.trim(),
            code: classCode,
            sections: updatedSections.map((section) => ({
              name: section.name,
              code: section.code,
              capacity: section.capacity,
            })),
          }),
        },
      );

      await readResponse(response);

      showMessage(
        "Class and sections successfully saved to the database.",
        "success",
      );

      setClassName("");
      setSections([
        { name: "A", code: "", capacity: 40 },
      ]);

      onCreated();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setClassName("");
    setSections([
      { name: "A", code: "", capacity: 40 },
    ]);
    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <section>
        <h3 className="mb-4 text-base font-bold text-slate-900">
          1. Basic Class Details
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Class Name *
            </label>

            <input
              required
              value={className}
              onChange={(event) =>
                setClassName(event.target.value)
              }
              placeholder="Example: Class 10"
              className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Auto Generated Class Code
            </label>

            <input
              readOnly
              value={classCode}
              placeholder="CLASS-10"
              className="w-full border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold text-blue-800 outline-none"
            />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              2. Sections
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Create sections and configure their seat capacity.
            </p>
          </div>

          <button
            type="button"
            onClick={addSection}
            disabled={sections.length >= 26}
            className="flex items-center gap-2 bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Section
          </button>
        </div>

        <div className="space-y-4">
          {updatedSections.map((section, index) => (
            <div
              key={`${section.name}-${index}`}
              className="border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Section {index + 1}
                </h4>

                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Section Name *
                  </label>

                  <select
                    value={section.name}
                    onChange={(event) =>
                      updateSection(
                        index,
                        "name",
                        event.target.value,
                      )
                    }
                    className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600"
                  >
                    {alphabet.map((letter) => {
                      const alreadyUsed = sections.some(
                        (item, itemIndex) =>
                          item.name === letter &&
                          itemIndex !== index,
                      );

                      return (
                        <option
                          key={letter}
                          value={letter}
                          disabled={alreadyUsed}
                        >
                          Section {letter}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Section Code
                  </label>

                  <input
                    readOnly
                    value={section.code}
                    placeholder="CLASS-10-A"
                    className="w-full border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold text-blue-800 outline-none"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-semibold">
                  Seat Capacity *
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changeCapacity(index, -1)}
                    disabled={section.capacity <= 1}
                    className="flex h-10 w-10 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={section.capacity}
                    onChange={(event) =>
                      updateSection(
                        index,
                        "capacity",
                        Math.min(
                          10000,
                          Math.max(
                            1,
                            Number(event.target.value) || 1,
                          ),
                        ),
                      )
                    }
                    className="h-10 w-24 border border-slate-300 bg-white text-center text-sm font-bold outline-none focus:border-blue-600"
                  />

                  <button
                    type="button"
                    onClick={() => changeCapacity(index, 1)}
                    disabled={section.capacity >= 10000}
                    className="flex h-10 w-10 items-center justify-center border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>

                  <span className="text-xs text-slate-500">
                    Seats
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="border border-blue-100 bg-blue-50 p-5">
          <p className="text-xs font-semibold text-blue-700">
            TOTAL SECTIONS
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-900">
            {sections.length}
          </p>
        </div>

        <div className="border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-semibold text-emerald-700">
            TOTAL SEAT CAPACITY
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-900">
            {totalSeats}
          </p>
        </div>
      </div>

      <Notice message={message} type={messageType} />

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={resetForm}
          disabled={saving}
          className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Reset Form
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-800 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Class"}
        </button>
      </div>
    </form>
  );
}

/* =====================================================
   SECTION MANAGEMENT
   Reads and updates real classes and sections.
===================================================== */

function SectionList() {
  const [classes, setClasses] = useState<ApiClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<MessageType>("info");

  const [editingSectionId, setEditingSectionId] =
    useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    capacity: 40,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);

  const selectedClass = classes.find(
    (item) => item.id === selectedClassId,
  );

  const allSections = useMemo(
    () =>
      classes.flatMap((item) =>
        item.sections.map((section) => ({
          ...section,
          classId: item.id,
          className: item.name,
          classCode: item.code,
        })),
      ),
    [classes],
  );

  const visibleSections = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allSections.filter((section) => {
      const matchesClass =
        !selectedClassId ||
        section.classId === selectedClassId;

      const matchesSearch =
        !query ||
        section.name.toLowerCase().includes(query) ||
        section.code.toLowerCase().includes(query) ||
        section.className.toLowerCase().includes(query);

      return matchesClass && matchesSearch;
    });
  }, [allSections, selectedClassId, search]);

  const totalCapacity = allSections.reduce(
    (total, section) => total + section.capacity,
    0,
  );

  const loadClasses = useCallback(async () => {
  setLoading(true);

  try {
    const response = await fetch(
      `${API_URL}/academics/classes`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );

    const result = await readResponse<unknown>(response);
    const list = getClassList(result);

    setClasses(list);

    setSelectedClassId((current) => {
      if (current && list.some((item) => item.id === current)) {
        return current;
      }

      return list[0]?.id ?? "";
    });
  } catch (error) {
    setMessage(getErrorMessage(error));
    setMessageType("error");
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadClasses();
  }, 0);

  return () => window.clearTimeout(timer);
}, [loadClasses]);

  function showMessage(text: string, type: MessageType) {
    setMessage(text);
    setMessageType(type);
  }

  function openAddDrawer() {
    if (!selectedClass) {
      showMessage(
        "Please create a class before adding sections.",
        "error",
      );
      return;
    }

    setEditingSectionId(null);
    setForm({
      name: "",
      capacity: 40,
    });
    setMessage("");
    setDrawerOpen(true);
  }

  function openEditDrawer(section: ApiSection) {
    setEditingSectionId(section.id);
    setForm({
      name: section.name,
      capacity: section.capacity,
    });
    setMessage("");
    setDrawerOpen(true);
  }

  async function saveSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedClass) {
      showMessage("Please select a class.", "error");
      return;
    }

    const sectionName = form.name.trim().toUpperCase();

    if (!sectionName) {
      showMessage("Section name is required.", "error");
      return;
    }

    if (
      !Number.isInteger(form.capacity) ||
      form.capacity < 1 ||
      form.capacity > 10000
    ) {
      showMessage(
        "Capacity must be between 1 and 10000.",
        "error",
      );
      return;
    }

    const duplicate = selectedClass.sections.some(
      (section) =>
        section.name.toLowerCase() === sectionName.toLowerCase() &&
        section.id !== editingSectionId,
    );

    if (duplicate) {
      showMessage(
        "This section name already exists in this class.",
        "error",
      );
      return;
    }

    const sectionCode = `${selectedClass.code}-${makeCode(sectionName)}`;

    const updatedSections = editingSectionId
      ? selectedClass.sections.map((section) =>
          section.id === editingSectionId
            ? {
                id: section.id,
                name: sectionName,
                code: sectionCode,
                capacity: form.capacity,
              }
            : {
                id: section.id,
                name: section.name,
                code: section.code,
                capacity: section.capacity,
              },
        )
      : [
          ...selectedClass.sections.map((section) => ({
            id: section.id,
            name: section.name,
            code: section.code,
            capacity: section.capacity,
          })),
          {
            name: sectionName,
            code: sectionCode,
            capacity: form.capacity,
          },
        ];

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/academics/classes/${selectedClass.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: selectedClass.name,
            code: selectedClass.code,
            sections: updatedSections,
          }),
        },
      );

      await readResponse(response);

      setDrawerOpen(false);

      showMessage(
        editingSectionId
          ? "Section successfully updated."
          : "New section successfully created.",
        "success",
      );

      await loadClasses();
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Classes"
          value={classes.length}
          icon={<School size={21} />}
        />

        <SummaryCard
          title="Total Sections"
          value={allSections.length}
          icon={<Layers3 size={21} />}
        />

        <SummaryCard
          title="Total Seat Capacity"
          value={totalCapacity}
          icon={<Armchair size={21} />}
        />
      </div>

      <Notice message={message} type={messageType} />

      <section className="border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">
              Section Management
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Manage sections and their seat capacities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadClasses()}
            disabled={loading}
            className="flex items-center gap-2 border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Select Class
            </label>

            <select
              value={selectedClassId}
              onChange={(event) =>
                setSelectedClassId(event.target.value)
              }
              disabled={loading || classes.length === 0}
              className="w-full border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-600"
            >
              {classes.length === 0 && (
                <option value="">No classes available</option>
              )}

              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Search
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search section or code..."
                className="w-full border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">
              All Sections
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {visibleSections.length} sections found
            </p>
          </div>

          <button
            type="button"
            onClick={openAddDrawer}
            disabled={!selectedClass || loading}
            className="flex items-center gap-2 bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Section
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading sections...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Section</th>
                  <th className="px-5 py-4">Section Code</th>
                  <th className="px-5 py-4">Capacity</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleSections.map((section) => (
                  <tr key={section.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {section.className}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex h-8 w-8 items-center justify-center bg-blue-50 font-bold text-blue-800">
                        {section.name}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-600">
                      {section.code}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2">
                        <Armchair size={16} className="text-slate-400" />
                        {section.capacity} seats
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(section)}
                          title="Edit section"
                          className="flex items-center gap-2 border border-slate-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil size={15} />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {visibleSections.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500"
                    >
                      {classes.length === 0
                        ? "No classes found. Create a class first."
                        : "No sections found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            type="button"
            aria-label="Close drawer"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingSectionId
                      ? "Edit Section"
                      : "Add New Section"}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedClass?.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="border border-slate-200 px-3 py-2 text-sm text-slate-600"
                >
                  Close
                </button>
              </div>
            </div>

            <form
              onSubmit={saveSection}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Section Name *
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Example: A"
                    className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Generated Section Code
                  </label>

                  <input
                    readOnly
                    value={
                      selectedClass && form.name.trim()
                        ? `${selectedClass.code}-${makeCode(form.name)}`
                        : ""
                    }
                    className="w-full border border-slate-200 bg-slate-100 px-3 py-3 text-sm font-semibold text-blue-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Seat Capacity *
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          capacity: Math.max(
                            1,
                            current.capacity - 1,
                          ),
                        }))
                      }
                      disabled={form.capacity <= 1}
                      className="flex h-11 w-11 items-center justify-center border border-slate-300 disabled:opacity-40"
                    >
                      <Minus size={16} />
                    </button>

                    <input
                      type="number"
                      min="1"
                      max="10000"
                      required
                      value={form.capacity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          capacity: Math.min(
                            10000,
                            Math.max(
                              1,
                              Number(event.target.value) || 1,
                            ),
                          ),
                        }))
                      }
                      className="h-11 w-28 border border-slate-300 text-center font-bold outline-none focus:border-blue-600"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          capacity: Math.min(
                            10000,
                            current.capacity + 1,
                          ),
                        }))
                      }
                      disabled={form.capacity >= 10000}
                      className="flex h-11 w-11 items-center justify-center border border-slate-300 disabled:opacity-40"
                    >
                      <Plus size={17} />
                    </button>

                    <span className="text-xs text-slate-500">
                      Seats
                    </span>
                  </div>
                </div>

                <Notice
                  message="Capacity changes are saved to the class record. The backend must protect occupied seats before allowing capacity to be reduced."
                  type="info"
                />

                <Notice
                  message={message}
                  type={messageType}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  disabled={saving}
                  className="border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-800 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving
                    ? "Saving..."
                    : editingSectionId
                      ? "Update Section"
                      : "Create Section"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}


/* =====================================================
   REUSABLE COMPONENTS
===================================================== */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border border-slate-200 bg-white p-5">
      <div>
        <p className="text-xs font-semibold text-slate-500">
          {title}
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {value.toLocaleString()}
        </p>
      </div>

      <div className="bg-blue-50 p-3 text-blue-800">
        {icon}
      </div>
    </div>
  );
}

/* =====================================================
   ADD HUB
===================================================== */

function AddHubContent() {
  const [selected, setSelected] = useState("Class");
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedItem = categories
    .flatMap((category) => category.items)
    .find((item) => item.name === selected);

  const SelectedIcon = selectedItem?.icon ?? Plus;

  function refreshClasses() {
    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="flex h-[calc(100dvh-58px)] min-h-0 flex-col overflow-hidden bg-slate-50">
      <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-blue-800"
        >
          <ArrowLeft size={18} />
          Dashboard
        </Link>

        <span className="mx-3 text-slate-300">/</span>

        <h1 className="text-sm font-bold text-slate-900">
          Create Hub
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 sm:gap-5 sm:p-5">
        <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden border border-slate-200 bg-white sm:w-72">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <h2 className="text-lg font-bold text-slate-900">
              Create New
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select a module to continue.
            </p>
          </div>

          <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
            {categories.map((category) => (
              <div key={category.title}>
                <h3 className="mb-2 px-2 text-[10px] font-bold tracking-wider text-slate-400">
                  {category.title}
                </h3>

                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const active = selected === item.name;

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelected(item.name)}
                        className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition ${
                          active
                            ? "bg-blue-50 font-semibold text-blue-800"
                            : "text-slate-600 hover:bg-slate-50 hover:text-blue-800"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={18} />
                          {item.name}
                        </span>

                        {active && <ChevronRight size={16} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border border-slate-200 bg-white">
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
            <div className="bg-blue-50 p-3 text-blue-800">
              <SelectedIcon size={25} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {selected === "Admission Form"
                  ? "Admission Management"
                  : selected === "Teacher"
                    ? "Teacher Management"
                  : selected === "Staff"
                    ? "Staff Management"
                  : selected === "Section"
                    ? "Section Management"
                    : `Create ${selected}`}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                BRX EduNexa · {selected} Management
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
            {selected === "Admission Form" ? (
              <AdmissionManagement />
            ) : selected === "Class" ? (
              <ClassForm
                key={`class-${refreshKey}`}
                onCreated={refreshClasses}
              />
            ) : selected === "Section" ? (
              <SectionList key={`sections-${refreshKey}`} />
            ) : selected === "Subject" ? (
              <SubjectManagement />
            ) : selected === "Teacher" ? (
              <TeacherManagement key="teacher" kind="teacher" />
            ) : selected === "Staff" ? (
              <TeacherManagement key="staff" kind="staff" />
            ) : (
              <div className="flex min-h-full flex-col items-center justify-center text-center">
                <SelectedIcon
                  size={38}
                  className="text-slate-400"
                />

                <h3 className="mt-5 text-lg font-bold text-slate-800">
                  {selected} Creation
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  The {selected.toLowerCase()} form will be developed next.
                </p>

                <span className="mt-4 border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                  Form implementation pending
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =====================================================
   PAGE EXPORT
===================================================== */

export default function AddPage() {
  return (
    <DashboardAuth>
      <AddHubContent />
    </DashboardAuth>
  );
}
