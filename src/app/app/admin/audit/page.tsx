import Link from "next/link";

import { Button } from "@/components/ui/button";
import { eatDayStartUtc, formatEatDate } from "@/lib/dates";
import { listActorOptions, listAuditEntries } from "@/server/db/audit";
import { AUDIT_EVENT_TYPES, type AuditEventType } from "@/server/domain/audit";

const DAY_MS = 86_400_000;
const one = (v: string | string[] | undefined) =>
  typeof v === "string" && v.length > 0 ? v : undefined;
const selectClass =
  "border-input h-9 rounded-md border bg-transparent px-2 text-sm";

export default async function AdminAuditPage({
  searchParams,
}: PageProps<"/app/admin/audit">) {
  const sp = await searchParams;
  const actorId = one(sp.actor);
  const eventParam = one(sp.event);
  const eventType = AUDIT_EVENT_TYPES.includes(eventParam as AuditEventType)
    ? (eventParam as AuditEventType)
    : undefined;
  const fromIso = one(sp.from);
  const toIso = one(sp.to);

  const [entries, actors] = await Promise.all([
    listAuditEntries(
      {
        actorId,
        eventType,
        from: fromIso ? eatDayStartUtc(fromIso) : undefined,
        to: toIso ? new Date(eatDayStartUtc(toIso).getTime() + DAY_MS) : undefined,
      },
      300,
    ),
    listActorOptions(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-muted-foreground text-sm">
          Every pay-affecting change, newest first. Append-only, retained indefinitely
          (docs/prd.md R44–R45). The same entries appear inline on each task.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-2" method="get">
        <select name="event" defaultValue={eventParam ?? ""} className={selectClass}>
          <option value="">Any event</option>
          {AUDIT_EVENT_TYPES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select name="actor" defaultValue={actorId ?? ""} className={selectClass}>
          <option value="">Any actor</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={fromIso ?? ""} className={selectClass} />
        <input type="date" name="to" defaultValue={toIso ?? ""} className={selectClass} />
        <Button type="submit" size="sm" variant="secondary">
          Filter
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/app/admin/audit">Clear</Link>
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2 font-medium">When</th>
              <th className="p-2 font-medium">Event</th>
              <th className="p-2 font-medium">Actor</th>
              <th className="p-2 font-medium">Task</th>
              <th className="p-2 font-medium">Change</th>
              <th className="p-2 font-medium">Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="text-muted-foreground p-2" colSpan={6}>
                  No entries match.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-t align-top">
                  <td className="text-muted-foreground p-2 font-mono text-xs">
                    {formatEatDate(e.createdAt)}
                  </td>
                  <td className="p-2 font-medium">{e.eventType}</td>
                  <td className="p-2">{e.actor.name}</td>
                  <td className="p-2">
                    {e.task ? (
                      <Link
                        href={`/app/admin/tasks/${e.task.id}`}
                        className="hover:underline"
                      >
                        {e.task.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-muted-foreground p-2">
                    {e.field ? `${e.field}: ` : ""}
                    {e.oldValue || e.newValue
                      ? `${e.oldValue ?? "—"} → ${e.newValue ?? "—"}`
                      : "—"}
                  </td>
                  <td className="text-muted-foreground p-2">
                    {e.reason ? `“${e.reason}”` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
