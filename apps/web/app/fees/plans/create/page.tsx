"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

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

type Frequency =
  | "ONE_TIME"
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "YEARLY"
  | "CUSTOM";

type LateFeeType =
  | "NONE"
  | "FIXED"
  | "DAILY"
  | "PERCENTAGE";

export default function CreateFeePlanPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] =
    useState<Frequency>("MONTHLY");

  const [customDays, setCustomDays] = useState("");
  const [dueDay, setDueDay] = useState("");

  const [lateFeeType, setLateFeeType] =
    useState<LateFeeType>("NONE");

  const [lateFeeAmount, setLateFeeAmount] = useState("");
  const [discountAllowed, setDiscountAllowed] =
    useState(false);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadClasses() {
    try {
      setLoadingClasses(true);

      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/academics/classes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load classes");
      }

      const data = await response.json();

      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Classes load nahi ho paaye.");
    } finally {
      setLoadingClasses(false);
    }
  }

  async function loadSections(selectedClassId: string) {
    if (!selectedClassId) {
      setSections([]);
      setSectionId("");
      return;
    }

    try {
      setLoadingSections(true);

      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/academics/classes/${selectedClassId}/sections`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load sections");
      }

      const data = await response.json();

      setSections(Array.isArray(data) ? data : []);
      setSectionId("");
    } catch (err) {
      console.error(err);
      setSections([]);
      setSectionId("");
    } finally {
      setLoadingSections(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadSections(classId);
  }, [classId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Fee plan name required hai.");
      return;
    }

    if (!classId) {
      setError("Class select karein.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Valid fee amount enter karein.");
      return;
    }

    if (!startDate) {
      setError("Start date select karein.");
      return;
    }

    if (
      frequency === "CUSTOM" &&
      (!customDays || Number(customDays) <= 0)
    ) {
      setError("Custom frequency ke liye days enter karein.");
      return;
    }

    if (
      dueDay &&
      (Number(dueDay) < 1 || Number(dueDay) > 31)
    ) {
      setError("Due day 1 se 31 ke beech hona chahiye.");
      return;
    }

    if (
      lateFeeType !== "NONE" &&
      (!lateFeeAmount || Number(lateFeeAmount) < 0)
    ) {
      setError("Valid late fee amount enter karein.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const body = {
        classId,
        sectionId: sectionId || undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        frequency,
        customDays:
          frequency === "CUSTOM"
            ? Number(customDays)
            : undefined,
        dueDay: dueDay ? Number(dueDay) : undefined,
        lateFeeType,
        lateFeeAmount:
          lateFeeType === "NONE"
            ? 0
            : Number(lateFeeAmount || 0),
        discountAllowed,
        startDate: new Date(
          `${startDate}T00:00:00`,
        ).toISOString(),
        endDate: endDate
          ? new Date(
              `${endDate}T23:59:59`,
            ).toISOString()
          : undefined,
      };

      const response = await fetch(
        `${API_URL}/academics/fees/plans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Fee plan create nahi ho paaya.",
        );
      }

      setSuccess("Fee plan successfully create ho gaya.");

      setName("");
      setDescription("");
      setClassId("");
      setSectionId("");
      setSections([]);
      setAmount("");
      setFrequency("MONTHLY");
      setCustomDays("");
      setDueDay("");
      setLateFeeType("NONE");
      setLateFeeAmount("");
      setDiscountAllowed(false);
      setStartDate(
        new Date().toISOString().split("T")[0],
      );
      setEndDate("");

      window.setTimeout(() => {
        window.location.href = "/fees/plans";
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Fee plan create nahi ho paaya.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "#f8fafc",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <Link
            href="/fees/plans"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ← Back to Fee Plans
          </Link>

          <h1
            style={{
              margin: "18px 0 8px",
              fontSize: "32px",
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            Create Fee Plan
          </h1>

          <p
            style={{
              margin: 0,
              color: "#64748b",
            }}
          >
            Class ya section ke liye fee structure create karein.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: "18px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#dcfce7",
              color: "#166534",
            }}
          >
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: "28px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
          }}
        >
          <section>
            <h2 style={sectionTitle}>
              Basic Information
            </h2>

            <div style={gridStyle}>
              <Field label="Plan Name *">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Class 10 Monthly Fee"
                  style={inputStyle}
                />
              </Field>

              <Field label="Class *">
                <select
                  value={classId}
                  onChange={(event) =>
                    setClassId(event.target.value)
                  }
                  style={inputStyle}
                  disabled={loadingClasses}
                >
                  <option value="">
                    {loadingClasses
                      ? "Loading classes..."
                      : "Select Class"}
                  </option>

                  {classes.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.code
                        ? ` (${item.code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Section">
                <select
                  value={sectionId}
                  onChange={(event) =>
                    setSectionId(event.target.value)
                  }
                  style={inputStyle}
                  disabled={
                    !classId || loadingSections
                  }
                >
                  <option value="">
                    {!classId
                      ? "All Sections"
                      : loadingSections
                        ? "Loading sections..."
                        : "All Sections"}
                  </option>

                  {sections.map((section) => (
                    <option
                      key={section.id}
                      value={section.id}
                    >
                      {section.name}
                      {section.code
                        ? ` (${section.code})`
                        : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <input
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Monthly tuition fee"
                  style={inputStyle}
                />
              </Field>
            </div>
          </section>

          <section style={sectionSpacing}>
            <h2 style={sectionTitle}>
              Fee Structure
            </h2>

            <div style={gridStyle}>
              <Field label="Amount (₹) *">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  placeholder="1000"
                  style={inputStyle}
                />
              </Field>

              <Field label="Frequency *">
                <select
                  value={frequency}
                  onChange={(event) =>
                    setFrequency(
                      event.target.value as Frequency,
                    )
                  }
                  style={inputStyle}
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
              </Field>

              {frequency === "CUSTOM" && (
                <Field label="Custom Days *">
                  <input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(event) =>
                      setCustomDays(
                        event.target.value,
                      )
                    }
                    placeholder="30"
                    style={inputStyle}
                  />
                </Field>
              )}

              <Field label="Due Day">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(event) =>
                    setDueDay(event.target.value)
                  }
                  placeholder="10"
                  style={inputStyle}
                />
              </Field>

              <Field label="Start Date *">
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(
                      event.target.value,
                    )
                  }
                  style={inputStyle}
                />
              </Field>

              <Field label="End Date">
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                  style={inputStyle}
                />
              </Field>
            </div>
          </section>

          <section style={sectionSpacing}>
            <h2 style={sectionTitle}>
              Late Fee & Discount
            </h2>

            <div style={gridStyle}>
              <Field label="Late Fee Type">
                <select
                  value={lateFeeType}
                  onChange={(event) =>
                    setLateFeeType(
                      event.target.value as LateFeeType,
                    )
                  }
                  style={inputStyle}
                >
                  <option value="NONE">
                    None
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
              </Field>

              {lateFeeType !== "NONE" && (
                <Field label="Late Fee Amount">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lateFeeAmount}
                    onChange={(event) =>
                      setLateFeeAmount(
                        event.target.value,
                      )
                    }
                    placeholder="50"
                    style={inputStyle}
                  />
                </Field>
              )}

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "28px",
                  fontWeight: 700,
                  color: "#334155",
                }}
              >
                <input
                  type="checkbox"
                  checked={discountAllowed}
                  onChange={(event) =>
                    setDiscountAllowed(
                      event.target.checked,
                    )
                  }
                  style={{
                    width: "18px",
                    height: "18px",
                  }}
                />

                Discount Allowed
              </label>
            </div>
          </section>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              marginTop: "30px",
              paddingTop: "22px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <Link
              href="/fees/plans"
              style={{
                padding: "12px 18px",
                borderRadius: "9px",
                border: "1px solid #cbd5e1",
                color: "#334155",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 20px",
                borderRadius: "9px",
                border: "none",
                background: loading
                  ? "#94a3b8"
                  : "#2563eb",
                color: "#fff",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
                fontWeight: 700,
              }}
            >
              {loading
                ? "Creating..."
                : "Create Fee Plan"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "7px",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#334155",
        }}
      >
        {label}
      </span>

      {children}
    </label>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: "0 0 18px",
  fontSize: "20px",
  fontWeight: 800,
  color: "#0f172a",
};

const sectionSpacing: React.CSSProperties = {
  marginTop: "32px",
  paddingTop: "28px",
  borderTop: "1px solid #e2e8f0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: "9px",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  outline: "none",
  fontSize: "14px",
};