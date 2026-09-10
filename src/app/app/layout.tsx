import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { requireUser } from "@/server/auth/guards";

// The whole authenticated area is per-request (session + DB). Never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const session = await requireUser();
  const admin = session.user.role === "ADMIN";

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm sm:px-6">
          <Link href="/app" className="font-semibold">
            Light Advert
          </Link>
          <Link
            href="/app"
            className="text-muted-foreground hover:text-foreground"
          >
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
          <div className="ml-auto flex items-center gap-2">
            <span className="text-muted-foreground hidden max-w-[45vw] truncate sm:inline">
              {session.user.email}
            </span>
            <SignOutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
