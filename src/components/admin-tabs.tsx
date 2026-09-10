"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS: readonly (readonly [string, string])[] = [
  ["/app/admin", "Overview"],
  ["/app/admin/projects", "Projects"],
  ["/app/admin/tasks", "Tasks"],
  ["/app/admin/reports", "Contribution"],
  ["/app/admin/periods", "Pay periods"],
  ["/app/admin/workload", "Workload"],
  ["/app/admin/roles", "Roles"],
  ["/app/admin/staff", "Staff"],
  ["/app/admin/audit", "Audit"],
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/app/admin") return pathname === "/app/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="-mx-2 flex flex-wrap gap-x-1 gap-y-1 border-b pb-2 text-sm">
      {TABS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className={cn(
            "rounded-md px-2 py-1 transition-colors",
            isActive(pathname, href)
              ? "bg-secondary text-secondary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
