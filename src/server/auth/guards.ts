import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, type Session } from "@/server/auth";

/** Admin sessions additionally time out after 2 hours idle (docs/prd.md R6). */
export const ADMIN_IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

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
  // TODO(auth R6): enforce ADMIN_IDLE_TIMEOUT_MS via a last-activity cookie or a
  // session field; Better Auth's rolling `updateAge` is not a last-activity marker.
  return session;
}

export function isAdmin(session: Session | null): boolean {
  return session?.user.role === "ADMIN";
}
