import Link from "next/link";

import { requireUser } from "@/server/auth/guards";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const session = await requireUser();
  const admin = session.user.role === "ADMIN";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3 text-sm">
          <Link href="/app" className="font-semibold">
            Light Advert
          </Link>
          <Link href="/app" className="text-muted-foreground hover:text-foreground">
            My work
          </Link>
          {admin ? (
            <Link
              href="/app/admin"
              className="text-muted-foreground hover:text-foreground"
            >
              Admin
            </Link>
          ) : null}
          <span className="text-muted-foreground ml-auto">{session.user.email}</span>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
