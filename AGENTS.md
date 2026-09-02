<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Light Advert

Design docs are the source of truth. Read before changing behaviour:

- `CONTEXT.md` — domain glossary (use these terms verbatim)
- `docs/prd.md` — requirements `R1`–`R45`, acceptance `A1`–`A8`
- `docs/architecture.md` — stack, version pins, folder layout, core workflows
- `docs/data-model.md` — schema, enums, invariants (mirrors `prisma/schema.prisma`)
- `docs/adr/` — decisions that must not be silently reversed

Conventions:

- Every pay-relevant rule is a pure function in `src/server/domain/` with a unit test.
  Route handlers and server actions orchestrate; they never hold contribution math,
  status-transition rules, audit-reason enforcement, or lock checks.
- Prisma is pinned to 6.19.3 on purpose (see architecture §2.1). Do not bump it.
- `Contribution` is always derived, never stored.
- Mutations that touch `effortPoints`, assignee, or stamped Role after `ASSIGNED` must
  write an `AuditEntry` with a reason.
