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
| [docs/roadmap.md](docs/roadmap.md) | Phasing, parked scope, deferred decisions, pre-go-live checklist |
| [docs/adr/](docs/adr/) | Architecture decision records |

## Stack (Phase 1)

Next.js 16 (App Router) + TypeScript · Postgres (Supabase) + Prisma 6 · Better Auth ·
shadcn/ui + Tailwind v4 · Resend · Upstash Redis · Sentry · Vercel. Package manager pnpm 9,
Node 20 LTS. Single company timezone: Africa/Nairobi (EAT, UTC+3).
See [docs/architecture.md](docs/architecture.md) §2 for the full table and version pins.

## Status

Scaffold in place and green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and
the Playwright smoke test all pass. Feature screens are stubs — see
[docs/prd.md](docs/prd.md) requirement IDs and [docs/roadmap.md](docs/roadmap.md).

## Local development

```
cp .env.example .env          # then fill in DATABASE_URL + BETTER_AUTH_SECRET at minimum
pnpm install                  # runs `prisma generate` via postinstall
pnpm db:migrate               # needs a reachable Postgres (Supabase or local)
pnpm db:seed                  # 7 Roles + first Admin (SEED_ADMIN_EMAIL) + Internal / Ad-hoc Project
pnpm dev                      # http://localhost:3000
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
