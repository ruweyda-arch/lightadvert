import { AdminTabs } from "@/components/admin-tabs";
import { requireAdmin } from "@/server/auth/guards";

export default async function AdminLayout({ children }: LayoutProps<"/app/admin">) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminTabs />
      {children}
    </div>
  );
}
