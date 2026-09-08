"use client";

import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";
import {
  setStaffAccountRoleAction,
  setStaffStatusAction,
} from "@/server/actions/staff";

export function AdminRow({
  admin,
}: {
  admin: { id: string; name: string; email: string; status: string };
}) {
  const active = admin.status === "ACTIVE";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3 text-sm">
      <span className="font-medium">{admin.name}</span>
      <span className="text-muted-foreground">{admin.email}</span>
      <Badge variant={active ? "default" : "secondary"}>{admin.status}</Badge>
      <div className="ml-auto flex gap-2">
        <ActionButton
          run={() => setStaffAccountRoleAction(admin.id, "STAFF")}
          confirm={`Demote ${admin.name} to staff?`}
          successMessage="Demoted to staff."
        >
          Make staff
        </ActionButton>
        <ActionButton
          run={() =>
            setStaffStatusAction(admin.id, active ? "DEACTIVATED" : "ACTIVE")
          }
          confirm={active ? `Deactivate ${admin.name}?` : undefined}
          successMessage="Status updated."
        >
          {active ? "Deactivate" : "Reactivate"}
        </ActionButton>
      </div>
    </div>
  );
}
