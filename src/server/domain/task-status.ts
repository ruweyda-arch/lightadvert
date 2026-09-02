/**
 * Task lifecycle (docs/architecture.md §7.1, docs/prd.md R22).
 *
 *   ASSIGNED    -> IN_PROGRESS (assignee) | CANCELLED (admin)
 *   IN_PROGRESS -> REVIEW (assignee)      | CANCELLED (admin)
 *   REVIEW      -> COMPLETED (admin, sets Approval Date)
 *               -> IN_PROGRESS (admin, informal hand-back — no reason)
 *               -> CANCELLED (admin)
 *   COMPLETED   -> CANCELLED (admin, reason required, blocked if period locked)
 *   CANCELLED   -> (terminal)
 *
 * There is no REJECTED status. Only the assignee moves a Task into REVIEW; only
 * an Admin approves, cancels, or hands back.
 */
export type TaskStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED"
  | "CANCELLED";

export type TransitionActor = "ADMIN" | "ASSIGNEE";

export interface StatusTransition {
  to: TaskStatus;
  by: readonly TransitionActor[];
  /** True where the domain layer must also require a reason + Audit Entry. */
  reasonRequired?: boolean;
}

const TRANSITIONS: Record<TaskStatus, readonly StatusTransition[]> = {
  ASSIGNED: [
    { to: "IN_PROGRESS", by: ["ASSIGNEE"] },
    { to: "CANCELLED", by: ["ADMIN"] },
  ],
  IN_PROGRESS: [
    { to: "REVIEW", by: ["ASSIGNEE"] },
    { to: "CANCELLED", by: ["ADMIN"] },
  ],
  REVIEW: [
    { to: "COMPLETED", by: ["ADMIN"] },
    { to: "IN_PROGRESS", by: ["ADMIN"] },
    { to: "CANCELLED", by: ["ADMIN"] },
  ],
  COMPLETED: [{ to: "CANCELLED", by: ["ADMIN"], reasonRequired: true }],
  CANCELLED: [],
};

export function allowedTransitions(from: TaskStatus): readonly StatusTransition[] {
  return TRANSITIONS[from];
}

export function findTransition(
  from: TaskStatus,
  to: TaskStatus,
  actor: TransitionActor,
): StatusTransition | null {
  return (
    TRANSITIONS[from].find((t) => t.to === to && t.by.includes(actor)) ?? null
  );
}

export function canTransition(
  from: TaskStatus,
  to: TaskStatus,
  actor: TransitionActor,
): boolean {
  return findTransition(from, to, actor) !== null;
}
