import Link from "next/link";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/app/admin/tasks",
    title: "Tasks",
    body: "Assign work, run it through the approval gate, edit with an audit trail, record past work.",
  },
  {
    href: "/app/admin/projects",
    title: "Projects",
    body: "Group tasks under a project with a deadline and priority. Archive when done.",
  },
  {
    href: "/app/admin/reports",
    title: "Contribution",
    body: "Per-person point totals for any date range, filterable by role. Export CSV.",
  },
  {
    href: "/app/admin/periods",
    title: "Pay periods",
    body: "Lock a month once payment is settled so its totals can't drift. Unlock needs a reason.",
  },
  {
    href: "/app/admin/workload",
    title: "Workload",
    body: "Task counts by status for every staff member.",
  },
  {
    href: "/app/admin/staff",
    title: "Staff",
    body: "Create accounts, assign roles, deactivate, promote or demote admins.",
  },
  {
    href: "/app/admin/roles",
    title: "Roles",
    body: "Manage the creative specialties and their suggested task types.",
  },
  {
    href: "/app/admin/audit",
    title: "Audit log",
    body: "Every pay-affecting change, filterable by event, actor, and date.",
  },
];

export default function AdminOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <p className="text-muted-foreground text-sm">
          Manage staff, assign and approve work, and produce the contribution report
          that informs pay.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="hover:border-foreground/20 h-full transition-colors">
              <CardHeader>
                <CardTitle className="text-base group-hover:underline">
                  {s.title}
                </CardTitle>
                <CardDescription>{s.body}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
