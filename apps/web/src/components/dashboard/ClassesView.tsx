
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Armchair,
  RefreshCw,
  School,
  Users,
  UserRound,
  Search,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react";

import { API_URL } from "../../lib/api";

/* =====================================================
   TYPES
===================================================== */

type SeatStudent = {
  id: string;
  name: string;
  brxUid: string;
  email: string;
};

type Seat = {
  seatNumber: number;
  occupied: boolean;
  student: SeatStudent | null;
};

type SeatingSection = {
  id: string;
  name: string;
  code: string;
  capacity: number;
  enrolledCount: number;
  availableSeats: number;
  overflowCount: number;
  seats: Seat[];
};

type SeatingClass = {
  id: string;
  name: string;
  code: string;
  totalSeats: number;
  sections: SeatingSection[];
};

/* =====================================================
   HELPERS
===================================================== */

function getInitials(name?: string) {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load seating information.";
}

async function readSeatingResponse(
  response: Response,
): Promise<SeatingClass[]> {
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      result?.message ||
      result?.error ||
      `Request failed (${response.status})`;

    throw new Error(
      Array.isArray(message) ? message.join(", ") : message,
    );
  }

  const data = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : [];

  return data as SeatingClass[];
}

/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div className="bg-blue-50 p-3 text-blue-800">
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   SEAT TILE
===================================================== */

function SeatTile({ seat }: { seat: Seat }) {
  const student = seat.student;

  return (
    <div
      title={
        student
          ? `${student.name}\n${student.brxUid}\n${student.email}`
          : `Seat ${seat.seatNumber} - Available`
      }
      className={`min-w-0 border p-2 text-center transition ${
        seat.occupied
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      <div className="mb-2 flex justify-center">
        {student ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {getInitials(student.name)}
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400">
            <UserRound size={20} />
          </div>
        )}
      </div>

      <p className="text-[11px] font-bold text-slate-700">
        Seat {seat.seatNumber}
      </p>

      {student ? (
        <>
          <p className="mt-1 truncate text-[10px] font-semibold text-emerald-800">
            {student.name || "Student"}
          </p>
          <p className="mt-0.5 truncate text-[9px] text-slate-500">
            {student.brxUid}
          </p>
        </>
      ) : (
        <p className="mt-1 text-[10px] text-slate-400">
          Available
        </p>
      )}
    </div>
  );
}

/* =====================================================
   SECTION SEATING LAYOUT
===================================================== */

function SectionSeating({
  section,
}: {
  section: SeatingSection;
}) {
  const seats = Array.isArray(section.seats)
    ? section.seats
    : [];

  const occupiedSeats = seats.filter(
    (seat) => seat.occupied,
  ).length;

  return (
    <section className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
        <div>
          <h3 className="font-bold text-slate-900">
            Section {section.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Code: {section.code}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">
            {occupiedSeats} / {section.capacity}
          </p>
          <p className="text-xs text-slate-500">
            Seats occupied
          </p>
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50 p-3">
        <div className="flex items-center justify-center gap-2 border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          <School size={15} />
          Classroom Front
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {seats.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {seats.map((seat) => (
              <SeatTile
                key={`${section.id}-${seat.seatNumber}`}
                seat={seat}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            No seats available in this section.
          </div>
        )}

        {section.overflowCount > 0 && (
          <div className="mt-4 flex items-start gap-2 border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle size={16} className="shrink-0" />
            {section.overflowCount} student(s) exceed the configured seat capacity. Please review enrollment records.
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-3 text-xs">
        <span className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 size={15} />
          Occupied: {occupiedSeats}
        </span>

        <span className="flex items-center gap-2 text-slate-500">
          <Circle size={15} />
          Available: {Math.max(section.capacity - occupiedSeats, 0)}
        </span>

        <span className="ml-auto text-slate-500">
          Capacity: {section.capacity}
        </span>
      </div>
    </section>
  );
}


/* =====================================================
   CLASSES VIEW (embedded in the school dashboard)
===================================================== */

export default function ClassesView({
  refreshSignal = 0,
}: {
  refreshSignal?: number;
}) {
  const [classes, setClasses] = useState<SeatingClass[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSeating = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/academics/classes/seating`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      setClasses(await readSeatingResponse(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSeating();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSeating, refreshSignal]);

  const totals = useMemo(() => {
    const result = { capacity: 0, occupied: 0, overflow: 0, sections: 0 };

    for (const classItem of classes) {
      for (const section of classItem.sections ?? []) {
        const occupiedSeats = (section.seats ?? []).filter(
          (seat) => seat.occupied,
        ).length;

        result.capacity += section.capacity || 0;
        result.occupied += occupiedSeats;
        result.overflow += section.overflowCount || 0;
        result.sections += 1;
      }
    }

    return result;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return classes;

    return classes.filter(
      (classItem) =>
        classItem.name.toLowerCase().includes(query) ||
        classItem.code.toLowerCase().includes(query) ||
        classItem.sections?.some(
          (section) =>
            section.name.toLowerCase().includes(query) ||
            section.code.toLowerCase().includes(query),
        ),
    );
  }, [classes, search]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Classes"
          value={classes.length}
          description="Created classes"
          icon={<School size={22} />}
        />
        <SummaryCard
          title="Total Sections"
          value={totals.sections}
          description="Sections across classes"
          icon={<Armchair size={22} />}
        />
        <SummaryCard
          title="Occupied Seats"
          value={totals.occupied}
          description={
            totals.overflow > 0
              ? `${totals.overflow} over capacity`
              : "Enrolled students"
          }
          icon={<Users size={22} />}
        />
        <SummaryCard
          title="Available Seats"
          value={Math.max(totals.capacity - totals.occupied, 0)}
          description="Remaining capacity"
          icon={<Circle size={22} />}
        />
      </div>

      <section className="flex flex-col gap-3 border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">Classroom Layouts</h3>
          <p className="mt-1 text-xs text-slate-500">
            View only. Create or edit classes and sections from Add.
          </p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search classes or sections..."
            className="w-full border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-600"
          />
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Could not load seating data</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void loadSeating()}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="border border-slate-200 bg-white p-12 text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-blue-700" />
          <p className="mt-4 text-sm text-slate-500">
            Loading classroom seating...
          </p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="border border-slate-200 bg-white px-5 py-16 text-center">
          <School size={38} className="mx-auto text-slate-300" />
          <h3 className="mt-4 font-bold text-slate-800">
            {search ? "No matching classes found" : "No classes created yet"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {search
              ? "Try another class name, section name or code."
              : "Create your first class and its sections from the Add area."}
          </p>
          {!search && (
            <Link
              href="/dashboard/add"
              className="mt-5 inline-flex items-center gap-2 bg-blue-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
            >
              Go to Add
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-7">
          {filteredClasses.map((classItem) => {
            const sections = classItem.sections ?? [];
            const classCapacity = sections.reduce(
              (sum, section) => sum + (section.capacity || 0),
              0,
            );
            const classOccupied = sections.reduce(
              (sum, section) =>
                sum + (section.seats ?? []).filter((seat) => seat.occupied).length,
              0,
            );

            return (
              <section
                key={classItem.id}
                className="overflow-hidden border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-3 text-blue-800">
                      <School size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {classItem.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Class Code: {classItem.code}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="border border-slate-200 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                      {sections.length} Sections
                    </span>
                    <span className="border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
                      {classOccupied} / {classCapacity} Occupied
                    </span>
                  </div>
                </div>

                <div className="space-y-5 bg-slate-50 p-4 sm:p-5">
                  {sections.map((section) => (
                    <SectionSeating key={section.id} section={section} />
                  ))}

                  {sections.length === 0 && (
                    <p className="border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                      No sections found in this class.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-5 border border-slate-200 bg-white p-4 text-xs text-slate-600">
        <span className="font-bold text-slate-800">Seat Legend:</span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-600" />
          Occupied
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          Available
        </span>
      </div>
    </div>
  );
}
