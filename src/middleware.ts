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
      const res = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
      applySecurityHeaders(res);
      return res;
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    applySecurityHeaders(res);
    return res;
  }

  // Admin route exclusivity & RBAC
  const userRole = (token as any).role || "MEMBER";
  if (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/api/admin")) {
    if (userRole !== "ADMIN") {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json(
          { success: false, error: "Forbidden: Admin privileges required." },
          { status: 403 }
        );
        applySecurityHeaders(res);
        return res;
      }
      const redirectUrl = new URL("/dashboard?error=admin_required", req.url);
      const res = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next();
  if (!pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }
  applySecurityHeaders(res);
  return res;
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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
    "/api/admin/:path*",
    "/api/search",
    "/api/notifications",
    "/api/settings",
  ],
};
