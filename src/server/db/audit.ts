import type { Prisma } from "@prisma/client";

import { assertReason, type AuditEventType } from "@/server/domain/audit";

import { prisma } from "./client";

export interface AuditInput {
  eventType: AuditEventType;
  actorId: string;
  taskId?: string;
  periodLockId?: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
}

/**
 * Write an AuditEntry, enforcing the reason rule (docs/architecture.md §8). Pass
 * a transaction client so the entry commits atomically with the change it records.
 */
export function writeAudit(tx: Prisma.TransactionClient, input: AuditInput) {
  assertReason(input.eventType, input.reason ?? undefined);
  return tx.auditEntry.create({
    data: {
      eventType: input.eventType,
      actorId: input.actorId,
      taskId: input.taskId ?? null,
      periodLockId: input.periodLockId ?? null,
      field: input.field ?? null,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      reason: input.reason ?? null,
    },
  });
}

export interface AuditFilters {
  taskId?: string;
  actorId?: string;
  eventType?: AuditEventType;
  from?: Date;
  to?: Date;
}

export function listAuditEntries(filters: AuditFilters = {}, take = 200) {
  return prisma.auditEntry.findMany({
    where: {
      taskId: filters.taskId,
      actorId: filters.actorId,
      eventType: filters.eventType,
      createdAt:
        filters.from || filters.to
          ? { gte: filters.from, lt: filters.to }
          : undefined,
    },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { name: true } },
      task: { select: { id: true, title: true } },
    },
  });
}
