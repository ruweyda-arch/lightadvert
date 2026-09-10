import Link from "next/link";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  currentEatMonthBounds,
  eatDateIso,
  eatDayStartUtc,
  formatEatDate,
} from "@/lib/dates";
import { filterFieldClass } from "@/lib/ui";
import { getApprovedTaskRows, getRoster } from "@/server/db/contribution";
import { listRoles } from "@/server/db/role";
import {
  summariseContribution,
  type ApprovedTaskRow,
} from "@/server/domain/contribution";

const one = (v: string | string[] | undefined) =>
  typeof v === "string" && v.length > 0 ? v : undefined;

const DAY_MS = 86_400_000;

export default async function AdminReportsPage({
  searchParams,
}: PageProps<"/app/admin/reports">) {
  const sp = await searchParams;
  const roleId = one(sp.role);
  const fromIso = one(sp.from);
  const toIso = one(sp.to);

  const monthDefault = currentEatMonthBounds();
  const range =
    fromIso && toIso
      ? {
          start: eatDayStartUtc(fromIso),
          end: new Date(eatDayStartUtc(toIso).getTime() + DAY_MS),
        }
      : monthDefault;

  const [rows, roster, roles] = await Promise.all([
    getApprovedTaskRows(range.start, range.end, roleId),
    getRoster(),
    listRoles(),
  ]);

  const summary = summariseContribution(rows, roster);
  const byPerson = new Map<string, ApprovedTaskRow[]>();
  for (const r of rows) {
    const list = byPerson.get(r.assigneeId);
    if (list) list.push(r);
    else byPerson.set(r.assigneeId, [r]);
  }

  const exportParams = new URLSearchParams();
  if (fromIso) exportParams.set("from", fromIso);
  if (toIso) exportParams.set("to", toIso);
  if (roleId) exportParams.set("role", roleId);
  const exportHref = `/app/admin/reports/export?${exportParams.toString()}`;

  const fromValue = fromIso ?? eatDateIso(range.start);
  const toValue = toIso ?? eatDateIso(new Date(range.end.getTime() - DAY_MS));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contribution</h1>
        <p className="text-muted-foreground text-sm">
          Per-person point totals over a date range, counted by Approval Date. Sorted by
          total — not a competitive ranking (ADR-0002). Staff never see this.
        </p>
      </div>

      <form
        className="grid gap-2 sm:flex sm:flex-wrap sm:items-end"
        method="get"
      >
        <label className="text-sm">
          <span className="mb-1 block font-medium">From</span>
          <input type="date" name="from" defaultValue={fromValue} className={filterFieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">To</span>
          <input type="date" name="to" defaultValue={toValue} className={filterFieldClass} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Role</span>
          <NativeSelect name="role" defaultValue={roleId ?? ""} className="sm:w-44">
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" variant="secondary">
            Apply
          </Button>
          <Button type="button" asChild size="sm" variant="ghost">
            <Link href="/app/admin/reports">This month</Link>
          </Button>
          <Button asChild size="sm">
            <a href={exportHref}>Download CSV</a>
          </Button>
        </div>
      </form>

      <div className="text-muted-foreground text-sm">
        {formatEatDate(range.start)} – {formatEatDate(new Date(range.end.getTime() - DAY_MS))}{" "}
        · company total <span className="text-foreground font-semibold">{summary.companyTotal}</span> pts
      </div>

      {summary.byRole.length > 0 ? (
        <div className="flex flex-wrap gap-2 text-sm">
          {summary.byRole.map((r) => (
            <span key={r.roleId} className="bg-secondary rounded px-2 py-1">
              {r.roleName}: {r.points}
            </span>
          ))}
        </div>
      ) : null}

      <div className="divide-y rounded-md border">
        {summary.people.map((p) => {
          const tasks = byPerson.get(p.userId) ?? [];
          return (
            <details key={p.userId} className="p-3">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="font-semibold">{p.total} pts</span>
                <span className="text-muted-foreground">
                  {p.taskCount} task{p.taskCount === 1 ? "" : "s"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {p.byRole.map((r) => `${r.roleName} ${r.points}`).join(" · ")}
                </span>
              </summary>
              <div className="mt-2 space-y-1 pl-4 text-sm">
                <Link
                  href={`/app/admin/staff/${p.userId}`}
                  className="text-muted-foreground hover:underline"
                >
                  View {p.name}&apos;s full history →
                </Link>
                {tasks.length > 0 ? (
                  <ul className="space-y-1">
                    {tasks.map((t) => (
                      <li key={t.taskId} className="text-muted-foreground">
                        <Link
                          href={`/app/admin/tasks/${t.taskId}`}
                          className="text-foreground hover:underline"
                        >
                          {t.taskTitle}
                        </Link>{" "}
                        · {t.projectName} · {t.stampedRoleName} · {t.effortPoints} pts ·{" "}
                        {formatEatDate(t.approvalDate)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
