"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createRoleAction } from "@/server/actions/roles";

export function CreateRoleForm() {
  const [state, action, pending] = useActionState(createRoleAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      toast.success("Role added.");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-1.5">
      <div className="flex flex-wrap items-start gap-2">
        <Input
          name="name"
          placeholder="New role name"
          required
          maxLength={60}
          aria-label="New role name"
          className="w-full sm:max-w-xs"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add role"}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}
    </form>
  );
}
