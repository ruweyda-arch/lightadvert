import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { StaffLifecycle } from "@/components/staff-lifecycle";
import { Badge } from "@/components/ui/badge";
import { formatEatDate } from "@/lib/dates";
import { requireUser } from "@/server/auth/guards";
import { getTask } from "@/server/db/task";
import type { TaskStatus } from "@/server/domain/task-status";

import { TaskComments } from "../../admin/tasks/[id]/task-comments";
import { TaskDeliverables } from "../../admin/tasks/[id]/task-deliverables";

export default async function StaffTaskPage({
  params,
}: PageProps<"/app/tasks/[id]">) {
  const session = await requireUser();
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  if (task.assignee.id !== session.user.id && session.user.role !== "ADMIN") {
    redirect("/app");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Link href="/app" className="text-muted-foreground text-sm hover:underline">
          ← My work
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          <Badge variant="outline">{task.status}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {task.project.name} · {task.stampedRole.name} · {task.effortPoints} pts ·{" "}
          {task.priority}
          {task.deadline ? ` · due ${formatEatDate(task.deadline)}` : ""}
        </p>
        {task.brief ? (
          <p className="text-sm whitespace-pre-wrap">{task.brief}</p>
        ) : null}
      </div>

      <StaffLifecycle taskId={task.id} status={task.status as TaskStatus} />

      <TaskDeliverables taskId={task.id} deliverables={task.deliverables} />
      <TaskComments taskId={task.id} comments={task.comments} />
    </div>
  );
}
