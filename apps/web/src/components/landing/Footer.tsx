import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { navLinks } from "./nav-links";

const platformLinks = navLinks.filter((link) => link.href !== "#home");

const institutionLabels = [
  "School Management",
  "College Management",
  "University Management",
  "Coaching Management",
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 md:col-span-1">
            <BrandLogo />

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">
              A modern education management platform designed for schools,
              colleges, universities and coaching institutions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950">Platform</h3>

            <div className="mt-5 space-y-3 text-sm text-slate-500">
              {platformLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block transition hover:text-blue-700"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950">Access</h3>

            <div className="mt-5 space-y-3 text-sm text-slate-500">
              <Link
                href="/login"
                className="block transition hover:text-blue-700"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="block transition hover:text-blue-700"
              >
                Create Institution
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-black text-slate-950">BRX EduNexa</h3>

            <div className="mt-5 space-y-3 text-sm text-slate-500">
              {institutionLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-200 pt-7 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} BRX EduNexa. All rights reserved.</p>

          <div className="flex gap-5">
            <a href="#home" className="hover:text-blue-700">
              Home
            </a>

            <Link href="/login" className="hover:text-blue-700">
              Portal
            </Link>

            <Link href="/register" className="hover:text-blue-700">
              Register
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
