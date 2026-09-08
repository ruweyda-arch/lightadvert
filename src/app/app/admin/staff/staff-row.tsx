"use client";

import { useState } from "react";

import { ActionButton } from "@/components/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  resendSetPasswordAction,
  setStaffAccountRoleAction,
  setStaffStatusAction,
} from "@/server/actions/staff";
import type { StaffRow as StaffRowData } from "@/server/db/staff";

import { StaffForm, type StaffFormRole } from "./staff-form";

export function StaffRow({
  staff,
  roles,
}: {
  staff: StaffRowData;
  roles: StaffFormRole[];
}) {
  const [editing, setEditing] = useState(false);
  const profile = staff.staffProfile;
  const roleNames = profile?.roleAssignments.map((a) => a.role.name) ?? [];
  const active = staff.status === "ACTIVE";

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-48">
          <div className="font-medium">{staff.name}</div>
          <div className="text-muted-foreground text-xs">{staff.email}</div>
        </div>

        <Badge variant={active ? "default" : "secondary"}>{staff.status}</Badge>

        <div className="text-sm">
          {roleNames.length ? roleNames.join(", ") : "—"}
          {profile ? (
            <span className="text-muted-foreground">
              {" "}
              · primary: {profile.primaryRole.name}
            </span>
          ) : null}
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
            {editing ? "Close" : "Edit"}
          </Button>
          <ActionButton
            run={() =>
              setStaffStatusAction(staff.id, active ? "DEACTIVATED" : "ACTIVE")
            }
            successMessage="Status updated."
            confirm={active ? `Deactivate ${staff.name}?` : undefined}
          >
            {active ? "Deactivate" : "Reactivate"}
          </ActionButton>
          <ActionButton
            run={() => setStaffAccountRoleAction(staff.id, "ADMIN")}
            successMessage="Promoted to Admin."
            confirm={`Promote ${staff.name} to Admin?`}
          >
            Make admin
          </ActionButton>
          <ActionButton
            run={() => resendSetPasswordAction(staff.id)}
            variant="ghost"
            successMessage="Set-password email sent."
          >
            Resend invite
          </ActionButton>
        </div>
      </div>

      {editing ? (
        <div className="bg-muted/30 rounded-md p-4">
          <StaffForm
            roles={roles}
            staff={{
              id: staff.id,
              name: staff.name,
              email: staff.email,
              roleIds: profile?.roleAssignments.map((a) => a.roleId) ?? [],
              primaryRoleId: profile?.primaryRoleId ?? "",
            }}
            onDone={() => setEditing(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
