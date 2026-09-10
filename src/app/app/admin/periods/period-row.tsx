"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockAction } from "@/server/actions/pay-period";
import type { PayPeriodLockRow } from "@/server/db/pay-period";
import { formatEatDate } from "@/lib/dates";

export function PeriodRow({ lock }: { lock: PayPeriodLockRow }) {
  const [state, action, pending] = useActionState(unlockAction, null);
  const [open, setOpen] = useState(false);
  const active = lock.unlockedAt === null;
  const formOpen = open && !state?.ok;

  useEffect(() => {
    if (state?.ok) toast.success("Period unlocked.");
    else if (state && !state.ok) toast.error(state.error);
  }, [state]);

  return (
    <div className="space-y-2 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium">
          {formatEatDate(lock.startDate)} – {formatEatDate(lock.endDate)}
        </span>
        <Badge variant={active ? "default" : "secondary"}>
          {active ? "Locked" : "Unlocked"}
        </Badge>
        <span className="text-muted-foreground text-xs">
          by {lock.lockedBy.name}, {formatEatDate(lock.lockedAt)}
        </span>
        {active ? (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => setOpen((v) => !v)}
          >
            {formOpen ? "Cancel" : "Unlock"}
          </Button>
        ) : null}
      </div>

      {!active && lock.unlockedBy ? (
        <p className="text-muted-foreground text-xs">
          Unlocked by {lock.unlockedBy.name}
          {lock.unlockedAt ? `, ${formatEatDate(lock.unlockedAt)}` : ""} —
          “{lock.unlockReason}”
        </p>
      ) : null}

      {formOpen ? (
        <form action={action} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={lock.id} />
          <Input
            name="reason"
            placeholder="Reason for unlocking (required)"
            aria-label="Reason for unlocking"
            required
            className="w-full sm:w-80"
          />
          <Button type="submit" size="sm" variant="destructive" disabled={pending}>
            Confirm unlock
          </Button>
        </form>
      ) : null}
    </div>
  );
}
