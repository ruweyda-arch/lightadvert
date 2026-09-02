import { Planned } from "@/components/planned";
import { requireUser } from "@/server/auth/guards";

export default async function StaffHome() {
  const session = await requireUser();

  return (
    <Planned title={`Welcome, ${session.user.name}`} requirement="R43">
      <p className="text-muted-foreground text-sm">
        Your Tasks grouped by status, plus your current-period Contribution total
        and history. A Staff Member never sees another person&apos;s numbers.
      </p>
    </Planned>
  );
}
