import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { formatEatDate } from "@/lib/dates";
import { listRoles } from "@/server/db/role";
import { assignableProjects, assignableStaff, getTask } from "@/server/db/task";
import type { TaskStatus } from "@/server/domain/task-status";

import { DeleteTaskButton } from "./delete-task-button";
import { TaskComments } from "./task-comments";
import { TaskDeliverables } from "./task-deliverables";
import { TaskEdit } from "./task-edit";
import { TaskLifecycle } from "./task-lifecycle";

export default async function TaskDetailPage({
  params,
}: PageProps<"/app/admin/tasks/[id]">) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();

  const [projects, staff, roles] = await Promise.all([
    assignableProjects(),
    assignableStaff(),
    listRoles(),
  ]);

  const status = task.status as TaskStatus;
  const audited = status !== "ASSIGNED";
  const deletable = ["ASSIGNED", "IN_PROGRESS", "REVIEW"].includes(status);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Link
          href="/app/admin/tasks"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Tasks
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <Badge variant="outline">{task.status}</Badge>
          {task.manuallyRecorded ? (
            <span className="text-xs text-amber-600">manually recorded</span>
          ) : null}
        </div>
        <p className="text-muted-foreground text-sm">
          {task.project.name} · {task.assignee.name} ({task.assignee.email}) ·{" "}
          {task.stampedRole.name} · {task.effortPoints} pts · {task.priority}
          {task.deadline ? ` · due ${formatEatDate(task.deadline)}` : ""}
        </p>
        {task.approvalDate ? (
          <p className="text-muted-foreground text-sm">
            Approved {formatEatDate(task.approvalDate)}
            {task.approvedBy ? ` by ${task.approvedBy.name}` : ""}
          </p>
        ) : null}
        {task.brief ? (
          <p className="text-sm whitespace-pre-wrap">{task.brief}</p>
        ) : null}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Lifecycle</h2>
        <TaskLifecycle taskId={task.id} status={status} />
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Edit</h2>
        <TaskEdit
          task={{
            id: task.id,
            title: task.title,
            projectId: task.project.id,
            type: task.type,
            deadline: task.deadline
              ? task.deadline.toISOString().slice(0, 10)
              : null,
            priority: task.priority,
            brief: task.brief,
            effortPoints: task.effortPoints,
            assigneeId: task.assignee.id,
            stampedRoleId: task.stampedRole.id,
            audited,
          }}
          projects={projects}
          staff={staff.map((s) => ({ id: s.id, name: s.name }))}
          roles={roles.map((r) => ({ id: r.id, name: r.name }))}
        />
      </section>

      <TaskDeliverables taskId={task.id} deliverables={task.deliverables} />
      <TaskComments taskId={task.id} comments={task.comments} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Audit trail</h2>
        {task.auditEntries.length === 0 ? (
          <p className="text-muted-foreground text-sm">No audited changes.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {task.auditEntries.map((a) => (
              <li key={a.id} className="text-muted-foreground">
                <span className="font-mono text-xs">{formatEatDate(a.createdAt)}</span>{" "}
                <span className="text-foreground font-medium">{a.eventType}</span> ·{" "}
                {a.actor.name}
                {a.field ? ` · ${a.field}` : ""}
                {a.oldValue || a.newValue
                  ? ` · ${a.oldValue ?? "—"} → ${a.newValue ?? "—"}`
                  : ""}
                {a.reason ? ` · “${a.reason}”` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {deletable ? (
        <section>
          <DeleteTaskButton taskId={task.id} />
        </section>
      ) : null}
    </div>
  );
}
