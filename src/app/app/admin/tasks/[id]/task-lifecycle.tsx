"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transitionTaskAction } from "@/server/actions/tasks";
import { allowedTransitions, type TaskStatus } from "@/server/domain/task-status";

const LABEL: Record<string, string> = {
  IN_PROGRESS: "Send back to In Progress",
  REVIEW: "Move to Review",
  COMPLETED: "Approve (complete)",
  CANCELLED: "Cancel",
};

export function TaskLifecycle({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatus;
}) {
  const [state, action, pending] = useActionState(transitionTaskAction, null);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (state?.ok) toast.success("Task updated.");
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  const adminMoves = allowedTransitions(status).filter((t) => t.by.includes("ADMIN"));

  if (adminMoves.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {status === "CANCELLED"
          ? "This task is cancelled."
          : "This task is completed. Cancelling an approved task needs a reason."}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {adminMoves.map((t) =>
        t.reasonRequired ? (
          <form key={t.to} action={action} className="flex items-center gap-2">
            <input type="hidden" name="id" value={taskId} />
            <input type="hidden" name="to" value={t.to} />
            <Input
              name="reason"
              placeholder="Reason to cancel an approved task"
              required
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-72"
            />
            <Button type="submit" variant="destructive" size="sm" disabled={pending}>
              {LABEL[t.to]}
            </Button>
          </form>
        ) : (
          <form key={t.to} action={action}>
            <input type="hidden" name="id" value={taskId} />
            <input type="hidden" name="to" value={t.to} />
            <Button
              type="submit"
              size="sm"
              variant={t.to === "COMPLETED" ? "default" : "outline"}
              disabled={pending}
            >
              {LABEL[t.to]}
            </Button>
          </form>
        ),
      )}
      {status === "IN_PROGRESS" ? (
        <span className="text-muted-foreground text-xs">
          Waiting for the assignee to submit for review.
        </span>
      ) : null}
      {status === "ASSIGNED" ? (
        <span className="text-muted-foreground text-xs">
          Waiting for the assignee to start.
        </span>
      ) : null}
    </div>
  );
}
