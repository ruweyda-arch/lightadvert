"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/server/actions/auth";

export function LoginForm({ reason, reset }: { reason?: string; reset?: boolean }) {
  const [state, action, pending] = useActionState(loginAction, null);

  const notice =
    reason === "idle"
      ? "You were signed out after 2 hours of inactivity."
      : reason === "deactivated"
        ? "This account has been deactivated. Contact an administrator."
        : reset
          ? "Password updated — sign in with your new password."
          : null;

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>

      {notice ? <p className="text-muted-foreground text-sm">{notice}</p> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <Link
        href="/forgot-password"
        className="text-muted-foreground block text-sm hover:underline"
      >
        Forgot password?
      </Link>
    </form>
  );
}
