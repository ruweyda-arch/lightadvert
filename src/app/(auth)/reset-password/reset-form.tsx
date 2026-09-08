"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/server/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, null);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <p className="text-muted-foreground text-sm">
        At least 8 characters. Passwords found in known data breaches are rejected.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        {fieldErrors?.password ? (
          <p className="text-destructive text-xs">{fieldErrors.password}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
        />
        {fieldErrors?.confirm ? (
          <p className="text-destructive text-xs">{fieldErrors.confirm}</p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}
