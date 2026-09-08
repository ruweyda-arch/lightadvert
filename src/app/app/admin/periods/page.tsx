import { listLocks } from "@/server/db/pay-period";

import { LockForm } from "./lock-form";
import { PeriodRow } from "./period-row";

export default async function AdminPeriodsPage() {
  const locks = await listLocks();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pay periods</h1>
        <p className="text-muted-foreground text-sm">
          Locking a month or range freezes the effort estimate and approval date of every
          task approved within it — for everyone, including Admins. Unlocking needs a
          typed reason and is audited (docs/prd.md R33–R35).
        </p>
      </div>

      <LockForm />

      <div className="divide-y rounded-md border">
        {locks.length === 0 ? (
          <p className="text-muted-foreground p-3 text-sm">No pay periods locked yet.</p>
        ) : (
          locks.map((lock) => <PeriodRow key={lock.id} lock={lock} />)
        )}
      </div>
    </div>
  );
}
