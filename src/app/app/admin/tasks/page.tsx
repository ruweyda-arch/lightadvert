import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatEatDate } from "@/lib/dates";
import { listRoles } from "@/server/db/role";
import {
  assignableProjects,
  assignableStaff,
  listTasks,
  type TaskFilters,
} from "@/server/db/task";
import type { TaskStatus } from "@/server/domain/task-status";

import { CreateTaskForm } from "./create-task-form";

const STATUSES: TaskStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "CANCELLED",
];

const one = (v: string | string[] | undefined) =>
  typeof v === "string" && v.length > 0 ? v : undefined;

const selectClass =
  "border-input h-9 rounded-md border bg-transparent px-2 text-sm";

export default async function AdminTasksPage({
  searchParams,
}: PageProps<"/app/admin/tasks">) {
  const sp = await searchParams;
  const statusParam = one(sp.status);
  const filters: TaskFilters = {
    projectId: one(sp.project),
    assigneeId: one(sp.assignee),
    stampedRoleId: one(sp.role),
    status: STATUSES.includes(statusParam as TaskStatus)
      ? (statusParam as TaskStatus)
      : undefined,
  };

  const [tasks, projects, staff, roles] = await Promise.all([
    listTasks(filters),
    assignableProjects(),
    assignableStaff(),
    listRoles(),
  ]);
  const formRoles = roles.map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm">
          Assign work, then move it Assigned → In Progress → Review → Completed. Only the
          assignee submits for review; only an Admin approves (docs/prd.md R22).
        </p>
      </div>

      <CreateTaskForm projects={projects} staff={staff} roles={formRoles} />

      <form className="flex flex-wrap items-end gap-2" method="get">
        <select name="status" defaultValue={statusParam ?? ""} className={selectClass}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select name="project" defaultValue={filters.projectId ?? ""} className={selectClass}>
          <option value="">Any project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="assignee" defaultValue={filters.assigneeId ?? ""} className={selectClass}>
          <option value="">Any assignee</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="role" defaultValue={filters.stampedRoleId ?? ""} className={selectClass}>
          <option value="">Any role</option>
          {formRoles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/admin/tasks">Clear</Link>
        </Button>
      </form>

      <div className="divide-y rounded-md border">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground p-4 text-sm">No tasks match.</p>
        ) : (
          tasks.map((t) => (
            <Link
              key={t.id}
              href={`/app/admin/tasks/${t.id}`}
              className="hover:bg-muted/40 flex flex-wrap items-center gap-3 p-3 text-sm"
            >
              <span className="min-w-56 font-medium">{t.title}</span>
              <Badge variant="outline">{t.status}</Badge>
              <span className="text-muted-foreground">
                {t.project.name} · {t.assignee.name} · {t.stampedRole.name} ·{" "}
                {t.effortPoints} pts
              </span>
              {t.deadline ? (
                <span className="text-muted-foreground text-xs">
                  due {formatEatDate(t.deadline)}
                </span>
              ) : null}
              {t.manuallyRecorded ? (
                <span className="text-xs text-amber-600">manual</span>
              ) : null}
              <span className="text-muted-foreground ml-auto text-xs">
                {t._count.deliverables} deliv · {t._count.comments} comm
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
