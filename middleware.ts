import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_ROUTES = new Set(["/login", "/signup", "/verify-otp"]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow homepage for everyone.
  if (pathname === "/") {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const isAuthRoute = AUTH_ROUTES.has(pathname);

  // Logged-out users can only access home or auth pages.
  if (!token && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logged-in users should not stay on auth pages.
  if (token && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
