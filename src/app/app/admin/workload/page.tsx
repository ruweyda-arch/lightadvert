import { Badge } from "@/components/ui/badge";
import { workloadByStaff } from "@/server/db/task";
import type { TaskStatus } from "@/server/domain/task-status";

const COLUMNS: TaskStatus[] = [
  "ASSIGNED",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminWorkloadPage() {
  const rows = await workloadByStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workload</h1>
        <p className="text-muted-foreground text-sm">
          Task counts by status for every staff member (docs/prd.md R42).
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="p-2 font-medium whitespace-nowrap">Staff member</th>
              {COLUMNS.map((c) => (
                <th
                  key={c}
                  className="p-2 text-right font-medium whitespace-nowrap capitalize"
                >
                  {c.replace("_", " ").toLowerCase()}
                </th>
              ))}
              <th className="p-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = COLUMNS.reduce((s, c) => s + (r.counts[c] ?? 0), 0);
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    {r.name}
                    {r.status === "DEACTIVATED" ? (
                      <Badge variant="secondary" className="ml-2">
                        deactivated
                      </Badge>
                    ) : null}
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c} className="text-muted-foreground p-2 text-right">
                      {r.counts[c] ?? 0}
                    </td>
                  ))}
                  <td className="p-2 text-right font-semibold">{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
