import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_IDLE_TIMEOUT_MS } from "@/server/auth/policy";

/**
 * Admin idle timeout (docs/prd.md R6). Staff sessions have no idle timeout, so
 * this only acts when the `role_hint` cookie (set at login) says ADMIN.
 *
 * `role_hint` is a convenience hint, not an authorization boundary — every route
 * re-checks the real session server-side via `requireAdmin()`.
 */
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

export function proxy(req: NextRequest) {
  const now = Date.now();
  const roleHint = req.cookies.get("role_hint")?.value;
  const lastActive = Number(req.cookies.get("la")?.value ?? "0");

  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  if (roleHint === "ADMIN" && lastActive > 0 && now - lastActive > ADMIN_IDLE_TIMEOUT_MS) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?reason=idle";
    const res = NextResponse.redirect(url);
    res.cookies.delete("la");
    res.cookies.delete("role_hint");
    for (const name of SESSION_COOKIES) res.cookies.delete(name);
    return res;
  }

  const res = NextResponse.next();
  if (roleHint) res.cookies.set("la", String(now), opts);
  return res;
}

export const config = {
  matcher: ["/app/:path*"],
};
