# Light Advert — Phase 1 End-to-End Plan

Sequenced, dependency-ordered build plan for the internal tool. Each milestone lists
**Goal**, **Build**, **Honors** (PRD requirements + invariants + ADRs it must not break),
and **Done when**.


Reference docs: [prd.md](prd.md) (R1–R45, A1–A8), [data-model.md](data-model.md),
[architecture.md](architecture.md), [adr/](adr/). Domain rules already exist as pure,
tested functions in `src/server/domain/` — **wire to them, do not reimplement**.

---


## Conventions to establish first (part of Milestone 1)

- **Reads** = Server Components calling query modules in `src/server/db/<aggregate>.ts`.
- **Writes** = Next server actions in `src/server/actions/<aggregate>.ts`. Every action:
  1. `requireUser()` / `requireAdmin()` (from `src/server/auth/guards.ts`)
  2. validate input with a zod schema in `src/server/validation/`
  3. call `src/server/domain/*` for every rule decision (transition legality, reason
     requirement, lock check, effort-points validity, last-Admin check)
  4. Prisma write **and** any `AuditEntry` in a single `prisma.$transaction`
  5. `revalidatePath(...)` the affected routes
  6. return `{ ok: true, ... }` or `{ ok: false, error }` — never throw to the client
- **`withAudit(tx, entry)`** helper: writes an `AuditEntry`, calling
  `assertReason(entry.eventType, entry.reason)` first (`src/server/domain/audit.ts`).
- **`loadActiveLocks()`** + `isApprovalDateLocked()` guard: called by every write that
  touches `effortPoints` or `approvalDate` (ADR-0002 integrity, R34).
- Forms: shadcn `form` + `useActionState`. Install the component set up front:
  `pnpm dlx shadcn@latest add button input label textarea select table dialog badge sonner tabs`.

---

## Milestone 0 — Infrastructure & first run

**Goal:** the app runs against a real Postgres, is deployed, and the first Admin can sign in.

**Build**

1. **Supabase project.** Create it (region closest to EAT). Take both connection strings:
   pooled → `DATABASE_URL`, direct → `DIRECT_URL`. Add `directUrl = env("DIRECT_URL")` to
   the `datasource` block in `schema.prisma`. Put both in `.env` and (later) Vercel.
2. **First migration.** `pnpm prisma migrate dev --name init`. Commit `prisma/migrations/`.
3. **Secrets.** `openssl rand -base64 32` → `BETTER_AUTH_SECRET`. Set `BETTER_AUTH_URL`
   for local and prod.
4. **Seed.** Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME`, run `pnpm db:seed`. Verify: 7
   Roles, one `user` with `role = ADMIN`, the `Internal / Ad-hoc` Project.
5. **Stopgap admin password.** Add `scripts/set-password.ts` that sets the Admin's
   password through Better Auth's server API, so you can log in before Resend exists.
   (Delete once the email flow works, or keep as an ops tool.)
6. **Vercel.** Import the repo, set all env vars, deploy. Confirm `/` and `/login` render
   and `/app` redirects to `/login`.
7. **CI.** `gh auth refresh -h github.com -s workflow`, then commit
   `.github/workflows/ci.yml` and confirm it goes green on a PR.

**Honors:** R8 (seed provisions first Admin + Roles + Internal/Ad-hoc Project);
constraints.md §5 (enable Supabase PITR — or record it on the pre-go-live checklist if
starting on the free tier).

**Done when:** you sign in as the Admin on the deployed URL and reach `/app`.

---

## Milestone 1 — Authentication end-to-end

**Goal:** real accounts, real password lifecycle, hardened login.

**Build**

1. **Set / reset password pages.** `/reset-password?token=…` and `/forgot-password`.
   Account creation and password reset are the *same* flow: a new user gets a
   request-password-reset email (`sendPasswordEmail` is already wired into Better Auth's
   `sendResetPassword`).
2. **Resend.** Verify the sending domain; set `RESEND_API_KEY`, `EMAIL_FROM`.
3. **HIBP breached-password check (R4).** `src/server/auth/hibp.ts` — k-anonymity range
   API. Call `assertNotBreached(password)` in the set/reset-password action; add a Better
   Auth `hooks.before` on the reset path as a backstop.
4. **Login rate limiting (R7).** Configure Better Auth's built-in `rateLimit` with a
   `customStorage` backed by Upstash (`src/server/ratelimit/upstash.ts`). Generic error
   for unknown user / wrong password / throttled.
5. **Admin idle timeout (R6).** `src/middleware.ts`: for an Admin session, read a
   `last_active` cookie; if older than `ADMIN_IDLE_TIMEOUT_MS`, clear the session and
   redirect to `/login?reason=idle`. Refresh the cookie on each request. (Replaces the
   `TODO(auth R6)` in `guards.ts`.)
6. **Last-Admin guard (R5).** `src/server/domain/admin.ts` → `assertNotLastAdmin(userId)`
   counting `ACTIVE` Admins. Used by deactivate / demote actions in M2.
7. **Decision:** adopt Better Auth's `admin` plugin (gives `createUser`, `setRole`,
   ban) vs. hand-roll thin actions. Recommendation: **hand-roll** — the custom rules
   (last-Admin, primary Role, one-or-more Roles) need bespoke logic anyway, and it keeps
   `user.role` / `user.status` semantics ours.

**Honors:** R1–R8.

**Done when:** Admin creates a Staff account → Staff receives the email → sets an
8-char, non-breached password → signs in → lands on `/app`. Six failed logins are
throttled. An Admin idle 2 h is bounced to `/login`.

---

## Milestone 2 — Roles & Staff administration

**Goal:** the Admin can shape the roster.

**Build**

- **Roles** (`/app/admin/roles`): list by `orderIndex`; create; rename; reorder; delete.
  Delete blocked when `RoleAssignment` or `Task.stampedRoleId` references it —
  `db/role.ts#countReferences`.
- **Task Types**: per-Role editable list (`TaskType` rows). Add / remove only.
- **Staff** (`/app/admin/staff`): list (name, email, role, status, Roles); create
  (email, name, ≥1 Role, one marked Primary) → fires the set-password email; edit (name,
  Roles, Primary); deactivate / reactivate; promote / demote Admin. Deactivate or demote
  of an Admin runs `assertNotLastAdmin`.

**Honors:** R9–R11; invariants 8 (last Admin), 9 (Role delete blocked). Primary Role must
be among assigned Roles; a `STAFF` user has ≥1 Role.

**Done when:** you can add "Photographer", assign it to a person as a second Role, and
cannot delete a Role that is in use or demote the only Admin.

---

## Milestone 3 — Projects

**Goal:** a container for Tasks.

**Build** (`/app/admin/projects`): list with Active / Archived filter; create (name,
deadline, priority, optional `clientLabel`, optional `brief`); edit; archive / unarchive;
delete (blocked when it has any Task — `db/project.ts#taskCount`). The seeded
`Internal / Ad-hoc` Project cannot be archived or deleted.

**Honors:** R12–R15; invariant 9 (Project delete blocked while non-empty).

**Done when:** archiving a Project removes it from assignment pickers without touching
historical Contribution.

---

## Milestone 4 — Tasks  *(the bulk of Phase 1)*

**Goal:** the full Task lifecycle with audit and lock enforcement.

**Build — sub-steps**

- **4a Create / assign.** `createTask` — title, projectId, assigneeId, stampedRoleId
  (default = assignee's Primary Role; a non-held Role is allowed, the UI shows a soft
  warning), `effortPoints` (validate with `isEffortPoints`), optional type / deadline /
  priority / brief. Status `ASSIGNED`. No `AuditEntry` (estimate set for the first time).
- **4b List & detail.** `/app/admin/tasks` with filters (project, assignee, status,
  stamped Role); `/app/admin/tasks/[id]` detail showing deliverables, comments, and the
  inline audit trail (feeds M8).
- **4c Transitions.** `transitionTask(taskId, to)` — actor = `ADMIN` if session is Admin,
  else `ASSIGNEE` iff `task.assigneeId === session.user.id`. Resolve legality with
  `findTransition(from, to, actor)`.
  - `REVIEW → COMPLETED`: set `approvalDate = now` (EAT), `approvedById`; write
    `TASK_APPROVED`.
  - `REVIEW → IN_PROGRESS`: no reason (comment thread carries feedback).
  - active `→ CANCELLED`: no reason.
  - `COMPLETED → CANCELLED`: **reason required**; `isApprovalDateLocked` must be false;
    write `APPROVED_TASK_CANCELLED`.
- **4d Estimate / assignee / stamped-Role edits.** `updateTaskEstimate`,
  `reassignTask`, `updateStampedRole` — Admin only. If `status` has ever left `ASSIGNED`:
  require `reason`, check `isApprovalDateLocked(task.approvalDate)`, write
  `ESTIMATE_CHANGED` / `TASK_REASSIGNED` / `STAMPED_ROLE_CHANGED`. Free, unaudited edits
  (`updateTaskDetails`): title, brief, project, deadline, priority, type.
- **4e Deliverables.** Add / edit / remove `{ label, url }` — assignee or Admin.
  Syntactic URL check only. Not audited.
- **4f Comments.** Append-only thread, assignee + Admins. No edit, no delete.
- **4g Backfill.** `recordPastTask` — any status (usually `COMPLETED`), back-dated
  `approvalDate`; reject if that date is inside a locked window; set
  `manuallyRecorded = true`; write `TASK_MANUALLY_RECORDED` with the initial values.
- **4h Delete.** Only while `status ∈ {ASSIGNED, IN_PROGRESS, REVIEW}`.

**Honors:** R16–R28; ADR-0001 (points), ADR-0003 (links); invariants 1–3, 10. Staff can
call only `transitionTask` (`IN_PROGRESS → REVIEW`), deliverable, and comment actions —
enforced by the actor check, not the UI.

**Done when:** A1 (Staff cannot complete), A2 (estimate edit needs a reason + audit),
A5 (reassign → 100 % credit to new assignee at approval) all pass by hand.

---

## Milestone 5 — Approval → Contribution Report

**Goal:** the payroll-support output.

**Build**

- Approval itself is done in 4c.
- **Report** (`/app/admin/reports`): date-range picker (default = current EAT month via
  `currentEatMonthBounds`), optional stamped-Role filter. Query
  `getApprovedTasksInRange(start, end, roleId?)` → `ApprovedTaskRow[]`; roster =
  active users **plus** any off-roster assignee with rows. Feed
  `summariseContribution(rows, roster)`. Render per-person totals (expand to the Task
  list behind each), company total, per-Role subtotals. Zero-Contribution people show as
  0.
- **CSV** (`/app/admin/reports/export?from=&to=&role=`): route handler →
  `contributionCsv(rows, roster)` → `text/csv` attachment.
- **Per-person history** (`/app/admin/staff/[id]`): Contribution across all periods.

**Honors:** R29–R32, R36–R41; ADR-0001, ADR-0002; invariants 6, 7.

**Done when:** A4 (approval-date period bucketing), A6 (Role filter by stamped Role),
A7 (CSV totals reconcile with the screen) pass.

---

## Milestone 6 — Pay-period lock / unlock

**Goal:** frozen history.

**Build** (`/app/admin/reports` → a "Periods" tab, or `/app/admin/periods`): list
`PayPeriodLock` rows; **Lock** a month or custom range → insert row, write
`PERIOD_LOCKED`; **Unlock** → set `unlockedAt` / `unlockedById` / `unlockReason`
(**reason required**), write `PERIOD_UNLOCKED`. `loadActiveLocks()` +
`isApprovalDateLocked()` are already consumed by 4c / 4d / 4g — verify each path calls
them.

**Honors:** R33–R35; invariant 4. Report recompute over a locked period is automatic
(Contribution is derived) — no snapshot to store.

**Done when:** A3 passes — after locking January, an Admin cannot change the estimate or
approval date of a Task approved 15 Jan, but can for one approved 2 Feb.

---

## Milestone 7 — Workload Board & Staff home

**Goal:** the two dashboards.

**Build**

- **Workload Board** (`/app/admin/workload`): `groupBy (assigneeId, status)` → per-person
  counts by status.
- **Staff home** (`/app`): the signed-in Staff Member's own Tasks grouped by status, plus
  their current-period Contribution total and history. Reuse `summariseContribution`
  scoped to self. Never shows another person's numbers.

**Honors:** R42–R43; invariant — Staff visibility boundary (also underpins ADR-0002).

**Done when:** a Staff Member sees only their own data; the Workload Board totals match
the Task list.

---

## Milestone 8 — Audit log screen

**Goal:** the defensible record, browsable.

**Build** (`/app/admin/audit`): filter by Task / actor / date / `eventType`; paginated,
newest first. Inline audit trail on the Task detail page was built in 4b — confirm it
reads the same data.

**Honors:** R44–R45. `AuditEntry` rows are append-only and retained indefinitely.

**Done when:** every event type from M4/M6 appears with actor, timestamp, old→new, and
reason where required.

---

## Milestone 9 — Deploy hardening & acceptance

**Goal:** Phase 1 is done.

**Build**

- **e2e for A1–A8** (Playwright): a `global-setup` that migrates + seeds a fixture DB
  (one Admin, two Staff, the Roles, one Project). One spec per acceptance criterion.
- **Optional CI e2e job**: separate workflow with a Postgres service container (the PR
  gate stays typecheck + lint + unit only — architecture.md §12).
- **Pre-go-live checklist** ([roadmap.md](roadmap.md)): staff privacy notice (Kenya DPA
  2019); confirm Supabase PITR; Resend domain verified; restrict the Supabase DB role so
  only the app role writes and the audit table has no update/delete path; set the first
  real Pay Period; real `SENTRY_DSN` in Vercel + a captured test error.

**Done when:** A1–A8 pass in CI (or a documented manual run) and the checklist is clear.

---

## Sequencing

```
M0 ─► M1 ─► M2 ─┐
            M3 ─┼─► M4 ─► M5 ─► M6 ─► M9
                │         └► M7
                │         └► M8
```

M2 and M3 are independent of each other; both precede M4. M7 and M8 can start once M4
lands. M6 must come after M5 (locks constrain report inputs and edits). M9 is last.

## Phase 1 definition of done

Acceptance criteria **A1–A8** pass; the pre-go-live checklist is complete; the app is
deployed on Vercel + Supabase with PITR on and the first Admin operating.
