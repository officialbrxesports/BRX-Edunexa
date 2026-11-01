import Link from "next/link";
import TopHeader from "../../components/layout/TopHeader";
import InstitutionRegistrationForm from "../../components/registration/InstitutionRegistrationForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <TopHeader />

      <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
        <InstitutionRegistrationForm />

        <p className="mt-5 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-800 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}