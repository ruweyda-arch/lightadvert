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

The full runbook with commands and the ticklist is in
[go-live.md](go-live.md). In brief: provision Supabase (+ PITR) and apply the
migration + seed; deploy to Vercel and enable both CI workflows; verify Resend and
Sentry; revoke `UPDATE`/`DELETE` on `audit_entry` and `comment` for the app DB role;
decide the first Pay Period; draft and circulate the
[staff privacy notice](staff-privacy-notice.draft.md); and get `pnpm test` +
`pnpm test:acceptance` green plus a manual A1/A2/A3/A8 walkthrough signed off.
