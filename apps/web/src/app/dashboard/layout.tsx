import type { ReactNode } from "react";

// Dashboard pages use a slightly smaller base size (14px instead of 16px).
// The <style> tag only exists while a /dashboard page is mounted, so the
// landing, login and register pages keep their normal size.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`html{font-size:14px}`}</style>
      {children}
    </>
  );
}
