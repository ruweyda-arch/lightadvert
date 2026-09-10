# Light Advert

Public marketing website (Phase 2) and internal staff work-tracking tool (Phase 1) for
Light Advert, a digital marketing agency.

**Phase 1 — the internal tool — is the current build.** It lets an Admin assign creative
work to staff as Tasks, run those Tasks through an approval gate, and measure each Staff
Member's **Contribution** (the sum of effort points on approved work) over a pay period,
so bonus-pool decisions are consistent, auditable, and hard to game.

## Documentation

| Doc | What it covers |
|---|---|
| [CONTEXT.md](CONTEXT.md) | Canonical domain glossary — the words this project uses and what they mean |
| [docs/prd.md](docs/prd.md) | Product requirements — goals, personas, Phase 1 feature scope, acceptance criteria |
| [docs/architecture.md](docs/architecture.md) | System architecture — stack, topology, core workflows, auth, audit design |
| [docs/data-model.md](docs/data-model.md) | Entities, fields, enums, relationships, invariants, ERD |
| [docs/constraints.md](docs/constraints.md) | Non-functional requirements, security, privacy, operational limits, anti-requirements |
| [docs/roadmap.md](docs/roadmap.md) | Phasing, parked scope, deferred decisions |
| [docs/phase-1-plan.md](docs/phase-1-plan.md) · [docs/phase-2-plan.md](docs/phase-2-plan.md) | Milestone-by-milestone build plans |
| [docs/go-live.md](docs/go-live.md) | Deploy runbook + acceptance sign-off checklist |
| [docs/adr/](docs/adr/) | Architecture decision records |

## Stack (Phase 1)

Next.js 16 (App Router) + TypeScript · Postgres (Supabase) + Prisma 6 · Better Auth ·
shadcn/ui + Tailwind v4 · Resend · Upstash Redis · Sentry · Vercel. Package manager pnpm 9,
Node 20 LTS. Single company timezone: Africa/Nairobi (EAT, UTC+3).
See [docs/architecture.md](docs/architecture.md) §2 for the full table and version pins.

## Status

**Phase 1 feature-complete pending a database.** Milestones M1–M8 are built —
auth + reset flow, Roles & Staff, Projects, Tasks (lifecycle, audited edits,
deliverables, comments, backfill), Contribution Report + CSV, pay-period lock/unlock,
Workload Board, Staff home, Audit log. `pnpm typecheck`, `pnpm lint`, `pnpm test`
(30 unit), `pnpm build`, and the smoke e2e all pass.

Not yet run against a real database — do the [go-live runbook](docs/go-live.md)
(Supabase → `pnpm db:deploy && pnpm db:seed` → Vercel). The A1–A8 acceptance suite
(`pnpm test:acceptance`) runs in CI against a throwaway Postgres.

## Local development

```
cp .env.example .env          # then fill in DATABASE_URL + BETTER_AUTH_SECRET at minimum
pnpm install                  # runs `prisma generate` via postinstall
pnpm db:migrate               # needs a reachable Postgres (Supabase or local)
pnpm db:seed                  # 7 Roles + first Admin (SEED_ADMIN_EMAIL) + Internal / Ad-hoc Project
pnpm dev                      # http://localhost:3000
```

No Postgres and no Docker? `pnpm db:dev` runs a real Postgres 17 binary as a
subprocess (via `embedded-postgres`), data in `.pgdata/`. In a second terminal
point `.env` at it and migrate + seed:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lightadvert"
DIRECT_URL="postgresql://postgres:postgres@localhost:5433/lightadvert"
pnpm db:deploy && pnpm db:seed
pnpm tsx scripts/set-password.ts <SEED_ADMIN_EMAIL> "<a password>"
pnpm dev
```

Checks:

```
pnpm typecheck                # next typegen + tsc --noEmit
pnpm lint
pnpm test                     # vitest — domain logic
pnpm test:e2e                 # playwright; first run: pnpm exec playwright install chromium
pnpm build
```

`.env` is git-ignored; it currently holds placeholder values so builds run offline.
Replace them before pointing at a real database.
