"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addTaskTypeAction, removeTaskTypeAction } from "@/server/actions/roles";
import type { RoleWithCounts } from "@/server/db/role";

function AddTaskTypeForm({ roleId }: { roleId: string }) {
  const [state, action, pending] = useActionState(addTaskTypeAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="flex items-center gap-2">
      <input type="hidden" name="roleId" value={roleId} />
      <Input name="label" placeholder="Add a task type" maxLength={60} className="w-56" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Add
      </Button>
    </form>
  );
}

export function TaskTypesSection({ roles }: { roles: RoleWithCounts[] }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Task types</h2>
        <p className="text-muted-foreground text-sm">
          Suggested labels per role. Not constrained and not used for report filtering
          (docs/prd.md R19).
        </p>
      </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div key={role.id} className="space-y-2 rounded-md border p-3">
            <div className="font-medium">{role.name}</div>
            <div className="flex flex-wrap gap-2">
              {role.taskTypes.length === 0 ? (
                <span className="text-muted-foreground text-sm">None yet.</span>
              ) : (
                role.taskTypes.map((tt) => (
                  <span
                    key={tt.id}
                    className="bg-secondary flex items-center gap-1 rounded px-2 py-1 text-sm"
                  >
                    {tt.label}
                    <ActionButton
                      run={() => removeTaskTypeAction(tt.id)}
                      variant="ghost"
                      size="sm"
                    >
                      ✕
                    </ActionButton>
                  </span>
                ))
              )}
            </div>
            <AddTaskTypeForm roleId={role.id} />
          </div>
        ))}
      </div>
    </section>
  );
}
