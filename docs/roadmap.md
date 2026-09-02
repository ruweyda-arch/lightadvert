# Light Advert — Roadmap & Phasing

## Phase 1 — Internal tool (current build)

Accounts & auth · Roles (admin-managed) · Projects · Tasks with the full lifecycle and
approval gate · Effort Estimates (points) · Contribution (derived) · Pay Periods with
lock / unlock · Contribution Report + CSV · Workload Board · Staff home · Audit log.
Full detail in [prd.md](prd.md).

**Definition of done:** acceptance criteria A1–A8 in the PRD pass; the seed script
provisions the first Admin + 7 Roles + the Internal / Ad-hoc Project; deployed to a
production Vercel + Supabase with PITR enabled.

## Phase 2 — Parked (its own grill later)

- **Public marketing website** — Home, Services, Portfolio (admin-managed content), About,
  Contact (form → email + stored row), staff login link. Needs its own requirements pass:
  branding, copy, domain / DNS, how much of the site is CMS-managed.
- **Notifications** — in-app + email for new assignment, approaching deadline, status
  change. Introduces a notification model, Resend templates, and a scheduled job
  (Vercel Cron) for deadline scanning.
- **Calendar / timeline view** — visualises existing Task / Project deadlines across teams.
- **PDF export** of the Contribution Report.
- **Dark mode.**

## Deferred decisions (not parked — waiting on a trigger)

| Decision | Current stance | Trigger to revisit |
|---|---|---|
| Manager role + team scoping | Not built; only Admin + Staff | Light Advert actually operates as multiple lead-owned teams |
| Client as a first-class entity | Free-text label on Project | Need for client-facing or per-client reporting |
| Staff-visible transparency | Staff see only their own numbers | Staff collectively ask for it — then prefer opt-in "share my total" or an anonymised distribution ("above the median for your Role"), never raw names |
| 2FA | Out of scope | Phase 2 security pass |

## Pre-go-live checklist

- [ ] Draft & publish the internal **staff privacy notice** (Kenya DPA 2019).
- [ ] Set production seed env vars (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`) and run the seed.
- [ ] Verify Supabase PITR is enabled; take a test restore.
- [ ] Confirm Resend domain verification for the sending address.
- [ ] Restrict Supabase DB roles so only the app role can write; confirm the audit table has
      no app-level update / delete path.
- [ ] Decide the first real Pay Period start, and whether a backfill month is needed.
- [ ] Sentry project created, DSN set, a test error captured.
