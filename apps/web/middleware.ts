import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );

    return decoded.role || null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("brx_access_token")?.value;
  const pathname = request.nextUrl.pathname;

  // ========================================
  // NO TOKEN
  // ========================================

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  // ========================================
  // GET ROLE
  // ========================================

  const role = getRoleFromToken(token);

  // ========================================
  // INVALID TOKEN
  // ========================================

  if (!role) {
    const response = NextResponse.redirect(
      new URL("/login", request.url),
    );

    response.cookies.delete("brx_access_token");

    return response;
  }

  // ========================================
  // HEAD ROUTES
  // ========================================

  const headRoutes = [
    "/dashboard",
    "/users",
    "/classes",
    "/enrollments",
    "/institution",
    "/fees",
  ];

  // ========================================
  // TEACHER ROUTES
  // ========================================

  const teacherRoutes = [
    "/teacher-dashboard",
    "/teacher-assignments",
    "/attendance",
  ];

  // ========================================
  // STUDENT ROUTES
  // ========================================

  const studentRoutes = [
    "/student-dashboard",
  ];

  // ========================================
  // STAFF ROUTES
  // ========================================

  const staffRoutes = [
    "/staff-dashboard",
  ];

  // ========================================
  // ROUTE DETECTION
  // ========================================

  const isHeadRoute = headRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  const isTeacherRoute = teacherRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  const isStudentRoute = studentRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  const isStaffRoute = staffRoutes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`),
  );

  // ========================================
  // HEAD ACCESS
  // ========================================

  if (isHeadRoute && role !== "HEAD") {
    if (role === "TEACHER") {
      return NextResponse.redirect(
        new URL("/teacher-dashboard", request.url),
      );
    }

    if (role === "STUDENT") {
      return NextResponse.redirect(
        new URL("/student-dashboard", request.url),
      );
    }

    if (role === "STAFF") {
      return NextResponse.redirect(
        new URL("/staff-dashboard", request.url),
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  // ========================================
  // TEACHER ACCESS
  // ========================================

  if (isTeacherRoute && role !== "TEACHER") {
    if (role === "HEAD") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }

    if (role === "STUDENT") {
      return NextResponse.redirect(
        new URL("/student-dashboard", request.url),
      );
    }

    if (role === "STAFF") {
      return NextResponse.redirect(
        new URL("/staff-dashboard", request.url),
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  // ========================================
  // STUDENT ACCESS
  // ========================================

  if (isStudentRoute && role !== "STUDENT") {
    if (role === "HEAD") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }

    if (role === "TEACHER") {
      return NextResponse.redirect(
        new URL("/teacher-dashboard", request.url),
      );
    }

    if (role === "STAFF") {
      return NextResponse.redirect(
        new URL("/staff-dashboard", request.url),
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  // ========================================
  // STAFF ACCESS
  // ========================================

  if (isStaffRoute && role !== "STAFF") {
    if (role === "HEAD") {
      return NextResponse.redirect(
        new URL("/dashboard", request.url),
      );
    }

    if (role === "TEACHER") {
      return NextResponse.redirect(
        new URL("/teacher-dashboard", request.url),
      );
    }

    if (role === "STUDENT") {
      return NextResponse.redirect(
        new URL("/student-dashboard", request.url),
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  // ========================================
  // ACCESS GRANTED
  // ========================================

  return NextResponse.next();
}

// ========================================
// PROTECTED ROUTES
// ========================================

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/:path*",
    "/classes/:path*",
    "/enrollments/:path*",
    "/attendance/:path*",
    "/institution/:path*",
    "/fees/:path*",
    "/teacher-dashboard/:path*",
    "/teacher-assignments/:path*",
    "/student-dashboard/:path*",
    "/staff-dashboard/:path*",
  ],
};