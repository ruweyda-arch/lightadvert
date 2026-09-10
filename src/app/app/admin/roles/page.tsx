import { listRoles } from "@/server/db/role";

import { CreateRoleForm } from "./create-role-form";
import { RoleRow } from "./role-row";
import { TaskTypesSection } from "./task-types-section";

export default async function AdminRolesPage() {
  const roles = await listRoles();

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-muted-foreground text-sm">
            The creative specialties. A role in use by any staff member or task cannot be
            deleted (docs/prd.md R10).
          </p>
        </div>

        <CreateRoleForm />

        <div className="divide-y rounded-md border">
          {roles.map((role, i) => (
            <RoleRow
              key={role.id}
              role={role}
              first={i === 0}
              last={i === roles.length - 1}
            />
          ))}
        </div>
      </section>

      <TaskTypesSection roles={roles} />
    </div>
  );
}
