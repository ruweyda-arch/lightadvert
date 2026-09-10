import { listAdmins, listStaff } from "@/server/db/staff";
import { listRoles } from "@/server/db/role";

import { AdminRow } from "./admin-row";
import { StaffForm } from "./staff-form";
import { StaffRow } from "./staff-row";

export default async function AdminStaffPage() {
  const [staff, admins, roles] = await Promise.all([
    listStaff(),
    listAdmins(),
    listRoles(),
  ]);
  const formRoles = roles.map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-muted-foreground text-sm">
            Admin creates every account; the person sets their own password from an
            emailed link (docs/prd.md R1–R2).
          </p>
        </div>

        <div className="rounded-md border p-4">
          <h2 className="mb-3 text-sm font-semibold">New staff member</h2>
          <StaffForm roles={formRoles} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Staff members ({staff.length})
        </h2>
        {staff.length === 0 ? (
          <p className="text-muted-foreground text-sm">None yet.</p>
        ) : (
          staff.map((s) => <StaffRow key={s.id} staff={s} roles={formRoles} />)
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">
          Admins ({admins.length})
        </h2>
        {admins.map((a) => (
          <AdminRow key={a.id} admin={a} />
        ))}
        <p className="text-muted-foreground text-xs">
          &ldquo;Make staff&rdquo; needs the account to already hold staff roles. The
          last active Admin is protected (docs/prd.md R5).
        </p>
      </section>
    </div>
  );
}
