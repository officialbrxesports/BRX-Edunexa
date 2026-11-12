import Link from "next/link";
import TopHeader from "../../components/layout/TopHeader";
import InstitutionRegistrationForm from "../../components/registration/InstitutionRegistrationForm";
import { parseInstitutionCategory } from "../../lib/institution-category";

type RegisterPageProps = {
  searchParams: Promise<{ type?: string | string[] }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const { type } = await searchParams;
  const initialCategory = parseInstitutionCategory(
    Array.isArray(type) ? type[0] : type,
  );

  return (
    <main className="min-h-screen bg-slate-100">
      <TopHeader />

      <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
        <InstitutionRegistrationForm
          key={initialCategory ?? "default"}
          initialCategory={initialCategory}
        />

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
