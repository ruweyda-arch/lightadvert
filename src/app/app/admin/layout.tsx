import Link from "next/link";

import { requireAdmin } from "@/server/auth/guards";

const TABS = [
  ["/app/admin", "Overview"],
  ["/app/admin/projects", "Projects"],
  ["/app/admin/tasks", "Tasks"],
  ["/app/admin/reports", "Contribution"],
  ["/app/admin/periods", "Pay periods"],
  ["/app/admin/workload", "Workload"],
  ["/app/admin/roles", "Roles"],
  ["/app/admin/staff", "Staff"],
  ["/app/admin/audit", "Audit"],
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/app/admin">) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b pb-2 text-sm">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="text-muted-foreground hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
