"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteRoleAction,
  renameRoleAction,
  reorderRoleAction,
} from "@/server/actions/roles";
import type { RoleWithCounts } from "@/server/db/role";

export function RoleRow({
  role,
  first,
  last,
}: {
  role: RoleWithCounts;
  first: boolean;
  last: boolean;
}) {
  const [state, action, pending] = useActionState(renameRoleAction, null);

  useEffect(() => {
    if (state?.ok) toast.success("Role renamed.");
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  const people = role._count.roleAssignments;
  const tasks = role._count.stampedTasks;
  const locked = role.isSeed || people > 0 || tasks > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 p-3">
      <div className="flex flex-col">
        <ActionButton
          run={() => reorderRoleAction(role.id, "up")}
          disabled={first}
          size="sm"
          variant="ghost"
        >
          ▲
        </ActionButton>
        <ActionButton
          run={() => reorderRoleAction(role.id, "down")}
          disabled={last}
          size="sm"
          variant="ghost"
        >
          ▼
        </ActionButton>
      </div>

      <form action={action} className="flex items-center gap-2">
        <input type="hidden" name="id" value={role.id} />
        <Input
          name="name"
          defaultValue={role.name}
          required
          maxLength={60}
          className="w-56"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Save
        </Button>
      </form>

      <span className="text-muted-foreground text-sm">
        {people} {people === 1 ? "person" : "people"} · {tasks} task
        {tasks === 1 ? "" : "s"}
        {role.isSeed ? " · seed" : ""}
      </span>

      <div className="ml-auto">
        <ActionButton
          run={() => deleteRoleAction(role.id)}
          confirm={`Delete the "${role.name}" role?`}
          successMessage="Role deleted."
          variant="destructive"
          disabled={locked}
        >
          Delete
        </ActionButton>
      </div>
    </div>
  );
}
