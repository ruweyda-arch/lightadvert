"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/server/actions/result";

type Variant = React.ComponentProps<typeof Button>["variant"];
type Size = React.ComponentProps<typeof Button>["size"];

/**
 * Row-level actions (delete, reorder, deactivate, promote…). Calls a typed-arg
 * server action and toasts its ActionResult. Text-input forms use `useActionState`
 * instead.
 */
export function ActionButton({
  run,
  children,
  confirm,
  successMessage,
  variant = "outline",
  size = "sm",
  disabled,
}: {
  run: () => Promise<ActionResult<unknown>>;
  children: React.ReactNode;
  confirm?: string;
  successMessage?: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await run();
          if (res.ok) {
            if (successMessage) toast.success(successMessage);
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      {children}
    </Button>
  );
}
