"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStaffAction, updateStaffAction } from "@/server/actions/staff";

export interface StaffFormRole {
  id: string;
  name: string;
}

export interface StaffFormValue {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  primaryRoleId: string;
}

export function StaffForm({
  roles,
  staff,
  onDone,
}: {
  roles: StaffFormRole[];
  staff?: StaffFormValue;
  onDone?: () => void;
}) {
  const isEdit = Boolean(staff);
  const [state, action, pending] = useActionState(
    isEdit ? updateStaffAction : createStaffAction,
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(staff?.roleIds ?? []),
  );
  const [primary, setPrimary] = useState(staff?.primaryRoleId ?? "");

  useEffect(() => {
    if (state?.ok) {
      toast.success(isEdit ? "Staff member updated." : "Staff member added — a set-password email was sent.");
      onDone?.();
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state, isEdit, onDone]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
    setPrimary((p) => (next.has(p) ? p : ([...next][0] ?? "")));
  }

  return (
    <form action={action} className="max-w-md space-y-3">
      {isEdit ? <input type="hidden" name="id" value={staff!.id} /> : null}
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="roleIds" value={id} />
      ))}
      <input type="hidden" name="primaryRoleId" value={primary} />

      {!isEdit ? (
        <div className="space-y-1.5">
          <Label htmlFor="sf-email">Email</Label>
          <Input id="sf-email" name="email" type="email" required autoComplete="off" />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="sf-name">Name</Label>
        <Input id="sf-name" name="name" defaultValue={staff?.name} required />
      </div>

      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Roles</legend>
        {roles.map((r) => (
          <label key={r.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.has(r.id)}
              onChange={() => toggle(r.id)}
            />
            {r.name}
          </label>
        ))}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="sf-primary">Primary role</Label>
        <select
          id="sf-primary"
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          required
          className="border-input h-9 rounded-md border bg-transparent px-2 text-sm"
        >
          <option value="" disabled>
            Select…
          </option>
          {[...selected].map((id) => (
            <option key={id} value={id}>
              {roles.find((r) => r.id === id)?.name ?? id}
            </option>
          ))}
        </select>
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || selected.size === 0}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add staff member"}
        </Button>
        {onDone ? (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
