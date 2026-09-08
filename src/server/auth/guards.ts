import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "@/server/auth";
import { ADMIN_IDLE_TIMEOUT_MS } from "@/server/auth/policy";

export { ADMIN_IDLE_TIMEOUT_MS };

export type SessionUser = Session["user"];

export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.status === "DEACTIVATED") redirect("/login?reason=deactivated");
  return session;
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/app");
  // The 2-hour Admin idle timeout (R6) is enforced in src/middleware.ts, which
  // owns the `la` / `role_hint` cookies and can both check and refresh them.
  return session;
}

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "ADMIN";
}
