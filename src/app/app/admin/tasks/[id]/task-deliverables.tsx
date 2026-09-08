"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/action-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEatDate } from "@/lib/dates";
import { addDeliverableAction, removeDeliverableAction } from "@/server/actions/tasks";

export interface DeliverableItem {
  id: string;
  label: string;
  url: string;
  createdAt: Date;
  createdBy: { name: string };
}

export function TaskDeliverables({
  taskId,
  deliverables,
}: {
  taskId: string;
  deliverables: DeliverableItem[];
}) {
  const [state, action, pending] = useActionState(addDeliverableAction, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      toast.success("Deliverable added.");
    } else if (state && !state.ok) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Deliverables</h2>

      {deliverables.length === 0 ? (
        <p className="text-muted-foreground text-sm">No links yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {deliverables.map((d) => (
            <li key={d.id} className="flex items-center gap-2">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                {d.label}
              </a>
              <span className="text-muted-foreground truncate text-xs">{d.url}</span>
              <span className="text-muted-foreground text-xs">
                · {d.createdBy.name}, {formatEatDate(d.createdAt)}
              </span>
              <ActionButton
                run={() => removeDeliverableAction(d.id)}
                variant="ghost"
                size="sm"
              >
                Remove
              </ActionButton>
            </li>
          ))}
        </ul>
      )}

      <form ref={ref} action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="taskId" value={taskId} />
        <Input name="label" placeholder="Label" required maxLength={120} className="w-40" />
        <Input
          name="url"
          type="url"
          placeholder="https://…"
          required
          className="w-72"
        />
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Add link
        </Button>
      </form>
    </section>
  );
}
