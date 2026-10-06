'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const institutionTypes = [
  {
    value: 'SCHOOL',
    title: 'School',
    description:
      'Manage school students, teachers and academics.',
  },
  {
    value: 'COLLEGE',
    title: 'College',
    description:
      'Manage college departments, students and faculty.',
  },
  {
    value: 'UNIVERSITY',
    title: 'University',
    description:
      'Manage university programs, departments and students.',
  },
  {
    value: 'COACHING',
    title: 'Coaching',
    description:
      'Manage batches, students, teachers and fees.',
  },
  {
    value: 'INSTITUTE',
    title: 'Institute',
    description:
      'Manage institute courses and learners.',
  },
  {
    value: 'OTHER',
    title: 'Other',
    description:
      'Use BRX EduNexa for another education organization.',
  },
];

export default function InstitutionRegistrationPage() {
  const router = useRouter();

  const [selected, setSelected] = useState('');
  const [isGoogleOnboarding, setIsGoogleOnboarding] =
    useState(false);

  useEffect(() => {
    const credential = sessionStorage.getItem(
      'brx_google_credential',
    );

    const profile = sessionStorage.getItem(
      'brx_google_profile',
    );

    if (credential && profile) {
      setIsGoogleOnboarding(true);
    }
  }, []);

  function continueNext() {
    if (!selected) return;

    sessionStorage.setItem(
      'brx_institution_type',
      selected,
    );

    if (isGoogleOnboarding) {
      router.push('/register/owner');
      return;
    }

    router.push('/register/owner');
  }

  return (
    <main className="min-h-screen bg-[#070b18] px-5 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-10 text-center">

          <div className="mb-4 inline-flex rounded-2xl bg-indigo-600 px-5 py-3 text-xl font-bold shadow-lg shadow-indigo-900/30">
            BRX
          </div>

          <h1 className="text-4xl font-bold">
            Choose your institution
          </h1>

          <p className="mt-3 text-gray-400">
            Tell us what type of education organization
            you want to manage with BRX EduNexa.
          </p>

          {isGoogleOnboarding && (
            <div className="mx-auto mt-5 max-w-xl rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
              Your Google account is verified.
              Complete your institution setup to create
              your BRX EduNexa administrator account.
            </div>
          )}

        </div>

        {/* Institution Types */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {institutionTypes.map((item) => {
            const active =
              selected === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setSelected(item.value)
                }
                className={`rounded-2xl border p-6 text-left transition ${
                  active
                    ? 'border-indigo-400 bg-indigo-600/20 shadow-lg shadow-indigo-900/30'
                    : 'border-white/10 bg-white/5 hover:border-indigo-400/50 hover:bg-white/10'
                }`}
              >

                <div className="mb-4 flex items-center justify-between">

                  <h2 className="text-xl font-semibold">
                    {item.title}
                  </h2>

                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      active
                        ? 'border-indigo-400 bg-indigo-500'
                        : 'border-white/30'
                    }`}
                  >
                    {active && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>

                </div>

                <p className="text-sm leading-6 text-gray-400">
                  {item.description}
                </p>

              </button>
            );
          })}

        </div>

        {/* Continue */}
        <div className="mt-10 flex justify-center">

          <button
            type="button"
            disabled={!selected}
            onClick={continueNext}
            className="rounded-xl bg-indigo-600 px-8 py-3 font-semibold transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isGoogleOnboarding
              ? 'Continue Setup'
              : 'Continue'}
          </button>

        </div>

      </div>
    </main>
  );
}