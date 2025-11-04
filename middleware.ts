import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));

  // API routes and static files
  const isApiRoute = pathname.startsWith("/api");
  const isStaticFile = pathname.startsWith("/_next") || pathname.includes(".");

  // Skip middleware for API routes and static files
  if (isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  // Check for session cookie (simple check - actual auth happens in pages)
  const hasSessionToken = request.cookies.has("authjs.session-token") ||
                         request.cookies.has("__Secure-authjs.session-token");

  // Redirect to login if trying to access protected route without session
  if (!hasSessionToken && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if authenticated user tries to access login
  if (hasSessionToken && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
