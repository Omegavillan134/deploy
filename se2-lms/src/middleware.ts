import { NextRequest, NextResponse } from "next/server";

const PUBLIC_AUTH = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/otp",
  "/api/auth/logout",
  "/api/auth/forgot",
  "/api/auth/reset",
];

const FORBIDDEN_QUERY = new Set([
  "token",
  "session",
  "sessionid",
  "session_id",
  "access_token",
  "refresh_token",
  "password",
  "code",
  "otp",
  "secret",
  "auth",
  "jwt",
  "apikey",
  "api_key",
]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  if (pathname === "/features") {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  
  let stripped = false;
  for (const key of [...url.searchParams.keys()]) {
    if (FORBIDDEN_QUERY.has(key.toLowerCase())) {
      url.searchParams.delete(key);
      stripped = true;
    }
  }
  if (stripped) {
    
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  
  if (
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method) &&
    pathname.startsWith("/api") &&
    !PUBLIC_AUTH.some((p) => pathname.startsWith(p))
  ) {
    const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    const host = req.headers.get("host") ?? "";
    let sameOrigin = false;
    try {
      if (origin && host) {
        const originHost = new URL(origin.startsWith("http") ? origin : `https://${origin}`).host;
        sameOrigin = originHost === host;
      }
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
  }

  
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()"
  );
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  res.headers.set("Origin-Agent-Cluster", "?1");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    res.headers.set("Cache-Control", "private, no-store");
  }

  
  
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const csp = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|sw.js|icons|manifest).*)"],
};
