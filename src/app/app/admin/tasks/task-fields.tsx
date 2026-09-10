"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

export const EFFORT_SCALE = [1, 2, 3, 5, 8, 13] as const;
export const TASK_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export interface FieldRole {
  id: string;
  name: string;
}
export interface FieldProject {
  id: string;
  name: string;
}
export interface FieldStaff {
  id: string;
  name: string;
  staffProfile: {
    primaryRoleId: string;
    roleAssignments: { roleId: string }[];
  } | null;
}

/** The common Task fields, shared by the assign form and the backfill form. */
export function TaskFields({
  projects,
  staff,
  roles,
}: {
  projects: FieldProject[];
  staff: FieldStaff[];
  roles: FieldRole[];
}) {
  const [assigneeId, setAssigneeId] = useState("");
  const [stampedRoleId, setStampedRoleId] = useState("");

  const assignee = staff.find((s) => s.id === assigneeId);
  const heldRoleIds = new Set(
    assignee?.staffProfile?.roleAssignments.map((r) => r.roleId) ?? [],
  );
  const mismatch = Boolean(
    stampedRoleId && assignee && !heldRoleIds.has(stampedRoleId),
  );

  function onAssignee(v: string) {
    setAssigneeId(v);
    const s = staff.find((x) => x.id === v);
    if (s?.staffProfile) setStampedRoleId(s.staffProfile.primaryRoleId);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="tf-title">Title</Label>
        <Input id="tf-title" name="title" required maxLength={200} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="tf-project">Project</Label>
          <NativeSelect id="tf-project" name="projectId" required>
            <option value="">Select…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-assignee">Assignee</Label>
          <NativeSelect
            id="tf-assignee"
            name="assigneeId"
            required
            value={assigneeId}
            onChange={(e) => onAssignee(e.target.value)}
          >
            <option value="">Select…</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-role">Stamped role</Label>
          <NativeSelect
            id="tf-role"
            name="stampedRoleId"
            required
            value={stampedRoleId}
            onChange={(e) => setStampedRoleId(e.target.value)}
          >
            <option value="">Select…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </NativeSelect>
          {mismatch ? (
            <p className="text-xs text-amber-600">
              Not one of {assignee?.name}&apos;s roles — allowed, but double-check.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-effort">Effort (points)</Label>
          <NativeSelect id="tf-effort" name="effortPoints" required>
            {EFFORT_SCALE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-type">Type (optional)</Label>
          <Input id="tf-type" name="type" maxLength={60} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-priority">Priority</Label>
          <NativeSelect id="tf-priority" name="priority" defaultValue="NORMAL">
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p[0] + p.slice(1).toLowerCase()}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tf-deadline">Deadline (optional)</Label>
          <Input id="tf-deadline" name="deadline" type="date" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-brief">Brief (optional)</Label>
        <Textarea id="tf-brief" name="brief" rows={2} maxLength={2000} />
      </div>
    </div>
  );
}
