"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/actions/auth";

export function SignOutButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => logoutAction())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
