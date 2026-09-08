import { prisma } from "@/server/db/client";

/** docs/prd.md R5: the system refuses to remove the last active Admin. */
export class LastAdminError extends Error {
  constructor() {
    super("This is the only active Admin — promote another account first.");
    this.name = "LastAdminError";
  }
}

/**
 * Throws `LastAdminError` if deactivating or demoting `userId` would leave the
 * company with no `ACTIVE` `ADMIN`.
 */
export async function assertNotLastActiveAdmin(userId: string): Promise<void> {
  const otherActiveAdmins = await prisma.user.count({
    where: { role: "ADMIN", status: "ACTIVE", id: { not: userId } },
  });
  if (otherActiveAdmins === 0) throw new LastAdminError();
}
