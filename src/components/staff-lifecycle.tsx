"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { transitionTaskAction } from "@/server/actions/tasks";
import { findTransition, type TaskStatus } from "@/server/domain/task-status";

const LABEL: Record<string, string> = {
  IN_PROGRESS: "Start",
  REVIEW: "Submit for review",
};

/** The assignee-side transitions: start work, submit for review (docs/prd.md R22). */
export function StaffLifecycle({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const [state, action, pending] = useActionState(transitionTaskAction, null);

  useEffect(() => {
    if (state?.ok) toast.success("Updated.");
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  const moves = (["IN_PROGRESS", "REVIEW"] as const).filter((to) =>
    findTransition(status, to, "ASSIGNEE"),
  );
  if (moves.length === 0) return null;

  return (
    <div className="flex gap-2">
      {moves.map((to) => (
        <form key={to} action={action}>
          <input type="hidden" name="id" value={taskId} />
          <input type="hidden" name="to" value={to} />
          <Button type="submit" size="sm" disabled={pending}>
            {LABEL[to]}
          </Button>
        </form>
      ))}
    </div>
  );
}
