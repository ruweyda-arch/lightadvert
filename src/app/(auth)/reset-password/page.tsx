import Link from "next/link";

import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const invalid = typeof sp.error === "string" ? sp.error : undefined;

  if (!token || invalid) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Link problem</h1>
        <p className="text-muted-foreground text-sm">
          This reset link is missing or invalid. Request a fresh one.
        </p>
        <Link href="/forgot-password" className="text-sm hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
