/** Audit model (docs/prd.md R44, docs/architecture.md §8). */
export type AuditEventType =
  | "ESTIMATE_CHANGED"
  | "STAMPED_ROLE_CHANGED"
  | "TASK_APPROVED"
  | "TASK_REASSIGNED"
  | "TASK_MANUALLY_RECORDED"
  | "PERIOD_LOCKED"
  | "PERIOD_UNLOCKED"
  | "APPROVED_TASK_CANCELLED";

/** Events the domain layer must refuse without a non-empty `reason`. */
export const REASON_REQUIRED: ReadonlySet<AuditEventType> = new Set([
  "ESTIMATE_CHANGED",
  "STAMPED_ROLE_CHANGED",
  "TASK_REASSIGNED",
  "PERIOD_UNLOCKED",
  "APPROVED_TASK_CANCELLED",
]);

export function reasonRequiredFor(event: AuditEventType): boolean {
  return REASON_REQUIRED.has(event);
}

export function assertReason(event: AuditEventType, reason: string | null | undefined): void {
  if (reasonRequiredFor(event) && !reason?.trim()) {
    throw new Error(`Audit event ${event} requires a reason.`);
  }
}
