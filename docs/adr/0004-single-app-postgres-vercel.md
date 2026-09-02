# One Next.js app on Postgres + Supabase + Vercel

Date: 2026-09-02

## Context

The project has two loosely-related deliverables — a public marketing site and an internal
work-tracking tool — and is built and maintained by one person for a small company.

## Decision

A single **Next.js (App Router)** application in **one repository** holds both. Data is in
**Postgres via Prisma on Supabase**; hosting is **Vercel**; auth is **Better Auth** with
database sessions. The marketing site will be unauthenticated routes in the same app when
Phase 2 starts. Rate-limit state is in **Upstash Redis**; transactional email is
**Resend**; errors go to **Sentry**.

## Why

At this size, a modular monolith is the least operational overhead: one deploy, one
datastore, one auth model, one codebase to reason about. Managed services remove
infrastructure work. Splitting the site and the tool into separate apps would add
coordination cost with no benefit while the team is this small.

## Considered and rejected

- **Separate static marketing site + separate API/app** — more moving parts, two deploys,
  shared-type friction, for a site that barely exists in Phase 1.
- **Self-hosted Postgres / VPS** — infrastructure toil a solo maintainer should not carry
  for an internal tool of this size.

## Consequences

- Lock-in to Postgres and to Vercel's deployment model is accepted; both are straightforward
  to migrate off if ever needed.
- The internal tool and the public site share a release cadence — acceptable now,
  revisitable if the site later needs its own.
