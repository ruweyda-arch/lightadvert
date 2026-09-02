import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-xl space-y-6">
        <p className="text-muted-foreground font-mono text-sm">Light Advert</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Internal work tracking &amp; contribution reporting
        </h1>
        <p className="text-muted-foreground text-lg">
          The public marketing site is Phase 2. For now this is the staff sign-in
          for the internal tool.
        </p>
        <Link
          href="/login"
          className="bg-primary text-primary-foreground inline-flex h-11 items-center rounded-md px-5 text-sm font-medium transition-opacity hover:opacity-90"
        >
          Staff sign in
        </Link>
      </div>
    </main>
  );
}
