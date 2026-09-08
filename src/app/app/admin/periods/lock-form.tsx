"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lockMonthAction, lockRangeAction } from "@/server/actions/pay-period";

export function LockForm() {
  const [monthState, monthAction, monthPending] = useActionState(lockMonthAction, null);
  const [rangeState, rangeAction, rangePending] = useActionState(lockRangeAction, null);

  useEffect(() => {
    if (monthState?.ok) toast.success("Month locked.");
    else if (monthState && !monthState.ok) toast.error(monthState.error);
  }, [monthState]);

  useEffect(() => {
    if (rangeState?.ok) toast.success("Range locked.");
    else if (rangeState && !rangeState.ok) toast.error(rangeState.error);
  }, [rangeState]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <form action={monthAction} className="space-y-2 rounded-md border p-4">
        <h3 className="text-sm font-semibold">Lock a month</h3>
        <div className="space-y-1.5">
          <Label htmlFor="lp-month">Month</Label>
          <Input id="lp-month" name="month" type="month" required />
        </div>
        <Button type="submit" size="sm" disabled={monthPending}>
          Lock month
        </Button>
      </form>

      <form action={rangeAction} className="space-y-2 rounded-md border p-4">
        <h3 className="text-sm font-semibold">Lock a custom range</h3>
        <div className="flex gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="lp-from">From</Label>
            <Input id="lp-from" name="from" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-to">To</Label>
            <Input id="lp-to" name="to" type="date" required />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={rangePending}>
          Lock range
        </Button>
      </form>
    </div>
  );
}
