"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createTaskAction, recordPastTaskAction } from "@/server/actions/tasks";

import {
  TaskFields,
  type FieldProject,
  type FieldRole,
  type FieldStaff,
} from "./task-fields";

const BACKFILL_STATUSES = ["COMPLETED", "IN_PROGRESS", "REVIEW", "ASSIGNED"] as const;

interface FieldsProps {
  projects: FieldProject[];
  staff: FieldStaff[];
  roles: FieldRole[];
}

function AssignForm(props: FieldsProps) {
  const [state, action, pending] = useActionState(createTaskAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Task assigned.");
      ref.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <TaskFields {...props} />
      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Assign task"}
      </Button>
    </form>
  );
}

function BackfillForm(props: FieldsProps) {
  const [state, action, pending] = useActionState(recordPastTaskAction, null);
  const ref = useRef<HTMLFormElement>(null);
  const [status, setStatus] =
    useState<(typeof BACKFILL_STATUSES)[number]>("COMPLETED");

  useEffect(() => {
    if (state?.ok) {
      toast.success("Past task recorded.");
      ref.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <TaskFields {...props} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bf-status">Status</Label>
          <NativeSelect
            id="bf-status"
            name="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as (typeof BACKFILL_STATUSES)[number])
            }
          >
            {BACKFILL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bf-approval">
            Approval date {status === "COMPLETED" ? "(required)" : "(optional)"}
          </Label>
          <Input
            id="bf-approval"
            name="approvalDate"
            type="date"
            required={status === "COMPLETED"}
          />
        </div>
        <p className="text-muted-foreground text-xs sm:col-span-2">
          Recorded as &ldquo;manually recorded&rdquo; in the audit log. Rejected if the
          approval date is in a locked pay period (docs/prd.md R27).
        </p>
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Record task"}
      </Button>
    </form>
  );
}

export function CreateTaskForm(props: FieldsProps) {
  const [mode, setMode] = useState<"assign" | "backfill">("assign");

  const noTargets =
    props.projects.length === 0 ||
    props.staff.length === 0 ||
    props.roles.length === 0;

  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "assign" ? "default" : "outline"}
          onClick={() => setMode("assign")}
        >
          New task
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "backfill" ? "default" : "outline"}
          onClick={() => setMode("backfill")}
        >
          Record past work
        </Button>
      </div>

      {noTargets ? (
        <p className="text-muted-foreground text-sm">
          Add at least one active project, one active staff member, and one role first.
        </p>
      ) : mode === "assign" ? (
        <AssignForm {...props} />
      ) : (
        <BackfillForm {...props} />
      )}
    </div>
  );
}
