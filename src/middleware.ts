import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { AUTH_SECRET, SESSION_COOKIE_NAME } from "@/lib/auth-config";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    cookieName: SESSION_COOKIE_NAME,
    secureCookie: false,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  const res = NextResponse.next();
  if (!pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/projects/:path*",
    "/projects",
    "/notifications",
    "/settings",
    "/api/projects/:path*",
    "/api/projects",
    "/api/search",
    "/api/notifications",
    "/api/settings",
  ],
};
