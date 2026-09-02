/** Placeholder for a Phase 1 screen that is scoped but not yet built. */
export function Planned({
  title,
  requirement,
  children,
}: {
  title: string;
  requirement: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">
        Planned for Phase 1 — see <span className="font-mono">{requirement}</span> in
        docs/prd.md. Not yet implemented.
      </p>
      {children}
    </section>
  );
}
