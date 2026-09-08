"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/server/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          If that address belongs to an account, a link to set a new password is on
          its way. The link expires in one hour.
        </p>
        <Link href="/login" className="text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
      <p className="text-muted-foreground text-sm">
        Enter your email and we&apos;ll send a link to set a new password.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      {state && !state.ok ? (
        <p className="text-destructive text-sm">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <Link href="/login" className="text-muted-foreground block text-sm hover:underline">
        Back to sign in
      </Link>
    </form>
  );
}
