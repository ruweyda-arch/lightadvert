# Light Advert — Constraints & Non-Functional Requirements (Phase 1)

## 1. Technical constraints

- Single Next.js application; a **modular monolith**, not microservices.
- **Managed services only** — no self-hosted infrastructure: Vercel, Supabase, Upstash,
  Resend, Sentry.
- **Postgres is the only datastore.** Redis (Upstash) is used solely for rate-limit
  counters and holds no source-of-truth data.
- **No file / object storage.** Deliverables are external URLs only (see ADR-0003).
- **No background job runner** in Phase 1 — nothing that needs scheduling (deadline
  reminders, digests) is in scope.
- **One fixed timezone: Africa/Nairobi (EAT, UTC+3).** No per-user timezones.
  Calendar-month boundaries and all "date" logic are computed in EAT.
- **English only.** Dates displayed as `DD Mon YYYY`.

## 2. Security

- All authorization enforced **server-side**; client-side gating is cosmetic only.
- **No public account creation** — Admin-provisioned accounts only.
- Passwords: ≥ 8 characters, rejected if present in the HaveIBeenPwned breach corpus;
  stored only as a strong hash (Better Auth default). No plaintext, no reversible storage,
  no forced rotation.
- Sessions: database-backed; `httpOnly` / `secure` / `SameSite=Lax` cookies; 30-day
  rolling. Admin sessions add a 2-hour idle timeout enforced server-side.
- Login and credential endpoints rate-limited (per-IP + per-account, exponential backoff),
  with generic error messaging that does not distinguish unknown user / wrong password /
  locked.
- The **Audit trail is the integrity control** for pay data: append-only at the application
  layer. Database write access is restricted to the application role so history cannot be
  quietly rewritten.
- Secrets live only in server environment (Vercel project settings); never in the client
  bundle. The only `NEXT_PUBLIC_*` value is the Sentry DSN.

## 3. Privacy & compliance

- The system stores staff **personal data** (name, email) and **individual performance
  data** (points, task history).
- **Kenya's Data Protection Act 2019 applies.** Before go-live, Light Advert must publish an
  internal **staff privacy notice** stating what is collected, why (contribution-based pay),
  retention, and who can see it. Drafting this is an open to-do
  ([roadmap.md](roadmap.md)), not a build task.
- **Retention:** Audit Entries and Contribution history are kept indefinitely by design
  (needed for pay disputes). Deactivated staff are retained, never hard-deleted.
- Access to another person's Contribution data is limited to Admins.

## 4. Performance & scale

- Expected load: ≤ ~20 users, low hundreds of Tasks per month, history in the low thousands
  of rows per year. No horizontal-scaling concerns.
- Targets: dashboard pages interactive < 1.5 s on a typical connection; Contribution Report
  (one-month range) renders < 1 s; CSV export of a full year < 3 s.
- The Role-filtered, date-bucketed report query is the only query worth tuning; see
  [architecture.md](architecture.md) §6 for the supporting indexes.

## 5. Availability & data safety

- Availability target: best-effort business hours; no formal SLA. Managed uptime of Vercel +
  Supabase is sufficient.
- **Supabase Point-In-Time Recovery enabled.** Acceptable recovery objective for an internal
  tool: restore to within ~24 h, minor data loss tolerable.
- No multi-region, no read replicas.

## 6. Accessibility & browser support

- Build to **WCAG 2.1 AA** as a standard (keyboard operability, form labelling, contrast,
  focus order) — not a certified audit.
- Support the **current and previous major version** of Chrome, Edge, Safari and Firefox,
  plus mobile Safari and Chrome on phones.
- **Responsive web only.** No PWA, no offline, no native app.
- **Light colour scheme only** in Phase 1; design tokens structured so a dark scheme can be
  added later without rework.

## 7. Explicit anti-requirements (deliberately NOT done)

| Not doing | Why | Revisit when |
|---|---|---|
| Money / payroll calculation | System is decision support; humans decide pay | Per-task rates are introduced |
| Time / hours tracking | Gameable and disputable; points chosen instead (ADR-0001) | Not planned |
| Competitive ranking / leaderboard | Meaningless at 1–2 people per Role; corrosive in a small team (ADR-0002) | Not planned |
| Notifications (email / in-app) | Kept out of Phase 1 to ship the core | Phase 2 |
| Calendar / timeline view | Phase 2 | Phase 2 |
| Manager role & team scoping | Org is small; need unproven | Light Advert operates as real, lead-owned teams |
| Client as an entity | Free-text label suffices | Client-facing or per-client reporting is needed |
| Uploaded video / large files | Cost and complexity; links suffice (ADR-0003) | Not planned |
| 2FA | Phase 2 | Phase 2 security pass |
| Staging environment | Per-PR preview deploys suffice | Release risk grows |
| Bulk task import | One-at-a-time is enough at this volume | Onboarding a large backlog |

## 8. Assumptions & dependencies

- Light Advert operates in one timezone (EAT) and pays on calendar months.
- Admins are trusted. The Audit trail exists to make their pay-affecting actions
  transparent and recorded, not to prevent them.
- Staff have email addresses and browser access.
- Deliverables live in third-party tools (Drive, Frame.io, Dropbox, YouTube/Vimeo, …) that
  staff already use.
- Depends on the availability of: Vercel, Supabase, Upstash, Resend, Sentry, and the
  HaveIBeenPwned range API.
