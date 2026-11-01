
import Link from 'next/link';

export default function TopHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-900/20 bg-[#193f88] text-white shadow-md">
      <div className="mx-auto flex min-h-19 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="BRX EduNexa home"
          className="flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-2xl font-extrabold text-[#193f88] shadow-sm">
            B
          </span>

          <span className="flex flex-col">
            <span className="text-lg font-bold tracking-tight sm:text-xl">
              BRX EduNexa
            </span>
            <span className="text-xs text-blue-100 sm:text-sm">
              Education Management Platform
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="hidden text-sm text-blue-100 transition hover:text-white sm:inline"
          >
            Home
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}
