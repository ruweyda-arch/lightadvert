import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { eatMonthKey, formatEatDate } from "@/lib/dates";
import { getPersonApprovedTasks } from "@/server/db/contribution";
import { getStaffUser } from "@/server/db/staff";

type PersonTask = Awaited<ReturnType<typeof getPersonApprovedTasks>>[number];

export default async function StaffContributionPage({
  params,
}: PageProps<"/app/admin/staff/[id]">) {
  const { id } = await params;
  const user = await getStaffUser(id);
  if (!user) notFound();

  const tasks = await getPersonApprovedTasks(id);

  const byMonth = new Map<string, { total: number; tasks: PersonTask[] }>();
  for (const t of tasks) {
    const key = eatMonthKey(t.approvalDate as Date);
    const bucket = byMonth.get(key) ?? { total: 0, tasks: [] };
    bucket.total += t.effortPoints;
    bucket.tasks.push(t);
    byMonth.set(key, bucket);
  }
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const lifetime = tasks.reduce((s, t) => s + t.effortPoints, 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/app/admin/staff"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Staff
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
            {user.status}
          </Badge>
          <span className="text-muted-foreground text-sm">{user.email}</span>
        </div>
        <p className="text-muted-foreground text-sm">
          Contribution across all periods · lifetime{" "}
          <span className="text-foreground font-semibold">{lifetime}</span> pts from{" "}
          {tasks.length} approved task{tasks.length === 1 ? "" : "s"}.
        </p>
      </div>

      {months.length === 0 ? (
        <p className="text-muted-foreground text-sm">No approved tasks yet.</p>
      ) : (
        <div className="space-y-4">
          {months.map(([month, bucket]) => (
            <div key={month} className="rounded-md border p-3">
              <div className="mb-2 text-sm font-semibold">
                {month} · {bucket.total} pts · {bucket.tasks.length} task
                {bucket.tasks.length === 1 ? "" : "s"}
              </div>
              <ul className="space-y-1 text-sm">
                {bucket.tasks.map((t) => (
                  <li key={t.id} className="text-muted-foreground">
                    <Link
                      href={`/app/admin/tasks/${t.id}`}
                      className="text-foreground hover:underline"
                    >
                      {t.title}
                    </Link>{" "}
                    · {t.project.name} · {t.stampedRole.name} · {t.effortPoints} pts ·{" "}
                    {formatEatDate(t.approvalDate as Date)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
