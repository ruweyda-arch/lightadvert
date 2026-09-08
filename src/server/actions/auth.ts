"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { assertNotBreached, BreachedPasswordError } from "@/server/auth/hibp";
import { MIN_PASSWORD_LENGTH } from "@/server/auth/policy";
import {
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
} from "@/server/ratelimit/upstash";

import { fail, ok, type ActionResult } from "./result";

function isAuthApiError(err: unknown): err is { status: unknown } {
  return typeof err === "object" && err !== null && "status" in err;
}

function clientIp(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return fail("Enter your email and password.");

  const h = await headers();
  const throttle = await checkLoginRateLimit(`login:${clientIp(h)}`);
  if (!throttle.ok) return fail("Too many attempts. Try again in a few minutes.");

  let role = "STAFF";
  try {
    const res = await auth.api.signInEmail({ body: { email, password }, headers: h });
    role = (res.user as { role?: string }).role ?? "STAFF";
  } catch (err) {
    if (isAuthApiError(err)) return fail("Invalid email or password.");
    throw err;
  }

  const jar = await cookies();
  jar.set("role_hint", role, sessionCookieOptions());
  jar.set("la", String(Date.now()), sessionCookieOptions());

  redirect("/app");
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return fail("Enter your email.");

  const h = await headers();
  const throttle = await checkPasswordResetRateLimit(`pwreset:${clientIp(h)}`);
  if (!throttle.ok) return fail("Too many requests. Try again later.");

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: h,
    });
  } catch {
    // Swallow — never reveal whether an account exists.
  }
  return ok();
}

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) return fail("This reset link is missing its token — request a new one.");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, {
      password: "Too short",
    });
  }
  if (password !== confirm) {
    return fail("The two passwords do not match.", { confirm: "Does not match" });
  }

  try {
    await assertNotBreached(password);
  } catch (err) {
    if (err instanceof BreachedPasswordError) {
      return fail(err.message, { password: "Breached password" });
    }
  }

  try {
    await auth.api.resetPassword({
      body: { token, newPassword: password },
      headers: await headers(),
    });
  } catch (err) {
    if (isAuthApiError(err)) {
      return fail("This reset link is invalid or has expired — request a new one.");
    }
    throw err;
  }

  redirect("/login?reset=1");
}
