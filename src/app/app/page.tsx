import Link from "next/link";

import { StaffLifecycle } from "@/components/staff-lifecycle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eatMonthKey, formatEatDate } from "@/lib/dates";
import { requireUser } from "@/server/auth/guards";
import { getPersonApprovedTasks } from "@/server/db/contribution";
import { listTasks } from "@/server/db/task";
import type { TaskStatus } from "@/server/domain/task-status";

const OPEN: TaskStatus[] = ["ASSIGNED", "IN_PROGRESS", "REVIEW"];
const DONE: TaskStatus[] = ["COMPLETED", "CANCELLED"];

export default async function AppHome() {
  const session = await requireUser();

  if (session.user.role === "ADMIN") {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name}
        </h1>
        <p className="text-muted-foreground text-sm">You&apos;re an administrator.</p>
        <Button asChild>
          <Link href="/app/admin">Open the admin dashboard</Link>
        </Button>
      </div>
    );
  }

  const [tasks, approved] = await Promise.all([
    listTasks({ assigneeId: session.user.id }),
    getPersonApprovedTasks(session.user.id),
  ]);

  const monthKey = eatMonthKey(new Date());
  const thisMonth = approved
    .filter((t) => eatMonthKey(t.approvalDate as Date) === monthKey)
    .reduce((s, t) => s + t.effortPoints, 0);
  const lifetime = approved.reduce((s, t) => s + t.effortPoints, 0);

  const open = tasks.filter((t) => OPEN.includes(t.status as TaskStatus));
  const done = tasks.filter((t) => DONE.includes(t.status as TaskStatus));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {session.user.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Your contribution this month:{" "}
          <span className="text-foreground font-semibold">{thisMonth}</span> pts · lifetime{" "}
          {lifetime} pts. You only ever see your own numbers.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Open ({open.length})</h2>
        {open.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing assigned right now.</p>
        ) : (
          open.map((t) => (
            <div key={t.id} className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/app/tasks/${t.id}`}
                  className="font-medium hover:underline"
                >
                  {t.title}
                </Link>
                <Badge variant="outline">{t.status}</Badge>
                <span className="text-muted-foreground">
                  {t.project.name} · {t.stampedRole.name} · {t.effortPoints} pts
                </span>
                {t.deadline ? (
                  <span className="text-muted-foreground text-xs">
                    due {formatEatDate(t.deadline)}
                  </span>
                ) : null}
              </div>
              <StaffLifecycle taskId={t.id} status={t.status as TaskStatus} />
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Recent ({done.length})</h2>
        {done.length === 0 ? (
          <p className="text-muted-foreground text-sm">None yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {done.map((t) => (
              <li key={t.id} className="text-muted-foreground">
                <Link
                  href={`/app/tasks/${t.id}`}
                  className="text-foreground hover:underline"
                >
                  {t.title}
                </Link>{" "}
                · {t.status} · {t.stampedRole.name} · {t.effortPoints} pts
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
