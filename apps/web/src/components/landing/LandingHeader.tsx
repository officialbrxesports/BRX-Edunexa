import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { MobileMenu } from "./MobileMenu";
import { navLinks } from "./nav-links";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandLogo />

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 lg:flex"
        >
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className={
                index === 0
                  ? "text-sm font-bold text-blue-700"
                  : "text-sm font-semibold text-slate-600 transition hover:text-blue-700"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:block"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Get Started
          </Link>

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
