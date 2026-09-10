# Light Advert — Go-Live Runbook (Milestone 9)

Everything an operator does to take Phase 1 from "green in CI" to "in daily use".
Ordered. Tick the checklist at the bottom as you go.

## 1. Provision the database

1. Create a **Supabase** project in the region nearest EAT.
2. **Enable Point-In-Time Recovery** (Settings → Database → PITR). This is a paid
   feature — if you start on the free tier, note it here and enable it before real
   pay data goes in.
3. Copy both connection strings into the Vercel project env (and a local `.env` for
   the first migration):
   - `DATABASE_URL` — the **pooled** string (`:6543`, `?pgbouncer=true`)
   - `DIRECT_URL` — the **direct** string (`:5432`)
4. Apply the schema:
   ```
   pnpm db:deploy      # prisma migrate deploy
   pnpm db:seed         # 7 Roles + first Admin + "Internal / Ad-hoc" Project
   ```
   `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME` must be set for the seed.
5. Give the first Admin a password:
   ```
   pnpm tsx scripts/set-password.ts <admin-email> "<a strong password>"
   ```
   (Once Resend is verified you can instead use the app's "Forgot password" flow and
   delete this script.)

## 2. Deploy

1. Import the repo into **Vercel**. Set every env var from `.env.example`
   (`BETTER_AUTH_SECRET` via `openssl rand -base64 32`, `BETTER_AUTH_URL` = the prod
   URL, plus Resend / Upstash / Sentry when ready).
2. Deploy. Confirm `/` and `/login` load and `/app` redirects to `/login`.
3. Enable CI: the `workflow` scope is needed to push `.github/workflows/*`.
   ```
   gh auth refresh -h github.com -s workflow
   git add .github/workflows/ci.yml .github/workflows/e2e.yml
   git commit -m "ci: add workflows"
   git push
   ```
   `ci.yml` runs typecheck + lint + unit tests; `e2e.yml` runs the acceptance suite
   against a throwaway Postgres.

## 3. Harden

1. **Email** — verify the sending domain in Resend; set `RESEND_API_KEY`,
   `EMAIL_FROM` to an address on that domain.
2. **Error monitoring** — create a Sentry project, set `SENTRY_DSN` +
   `NEXT_PUBLIC_SENTRY_DSN` (and `SENTRY_ORG` / `SENTRY_PROJECT` / an auth token if
   you want source-map upload). Trigger one deliberate error and confirm it lands in
   Sentry.
3. **Database roles** — the app should not be able to rewrite history. As the
   Supabase `postgres` superuser, restrict the role the app connects as (adjust the
   role name to match your connection string):
   ```sql
   -- audit_entry and comment are append-only at the application layer; enforce it here too
   REVOKE UPDATE, DELETE ON TABLE public.audit_entry FROM authenticated, anon, service_role;
   REVOKE UPDATE, DELETE ON TABLE public.comment      FROM authenticated, anon, service_role;
   ```
   (Supabase connections typically authenticate as `postgres`; if you create a
   dedicated least-privilege role for the app, grant it `SELECT, INSERT, UPDATE,
   DELETE` on the domain tables but only `SELECT, INSERT` on `audit_entry` and
   `comment`.)
4. **Rate limiting** — set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` so
   login throttling holds across serverless instances.

## 4. First pay period

- Decide the first real Pay Period (calendar month is the default).
- If there is existing work to account for, backfill it with **Record past work** on
  `/app/admin/tasks` (status Completed + a back-dated approval date), then **lock**
  that month on `/app/admin/periods` once payment for it is settled.

## 5. Staff privacy notice (Kenya DPA 2019)

The system holds staff PII and individual performance data. Before staff accounts go
live, Light Advert must publish an internal privacy notice. A **draft** is at
[staff-privacy-notice.draft.md](staff-privacy-notice.draft.md) — fill the bracketed
placeholders, have it reviewed, and circulate it.

## 6. Acceptance sign-off

- `pnpm test` green (unit — includes acceptance-criteria logic A1, A3, A4, A6, A7).
- `pnpm test:acceptance` green in CI (`e2e.yml`) — the A1–A8 end-to-end suite against
  a real Postgres.
- Manual walkthrough in the deployed app, signed off by the Admin:
  - **A1** a staff account has no control to complete/approve a task
  - **A2** editing an estimate on a started task requires a reason and shows in the
    task's audit trail as `old → new`
  - **A3** after locking a month, an estimate/approval-date change on a task approved
    in that month is refused; the same change on a later task succeeds
  - **A8** a deactivated staff member cannot sign in and still appears on reports for
    periods where they have approved tasks

---

## Checklist

- [ ] Supabase project created; PITR enabled
- [ ] `DATABASE_URL` + `DIRECT_URL` set (Vercel + local)
- [ ] `pnpm db:deploy` applied
- [ ] `pnpm db:seed` run; first Admin password set
- [ ] Vercel project deployed; all env vars set; `/login` reachable
- [ ] `gh auth refresh -s workflow`; both workflows pushed and green
- [ ] Resend domain verified; `RESEND_API_KEY` / `EMAIL_FROM` set
- [ ] Sentry project; DSNs set; a test error captured
- [ ] `audit_entry` / `comment` update+delete revoked for the app role
- [ ] Upstash Redis configured
- [ ] First Pay Period decided; any backfill entered
- [ ] Staff privacy notice drafted, reviewed, circulated
- [ ] `pnpm test` and `pnpm test:acceptance` green
- [ ] Manual A1 / A2 / A3 / A8 walkthrough signed off
