import { Planned } from "@/components/planned";

export default function AdminOverview() {
  return (
    <Planned title="Admin overview" requirement="R12–R45">
      <p className="text-muted-foreground text-sm">
        Entry point for assigning work, approving Tasks, locking Pay Periods, and
        running the Contribution Report.
      </p>
    </Planned>
  );
}
