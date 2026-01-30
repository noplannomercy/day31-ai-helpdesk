import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Public routes - no authentication required
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Auth API routes - always allow
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute && pathname !== "/") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Role-based access control
  if (user) {
    // Admin-only routes
    if (pathname.startsWith("/admin")) {
      if (user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Manager or Admin only routes
    if (pathname.startsWith("/reports")) {
      if (user.role !== "manager" && user.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
