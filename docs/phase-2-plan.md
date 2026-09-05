# Light Advert — Phase 2 End-to-End Plan

**This plan is provisional.** Phase 2 was deliberately parked
([roadmap.md](roadmap.md), grilling Q30) pending its own requirements pass — the public
website in particular needs decisions on branding, copy, domain, and CMS depth that were
never taken. What follows sequences the **known** Phase 2 scope and marks every decision a
kickoff must settle before building.

Same format as [phase-1-plan.md](phase-1-plan.md): **Goal**, **Build**, **Honors** /
**Open decisions**, **Done when**. Phase 1 (M0–M9) is assumed complete and in use.

Committed Phase 2 scope (from roadmap.md): public marketing website · notifications ·
calendar/timeline view · PDF export · dark mode. Plus four **deferred decisions** that a
kickoff may pull in: Manager role, Client entity, Staff transparency, 2FA.

---

## P2-0 — Kickoff & decisions  *(mandatory first)*

**Goal:** turn "parked" into a buildable spec. Run a grilling pass focused on the website.

**Decide**

- **Brand:** logo, palette, typography, tone. Who produces the visual identity?
- **Copy:** who writes Home / Services / About text, and by when?
- **Domain & DNS:** the domain name; where DNS is managed; email deliverability records
  for Resend on that domain.
- **CMS depth per page:** which pages are hand-authored in code vs. admin-editable.
  Portfolio is admin-managed (Phase 1 decision); Services / About — decide.
- **Portfolio images:** links only (ADR-0003 spirit) or introduce **small-image upload**
  for marketing assets? This likely needs a narrow amendment to ADR-0003. Pick a host
  (Supabase Storage / Cloudflare R2 / UploadThing).
- **Analytics:** the internal tool has none (constraints.md §7). Does the public site get
  privacy-friendly analytics (Plausible / Umami / GA4)? New decision.
- **Notifications:** which events notify; email default on/off and per-type granularity;
  immediate vs daily digest; how many days ahead counts as "deadline approaching"; do
  Admins get notified when Staff submit to Review; quiet hours.
- **Calendar:** month grid, Gantt-style timeline, or both; group-by assignee or project.
- **In-scope this phase?** Manager role · Client entity · Staff transparency · 2FA —
  each yes/no against its roadmap trigger.

**Done when:** the above are answered and this file is revised into a firm plan.

---

## P2-1 — Notifications

**Goal:** Staff and Admins learn about assignments, status changes, and looming deadlines
without watching the dashboard.

**Build**

- **Model:** `Notification` — `id, userId, type, taskId?, title, body, readAt?, createdAt`.
  Types: `TASK_ASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_APPROVED`, `TASK_HANDED_BACK`,
  `DEADLINE_APPROACHING`. `NotificationPreference` (per user, per type, email on/off).
- **In-app:** bell + unread count in the app nav; list view; mark-read / mark-all-read.
- **Email:** Resend templates per type; `sendNotificationEmail` gated by the user's
  preference. Adds templates beyond Phase 1's two auth emails.
- **Triggers:** emit a `Notification` (and optional email) inside the same transaction as
  `createTask`, `reassignTask`, `transitionTask`, approval, hand-back.
- **Deadline scan:** `vercel.json` cron → `/api/cron/deadlines` (guarded by
  `CRON_SECRET`), daily ~06:00 EAT. Finds Tasks whose effective deadline
  (`deadline ?? project.deadline`) is within the threshold and status ∉
  {COMPLETED, CANCELLED}; emits `DEADLINE_APPROACHING` once per Task per threshold
  (dedupe via `deadlineNotifiedAt`).

**Honors / new:** net-new — Phase 1 shipped zero notifications by design (PRD non-goals).
**New ADR:** notifications delivered in-app + email, deadline scan via Vercel Cron.
Visibility rules still hold — a Staff Member is only notified about their own Tasks.

**Done when:** assigning a Task emails the assignee (if opted in) and shows an in-app
badge; a Task due tomorrow triggers exactly one deadline notification.

---

## P2-2 — Calendar / timeline view

**Goal:** see deadlines across the team at a glance.

**Build:** read-only view over `Task` and `Project` deadlines for a chosen range
(month / quarter). Admin sees everyone; Staff sees their own. Server Component + a
range query; a light month-grid component (avoid a heavy calendar dependency) or a
timeline lib if the kickoff chose Gantt. Colour by status.

**Honors:** R (Phase 1 "Calendar / Timeline View", previously parked); Staff visibility
boundary. No new data — reads existing deadline fields.

**Done when:** the current month shows every open Task on its effective deadline, and
Staff see only theirs.

---

## P2-3 — Public marketing website

**Goal:** the outward-facing site.

**Build:** routes under `src/app/(marketing)/` with their own layout (header / footer
distinct from the app): `/` (home), `/services`, `/work` (portfolio), `/about`,
`/contact`, plus a visible **staff sign-in** link to `/login`. Static / ISR; portfolio
and any CMS-driven sections read from P2-4. SEO: per-route metadata, OG images,
`sitemap.xml`, `robots.txt`. English only (constraints.md §1).

**Open decisions:** all of P2-0's brand / copy / domain / CMS-depth answers.

**Done when:** the five pages render with real copy and brand, Lighthouse SEO + a11y
pass (WCAG 2.1 AA — constraints.md §6), and the site is reachable on the real domain.

---

## P2-4 — Portfolio CMS & Contact inbox

**Goal:** non-devs maintain the site's dynamic content; enquiries land somewhere.

**Build**

- **`PortfolioItem`** — `id, title, slug, summary, body, coverImageUrl, client?,
  roleTags[], externalUrl?, published, orderIndex, createdAt`. Admin CRUD at
  `/app/admin/portfolio`. Images per the P2-0 decision (link vs upload).
- **`ContactSubmission`** — `id, name, email, message, createdAt, handledAt?,
  handledById?`. Public contact form → server action → store row + `sendContactEmail`
  to the company. Admin list at `/app/admin/contact` with a "mark handled" action.
  Anti-spam: honeypot field + per-IP rate-limit (reuse Upstash) + optional captcha.
  **Not a CRM** (constraints.md §7).

**Honors:** roadmap.md ("contact form emails + stores a row"; "portfolio admin-managed").

**Done when:** an Admin publishes a portfolio item that appears on `/work`; a contact
submission emails the company and shows in the admin inbox.

---

## P2-5 — Contribution Report PDF export

**Goal:** a portable payroll-support artefact alongside the CSV.

**Build:** `/app/admin/reports/export.pdf?from=&to=&role=` → server-rendered PDF
(`@react-pdf/renderer` for a deterministic layout) from the same
`summariseContribution` output as the screen and CSV.

**Open decisions:** PDF branding/layout; summary only or include the per-person Task
drill-down.

**Done when:** the PDF's totals reconcile exactly with the on-screen report and CSV
(extends acceptance A7).

---

## P2-6 — Dark mode

**Goal:** the deferred theme.

**Build:** the `.dark` token block already exists in `src/app/globals.css`. Add a theme
toggle (`next-themes`, or a cookie-based switch for SSR-safe default), persist the
choice, and audit components for hard-coded colours.

**Open decision:** persist per user (DB) or per browser (cookie / localStorage).

**Done when:** every screen is legible in dark mode and the choice survives reload.

---

## P2-7 — *Conditional:* Manager role & team scoping

**Trigger:** Light Advert actually operates as multiple lead-owned teams.

**Build:** add `MANAGER` as a third `role`; a Manager ↔ Staff scoping relation
(`ManagedStaff` join or a `Team` entity). `requireManager` guard; Manager =
Admin-minus-account-management, scoped to their Staff. Every admin query and the
assignment picker gain an optional "scoped to managed staff" filter; reports, workload,
and task lists respect it.

**Honors:** roadmap.md deferred-decisions row. Invasive — touches authorization on every
admin route; do not start without the kickoff's yes. **New ADR** if adopted.

**Done when:** a Manager sees and assigns only their team; an Admin still sees all.

---

## P2-8 — *Conditional:* Client as a first-class entity

**Trigger:** need for client-facing or per-client reporting.

**Build:** `Client` model; migrate `Project.clientLabel` (free text) → `Project.clientId`
FK with a backfill; client filter on the Contribution Report; optional per-client
Contribution rollup.

**Honors:** roadmap.md deferred-decisions row. **New ADR:** promote client label → entity.

**Done when:** Projects reference a Client record and the report can filter by it.

---

## P2-9 — *Conditional:* Staff transparency

**Trigger:** Staff collectively ask for more visibility.

**Build:** an opt-in `shareTotal` flag on `StaffProfile`, **or** an anonymised
distribution view ("above the median for Video Editor this month") computed from
`summariseContribution` with names stripped. A raw names-and-numbers leaderboard stays
off the table — **ADR-0002 still stands**.

**Done when:** Staff can see their standing without any individual's name being exposed
to peers.

---

## P2-10 — *Conditional:* 2FA

**Trigger:** Phase 2 security pass.

**Build:** Better Auth `twoFactor` plugin (TOTP + backup codes); enrolment flow; policy
(all Admins required? all users?); the `two_factor` table.

**Honors:** roadmap.md; constraints.md §2 (2FA listed for Phase 2).

**Done when:** an enrolled user needs a TOTP code to sign in; backup codes work.

---

## P2-11 — Launch

**Goal:** the public site goes live cleanly.

**Build:** domain / DNS cutover + SSL; Resend domain verification on the live domain;
marketing analytics per the P2-0 decision; `sitemap.xml` / `robots.txt` / OG images;
Lighthouse performance + a11y pass; Playwright specs for the marketing pages and the
contact flow.

**Done when:** the site resolves on the real domain over HTTPS, the contact form
delivers, and analytics (if chosen) records a visit.

---

## Sequencing

P2-0 is mandatory-first. After that the two tracks are independent:

```
P2-0 ─┬─► P2-1 Notifications ──► P2-2 Calendar
      │
      └─► P2-3 Website ──► P2-4 CMS + Contact ──► P2-11 Launch

  anytime after P2-0:  P2-5 PDF · P2-6 Dark mode
  only if kickoff says yes:  P2-7 Manager · P2-8 Client · P2-9 Transparency · P2-10 2FA
```

Do whichever track Light Advert needs first. P2-7 (Manager) is the most invasive — if
it is in scope, land it before P2-1/P2-2 so notifications and the calendar are built
scope-aware from the start.

## New ADRs Phase 2 will need

- Notification delivery (in-app + email + Vercel Cron) — from P2-1.
- Marketing-asset image hosting — narrow amendment to ADR-0003 if portfolio images are
  uploaded rather than linked.
- Public-site analytics: yes/no and which tool.
- If adopted: Manager team-scoping model (P2-7); client label → entity (P2-8).
