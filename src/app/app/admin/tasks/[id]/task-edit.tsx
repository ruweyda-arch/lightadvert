"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  reassignTaskAction,
  updateEstimateAction,
  updateStampedRoleAction,
  updateTaskDetailsAction,
} from "@/server/actions/tasks";
import type { ActionResult } from "@/server/actions/result";

import { EFFORT_SCALE, TASK_PRIORITIES } from "../task-fields";

const selectClass =
  "border-input h-9 w-full rounded-md border bg-transparent px-2 text-sm";

function useToasted(state: ActionResult | null, message: string) {
  useEffect(() => {
    if (state?.ok) toast.success(message);
    else if (state && !state.ok) toast.error(state.error);
  }, [state, message]);
}

export interface TaskEditData {
  id: string;
  title: string;
  projectId: string;
  type: string | null;
  deadline: string | null;
  priority: string;
  brief: string | null;
  effortPoints: number;
  assigneeId: string;
  stampedRoleId: string;
  audited: boolean;
}

export function TaskEdit({
  task,
  projects,
  staff,
  roles,
}: {
  task: TaskEditData;
  projects: { id: string; name: string }[];
  staff: { id: string; name: string }[];
  roles: { id: string; name: string }[];
}) {
  const [details, detailsAction, detailsPending] = useActionState(
    updateTaskDetailsAction,
    null,
  );
  const [est, estAction, estPending] = useActionState(updateEstimateAction, null);
  const [re, reAction, rePending] = useActionState(reassignTaskAction, null);
  const [role, roleAction, rolePending] = useActionState(
    updateStampedRoleAction,
    null,
  );

  useToasted(details, "Details saved.");
  useToasted(est, "Estimate updated.");
  useToasted(re, "Task reassigned.");
  useToasted(role, "Stamped role updated.");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={detailsAction} className="space-y-3 rounded-md border p-4">
        <h3 className="text-sm font-semibold">Details (not audited)</h3>
        <input type="hidden" name="id" value={task.id} />
        <div className="space-y-1.5">
          <Label htmlFor="te-title">Title</Label>
          <Input id="te-title" name="title" defaultValue={task.title} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="te-project">Project</Label>
            <select
              id="te-project"
              name="projectId"
              defaultValue={task.projectId}
              className={selectClass}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="te-priority">Priority</Label>
            <select
              id="te-priority"
              name="priority"
              defaultValue={task.priority}
              className={selectClass}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p[0] + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="te-type">Type</Label>
            <Input id="te-type" name="type" defaultValue={task.type ?? ""} maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="te-deadline">Deadline</Label>
            <Input
              id="te-deadline"
              name="deadline"
              type="date"
              defaultValue={task.deadline ?? ""}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="te-brief">Brief</Label>
          <Textarea
            id="te-brief"
            name="brief"
            defaultValue={task.brief ?? ""}
            rows={2}
            maxLength={2000}
          />
        </div>
        <Button type="submit" size="sm" disabled={detailsPending}>
          Save details
        </Button>
      </form>

      <div className="space-y-6">
        <form action={estAction} className="space-y-3 rounded-md border p-4">
          <h3 className="text-sm font-semibold">Effort estimate</h3>
          <input type="hidden" name="id" value={task.id} />
          <select
            name="effortPoints"
            defaultValue={task.effortPoints}
            className={selectClass}
          >
            {EFFORT_SCALE.map((n) => (
              <option key={n} value={n}>
                {n} points
              </option>
            ))}
          </select>
          {task.audited ? (
            <Input name="reason" placeholder="Reason (required)" required />
          ) : null}
          <Button type="submit" size="sm" disabled={estPending}>
            Update estimate
          </Button>
        </form>

        <form action={reAction} className="space-y-3 rounded-md border p-4">
          <h3 className="text-sm font-semibold">Reassign</h3>
          <input type="hidden" name="id" value={task.id} />
          <select name="assigneeId" defaultValue={task.assigneeId} className={selectClass}>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {task.audited ? (
            <Input name="reason" placeholder="Reason (required)" required />
          ) : null}
          <Button type="submit" size="sm" disabled={rePending}>
            Reassign
          </Button>
        </form>

        <form action={roleAction} className="space-y-3 rounded-md border p-4">
          <h3 className="text-sm font-semibold">Stamped role</h3>
          <input type="hidden" name="id" value={task.id} />
          <select
            name="stampedRoleId"
            defaultValue={task.stampedRoleId}
            className={selectClass}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {task.audited ? (
            <Input name="reason" placeholder="Reason (required)" required />
          ) : null}
          <Button type="submit" size="sm" disabled={rolePending}>
            Update role
          </Button>
        </form>
      </div>
    </div>
  );
}
