import Link from "next/link";

export const metadata = { title: "Forgot password | BRX EduNexa" };

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>
        <p className="mt-3 text-sm text-slate-600">
          Ask the person who manages your institution to reset it for you.
          They will give you a new temporary password, and you will choose your
          own at your next sign-in.
        </p>

        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>
            <span className="font-semibold">Student, parent, teacher or staff:</span>{" "}
            ask your institution head.
          </li>
          <li>
            <span className="font-semibold">Institution head:</span> ask the
            EduNexa platform administrator.
          </li>
        </ul>

        <Link
          href="/login"
          className="mt-6 inline-flex h-9 items-center bg-blue-800 px-4 text-xs font-semibold text-white hover:bg-blue-900"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
