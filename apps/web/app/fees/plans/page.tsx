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
  lateFeeType: "NONE" | "FIXED" | "DAILY" | "PERCENTAGE";
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

function formatFrequency(frequency: FeePlan["frequency"]) {
  return frequency.replaceAll("_", " ");
}

export default function FeePlansPage() {
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPlans() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/academics/fees/plans`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load fee plans");
      }

      const data = await response.json();

      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Fee plans load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(id: string) {
    const confirmed = window.confirm(
      "Kya aap is fee plan ko delete karna chahte hain?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch(
        `${API_URL}/academics/fees/plans/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      await loadPlans();
    } catch (err) {
      console.error(err);
      alert("Fee plan delete nahi ho paaya.");
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

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
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: 800,
                color: "#0f172a",
              }}
            >
              Fee Plans
            </h1>

            <p
              style={{
                marginTop: "8px",
                color: "#64748b",
              }}
            >
              Classes aur sections ke liye fee structure manage karein.
            </p>
          </div>

          <Link
            href="/fees/plans/create"
            style={{
              display: "inline-block",
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#2563eb",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            + Create Fee Plan
          </Link>
        </div>

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            Loading fee plans...
          </div>
        ) : plans.length === 0 ? (
          <div
            style={{
              padding: "50px 30px",
              textAlign: "center",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                color: "#0f172a",
              }}
            >
              No Fee Plans
            </h2>

            <p
              style={{
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              Abhi koi fee plan create nahi hua hai.
            </p>

            <Link
              href="/fees/plans/create"
              style={{
                display: "inline-block",
                padding: "11px 16px",
                borderRadius: "9px",
                background: "#2563eb",
                color: "#fff",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Create First Fee Plan
            </Link>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
              background: "#fff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "1000px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                  }}
                >
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Class</th>
                  <th style={thStyle}>Section</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Frequency</th>
                  <th style={thStyle}>Due Day</th>
                  <th style={thStyle}>Late Fee</th>
                  <th style={thStyle}>Discount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={tdStyle}>
                      <strong>{plan.name}</strong>

                      {plan.description && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "12px",
                            color: "#64748b",
                          }}
                        >
                          {plan.description}
                        </div>
                      )}
                    </td>

                    <td style={tdStyle}>
                      {plan.class?.name || "-"}
                    </td>

                    <td style={tdStyle}>
                      {plan.section?.name || "All Sections"}
                    </td>

                    <td style={tdStyle}>
                      ₹{Number(plan.amount).toLocaleString("en-IN")}
                    </td>

                    <td style={tdStyle}>
                      {formatFrequency(plan.frequency)}
                    </td>

                    <td style={tdStyle}>
                      {plan.dueDay ? `${plan.dueDay}th` : "-"}
                    </td>

                    <td style={tdStyle}>
                      {plan.lateFeeType === "NONE"
                        ? "None"
                        : `${plan.lateFeeType}: ₹${Number(
                            plan.lateFeeAmount,
                          ).toLocaleString("en-IN")}`}
                    </td>

                    <td style={tdStyle}>
                      {plan.discountAllowed ? "Allowed" : "No"}
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: plan.isActive
                            ? "#dcfce7"
                            : "#fee2e2",
                          color: plan.isActive
                            ? "#166534"
                            : "#991b1b",
                        }}
                      >
                        {plan.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <Link
                          href={`/fees/plans/${plan.id}`}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "7px",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            textDecoration: "none",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          View
                        </Link>

                        <button
                          type="button"
                          onClick={() => deletePlan(plan.id)}
                          style={{
                            padding: "7px 10px",
                            borderRadius: "7px",
                            border: "none",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 700,
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: 800,
  color: "#334155",
  borderBottom: "1px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 12px",
  fontSize: "14px",
  color: "#334155",
  borderBottom: "1px solid #f1f5f9",
};