"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = "/api";

type ReceiptData = {
  receiptNumber: string;
  payment: {
    id: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string | null;
    note?: string | null;
    paymentDate: string;
  };
  fee: {
    id: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    dueDate: string;
    status: string;
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
  };
  class: {
    id: string;
    name: string;
    code?: string | null;
  };
  section: {
    id: string;
    name: string;
    code?: string | null;
  };
};

export default function ReceiptPage() {
  const params = useParams();

  const feeId = params.feeId as string;
  const paymentId = params.paymentId as string;

  const [receipt, setReceipt] =
    useState<ReceiptData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadReceipt() {
      try {
        const token =
          localStorage.getItem("accessToken");

        const response = await fetch(
          `${API_URL}/academics/fees/${feeId}/payments/${paymentId}/receipt`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load receipt",
          );
        }

        const data = await response.json();

        setReceipt(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong",
        );
      } finally {
        setLoading(false);
      }
    }

    if (feeId && paymentId) {
      loadReceipt();
    }
  }, [feeId, paymentId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">
          Loading receipt...
        </p>
      </main>
    );
  }

  if (error || !receipt) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border bg-white p-8 text-center shadow">
          <h1 className="text-xl font-bold text-red-600">
            Receipt Error
          </h1>

          <p className="mt-2 text-gray-600">
            {error || "Receipt not found"}
          </p>
        </div>
      </main>
    );
  }

  const paymentDate = new Date(
    receipt.payment.paymentDate,
  ).toLocaleString("en-IN");

  const dueDate = new Date(
    receipt.fee.dueDate,
  ).toLocaleDateString("en-IN");

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">

        {/* Actions */}
        <div className="mb-4 flex justify-end gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            🖨️ Print Receipt
          </button>
        </div>

        {/* Receipt */}
        <div className="rounded-2xl bg-white p-8 shadow-lg print:rounded-none print:shadow-none">

          {/* Header */}
          <div className="border-b pb-6 text-center">
            <h1 className="text-3xl font-black tracking-wide text-blue-700">
              BRX EduNexa
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Education Management Platform
            </p>

            <h2 className="mt-5 text-xl font-bold">
              FEE PAYMENT RECEIPT
            </h2>
          </div>

          {/* Receipt info */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">
                Receipt No.
              </p>

              <p className="mt-1 font-bold">
                {receipt.receiptNumber}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Payment Date
              </p>

              <p className="mt-1 font-semibold">
                {paymentDate}
              </p>
            </div>
          </div>

          {/* Student */}
          <div className="mt-8 rounded-xl border p-5">
            <h3 className="mb-4 text-lg font-bold">
              Student Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">
                  Student Name
                </p>

                <p className="font-semibold">
                  {receipt.student.firstName}{" "}
                  {receipt.student.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Class
                </p>

                <p className="font-semibold">
                  {receipt.class.name}
                  {receipt.class.code
                    ? ` (${receipt.class.code})`
                    : ""}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Section
                </p>

                <p className="font-semibold">
                  {receipt.section.name}
                  {receipt.section.code
                    ? ` (${receipt.section.code})`
                    : ""}
                </p>
              </div>

              {receipt.student.phone && (
                <div>
                  <p className="text-xs text-gray-500">
                    Phone
                  </p>

                  <p className="font-semibold">
                    {receipt.student.phone}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-bold">
              Payment Details
            </h3>

            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-2 border-b p-4">
                <span className="text-gray-600">
                  Total Fee
                </span>

                <span className="text-right font-semibold">
                  ₹{receipt.fee.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b p-4">
                <span className="text-gray-600">
                  This Payment
                </span>

                <span className="text-right text-lg font-bold text-green-600">
                  ₹{receipt.payment.amount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 border-b p-4">
                <span className="text-gray-600">
                  Total Paid
                </span>

                <span className="text-right font-semibold">
                  ₹{receipt.fee.paidAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 p-4">
                <span className="text-gray-600">
                  Remaining Due
                </span>

                <span className="text-right font-bold">
                  ₹{receipt.fee.dueAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment meta */}
          <div className="mt-6 grid gap-4 rounded-xl bg-gray-50 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">
                Payment Method
              </p>

              <p className="font-semibold">
                {receipt.payment.paymentMethod}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Status
              </p>

              <p className="font-semibold">
                {receipt.fee.status}
              </p>
            </div>

            {receipt.payment.transactionId && (
              <div>
                <p className="text-xs text-gray-500">
                  Transaction ID
                </p>

                <p className="break-all font-semibold">
                  {receipt.payment.transactionId}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500">
                Fee Due Date
              </p>

              <p className="font-semibold">
                {dueDate}
              </p>
            </div>
          </div>

          {receipt.payment.note && (
            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Note
              </p>

              <p className="mt-1 rounded-lg border p-3">
                {receipt.payment.note}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
            <p>
              This is a computer-generated fee receipt.
            </p>

            <p className="mt-1 font-semibold">
              BRX EduNexa
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}