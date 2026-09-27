"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

type FeePlan = {
  id: string;
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

  lateFeeType:
    | "NONE"
    | "FIXED"
    | "DAILY"
    | "PERCENTAGE";

  lateFeeAmount: string | number;

  discountAllowed: boolean;

  startDate: string;
  endDate?: string | null;

  isActive: boolean;

  class?: {
    id: string;
    name: string;
    code: string;
  };

  section?: {
    id: string;
    name: string;
    code: string;
  } | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function FeePlanDetailsPage({
  params,
}: PageProps) {
  const [planId, setPlanId] = useState("");

  const [plan, setPlan] = useState<FeePlan | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const resolvedParams = await params;

        setPlanId(resolvedParams.id);

        const token =
          localStorage.getItem("accessToken");

        const response = await fetch(
          `${API_URL}/academics/fees/plans/${resolvedParams.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Fee plan load nahi ho paaya.",
          );
        }

        setPlan(data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Fee plan load nahi ho paaya.",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params]);

  async function deletePlan() {
    if (!planId) {
      return;
    }

    const confirmed = window.confirm(
      "Kya aap is fee plan ko permanently delete karna chahte hain?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/academics/fees/plans/${planId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Fee plan delete nahi ho paaya.",
        );
      }

      window.location.href = "/fees/plans";
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Fee plan delete nahi ho paaya.",
      );
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Loading fee plan...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <Link
            href="/fees/plans"
            style={backLinkStyle}
          >
            ← Back to Fee Plans
          </Link>

          <div
            style={{
              ...cardStyle,
              marginTop: "24px",
            }}
          >
            <h1
              style={{
                marginTop: 0,
                color: "#991b1b",
              }}
            >
              Fee Plan Not Found
            </h1>

            <p
              style={{
                color: "#64748b",
              }}
            >
              {error ||
                "Requested fee plan available nahi hai."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <Link
              href="/fees/plans"
              style={backLinkStyle}
            >
              ← Back to Fee Plans
            </Link>

            <h1
              style={{
                margin: "16px 0 6px",
                fontSize: "32px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              {plan.name}
            </h1>

            {plan.description && (
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                }}
              >
                {plan.description}
              </p>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <span
              style={{
                padding: "8px 12px",
                borderRadius: "999px",
                background: plan.isActive
                  ? "#dcfce7"
                  : "#fee2e2",
                color: plan.isActive
                  ? "#166534"
                  : "#991b1b",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {plan.isActive
                ? "ACTIVE"
                : "INACTIVE"}
            </span>

            <button
              type="button"
              onClick={deletePlan}
              style={{
                padding: "8px 13px",
                borderRadius: "8px",
                border: "none",
                background: "#fee2e2",
                color: "#b91c1c",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "18px",
            marginTop: "28px",
          }}
        >
          <InfoCard
            title="Fee Amount"
            value={`₹${Number(
              plan.amount,
            ).toLocaleString("en-IN")}`}
          />

          <InfoCard
            title="Frequency"
            value={formatFrequency(
              plan.frequency,
            )}
          />

          <InfoCard
            title="Class"
            value={
              plan.class?.name || "-"
            }
          />

          <InfoCard
            title="Section"
            value={
              plan.section?.name ||
              "All Sections"
            }
          />

          <InfoCard
            title="Due Day"
            value={
              plan.dueDay
                ? `${plan.dueDay}`
                : "Not Set"
            }
          />

          <InfoCard
            title="Late Fee"
            value={
              plan.lateFeeType === "NONE"
                ? "None"
                : `${formatLateFeeType(
                    plan.lateFeeType,
                  )} - ₹${Number(
                    plan.lateFeeAmount,
                  ).toLocaleString("en-IN")}`
            }
          />

          <InfoCard
            title="Discount"
            value={
              plan.discountAllowed
                ? "Allowed"
                : "Not Allowed"
            }
          />

          <InfoCard
            title="Custom Days"
            value={
              plan.customDays
                ? `${plan.customDays} days`
                : "Not Applicable"
            }
          />

          <InfoCard
            title="Start Date"
            value={formatDate(
              plan.startDate,
            )}
          />

          <InfoCard
            title="End Date"
            value={
              plan.endDate
                ? formatDate(plan.endDate)
                : "No End Date"
            }
          />
        </div>

        <div
          style={{
            ...cardStyle,
            marginTop: "24px",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "18px",
              color: "#0f172a",
              fontSize: "20px",
            }}
          >
            Fee Plan Summary
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <SummaryRow
              label="Plan ID"
              value={plan.id}
            />

            <SummaryRow
              label="Class"
              value={
                plan.class
                  ? `${plan.class.name}${
                      plan.class.code
                        ? ` (${plan.class.code})`
                        : ""
                    }`
                  : "-"
              }
            />

            <SummaryRow
              label="Section"
              value={
                plan.section
                  ? `${plan.section.name}${
                      plan.section.code
                        ? ` (${plan.section.code})`
                        : ""
                    }`
                  : "All Sections"
              }
            />

            <SummaryRow
              label="Frequency"
              value={formatFrequency(
                plan.frequency,
              )}
            />

            <SummaryRow
              label="Discount"
              value={
                plan.discountAllowed
                  ? "Allowed"
                  : "Not Allowed"
              }
            />

            <SummaryRow
              label="Status"
              value={
                plan.isActive
                  ? "Active"
                  : "Inactive"
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: "20px",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: "#64748b",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "19px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "10px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#64748b",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#334155",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function formatFrequency(
  frequency: FeePlan["frequency"],
) {
  return frequency
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatLateFeeType(
  type: FeePlan["lateFeeType"],
) {
  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "32px",
  background: "#f8fafc",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: "14px",
  border: "1px solid #e2e8f0",
  padding: "24px",
};

const backLinkStyle: React.CSSProperties = {
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 700,
};