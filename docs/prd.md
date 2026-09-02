# Light Advert — Product Requirements Document (Phase 1)

## 1. Background

Light Advert is a digital marketing agency delivering creative and video-based work
through a team of specialists (content creation, filming, scriptwriting, voice over,
video editing, graphic design, motion graphics). Pay includes a contribution-weighted
bonus pool, and today there is no consistent, defensible way to see how much each person
actually contributed in a period.

The project is delivered in two phases:

- **Phase 1 (this document): the internal tool.** Assign work, track it through an
  approval gate, and measure each Staff Member's Contribution over a pay period.
- **Phase 2 (parked): the public marketing website**, plus notifications and a
  calendar/timeline view. Specified separately, later.

Domain vocabulary is defined in [../CONTEXT.md](../CONTEXT.md) and used verbatim here.

## 2. Goals

- **G1.** Every piece of creative work is captured as a Task with a single owner and an
  agreed Effort Estimate.
- **G2.** Work only counts once an Admin has approved it — no self-completion.
- **G3.** At any time, the Admin can produce a Contribution Report for a date range:
  per-person point totals, broken out by Role, exportable for payroll.
- **G4.** Historical pay-period numbers are stable once locked, and every change that
  could affect pay is audited.
- **G5.** The measure resists gaming — no reward for slicing work small, for working
  slowly, or for editing estimates after the fact.

## 3. Non-goals (Phase 1)

- Calculating money. The system outputs point totals and summaries; a human decides pay.
- Time tracking. No timers, no hours — not even informational.
- Competitive ranking / leaderboards.
- Notifications of any kind beyond the two auth emails.
- The public website, calendar/timeline view, Manager role, Client records, uploaded
  (non-link) files.

See [roadmap.md](roadmap.md) for the full parked list and [constraints.md](constraints.md)
§7 for the anti-requirements and why.

## 4. Personas

**Admin / Owner.** Runs the company. Creates accounts and Roles, creates Projects,
assigns Tasks with an Effort Estimate, approves completed work, locks pay periods, runs
reports. Full visibility. Does **not** earn Contribution.

**Staff Member.** A specialist holding one or more Roles. Sees their own assigned Tasks,
moves them to Review, attaches Deliverable links, comments. Sees their own Contribution
history and nothing about peers.

## 5. Phase 1 scope

### 5.1 Accounts & access

- **R1.** An Admin creates every account (email, name, one or more Roles). No public signup.
- **R2.** A new user sets their own password via a one-time emailed link.
- **R3.** Password reset is self-service by email.
- **R4.** Password minimum **8 characters**, rejected if present in the HaveIBeenPwned
  breached-password list. No complexity rules, no forced rotation.
- **R5.** Two access levels: Admin and Staff Member. Multiple Admins allowed; an Admin can
  promote another account to Admin. The last active Admin cannot be removed or demoted.
- **R6.** Staff session: 30-day rolling, no idle timeout. Admin session: 30-day rolling
  **plus a 2-hour idle timeout**.
- **R7.** Login is rate-limited (per-IP and per-account backoff) with generic error messages.
- **R8.** A seed script at deploy creates the first Admin, the seven Roles, and the
  "Internal / Ad-hoc" Project.

### 5.2 Roles

- **R9.** Roles are an admin-managed list, seeded with: Content Creator, Camera Operator,
  Script Writer, Voice Over Artist, Video Editor, Graphic Designer, Motion Graphic Designer.
- **R10.** A Role can be renamed anytime. It cannot be deleted while any Task or Staff
  Member references it.
- **R11.** A Staff Member holds one or more Roles; the first listed is their Primary Role.

### 5.3 Projects

- **R12.** Only an Admin creates Projects. Fields: name, deadline, priority
  (Low / Normal / High / Urgent), optional client label (free text), optional brief.
- **R13.** A Project is Active or Archived. Archiving hides it from assignment pickers; it
  does not affect historical Contribution.
- **R14.** Every Task belongs to exactly one Project. A permanent "Internal / Ad-hoc"
  Project exists for one-offs.
- **R15.** A Project can be archived anytime; it can be deleted only if it has no Tasks.

### 5.4 Tasks

- **R16.** An Admin creates a Task with: title, Project, exactly one assignee, exactly one
  stamped Role, Effort Estimate. Optional: Task Type, deadline (inherits the Project's if
  blank), priority, brief.
- **R17.** Effort Estimate is a point value from the fixed scale **1, 2, 3, 5, 8, 13**.
- **R18.** The stamped Role defaults to the assignee's Primary Role. The Admin may override
  it at assignment; choosing a Role the assignee does not hold is allowed but shows a soft
  warning.
- **R19.** Task Type is an optional free-form label with an admin-managed suggested list per
  Role. It is not constrained by the assignee's Roles and is not used for report filtering.
- **R20.** A Task carries zero or more Deliverables, each a label plus a URL. Any URL is
  accepted (basic format check only). No files are stored.
- **R21.** A Task has an append-only comment thread between the Admin and the assignee.
  Comments cannot be edited or deleted.
- **R22.** Task statuses: **Assigned, In Progress, Review, Completed, Cancelled**.
  - `Assigned → In Progress`: the assignee starts work.
  - `In Progress → Review`: the assignee submits. Only the assignee moves a Task to Review.
  - `Review → Completed`: **only an Admin**. This is Approval; it sets the Approval Date.
    There is no self-completion.
  - `Review → In Progress`: an Admin hands the Task back. No "Rejected" status, no required
    reason; feedback goes in the comment thread.
  - `Assigned | In Progress | Review → Cancelled`: Admin only, no reason required.
  - **Cancelled is terminal.** **Completed** is left only via an explicit, audited,
    reason-required "cancel approved Task" action by an Admin, which is blocked once the
    period is locked.
- **R23.** The assignee can change only: status (forward to Review), Deliverables, and
  comments, on their own Tasks.
- **R24.** An Admin can edit title, brief, Project, deadline, priority and Task Type freely
  and without audit (no pay impact).
- **R25.** Effort Estimate, assignee (Reassignment) and stamped Role are Admin-only to
  change, and every change after the Task has left Assigned writes an Audit Entry
  (who, when, old→new, **required reason**).
- **R26.** A not-yet-approved Task (Assigned / In Progress / Review) can be deleted by an
  Admin. A Completed Task cannot be deleted — the Admin cancels it with a reason instead.
- **R27.** For go-live backfill, an Admin may create a Task directly in any status with a
  back-dated Approval Date, but only into an **unlocked** pay period. Such Tasks are flagged
  "manually recorded" in the audit log.
- **R28.** Tasks are created one at a time. No bulk import.

### 5.5 Contribution

- **R29.** A Staff Member's Contribution over a date range is the sum of Effort Estimates on
  their Tasks in Completed status, counted by **Approval Date**.
- **R30.** On Reassignment, 100% of a Task's Contribution credit goes to whoever is the
  assignee at the moment of Approval. To divide credit, the Admin splits the work into
  separate Tasks.
- **R31.** Multi-person work is always modelled as separate Tasks — one per person per
  specialty. A Task never has more than one assignee.
- **R32.** A Cancelled Task earns zero Contribution regardless of work done. Partial work is
  credited by creating a separate, smaller **Kill Fee** Task; the cancelled Task's numbers
  are never adjusted.

### 5.6 Pay periods

- **R33.** The default pay period is a calendar month. Reports also accept any custom
  start/end date.
- **R34.** An Admin can **lock** a pay period. In a locked period, the Effort Estimate and
  Approval Date of every Task approved within the window can no longer be changed by anyone,
  including an Admin.
- **R35.** An Admin can **unlock** a locked period. Unlocking requires a typed reason and is
  audited.

### 5.7 Reporting & dashboards

- **R36. Contribution Report** — per-person point totals for a date range (default: current
  calendar month), sortable by total, filterable by stamped Role, with company-wide and
  per-Role subtotals. Each person's total expands to the list of Tasks behind it (title,
  Project, points, Approval Date).
- **R37.** Staff Members with zero approved Tasks in the range appear with a total of 0.
- **R38.** A Staff Member appearing under several Roles is listed in each of those per-Role
  subtotals with their Tasks divided accordingly; the company-wide total counts each person
  once.
- **R39.** The Contribution Report exports to CSV: one row per approved Task (Staff, stamped
  Role, Task, Project, points, Approval Date), plus per-person and grand total rows.
- **R40.** A locked period's report is recomputed live; because its inputs are frozen the
  result does not drift.
- **R41.** An Admin can view a single Staff Member's Contribution across all periods.
- **R42. Workload Board** — an Admin-only table listing every Staff Member with counts of
  their Tasks by status.
- **R43. Staff home** — a Staff Member's own Tasks grouped by status, plus their
  current-period Contribution total and history. A Staff Member never sees another person's
  totals or standing.

### 5.8 Audit

- **R44.** The system records an immutable Audit Entry for: Effort Estimate edits,
  stamped-Role edits, Approvals, Reassignments, back-dated ("manually recorded") Task
  creation, pay-period lock and unlock, and cancellation of an approved Task. Each carries
  who, when, old value, new value, and a reason where one is required.
- **R45.** Audit Entries are shown inline on the relevant Task and in an Admin-only audit
  screen filterable by Task, Staff Member, date and event type. They are retained
  indefinitely.

## 6. Acceptance criteria (representative)

- **A1.** A Staff Member cannot move any Task to Completed; the control is absent for them
  and the API rejects the transition.
- **A2.** Editing an Effort Estimate on an In Progress Task with no reason is rejected; with
  a reason it succeeds and produces an Audit Entry showing old and new values.
- **A3.** After locking January, changing the Approval Date or Effort Estimate of a Task
  approved on 15 January fails for an Admin; the same edit on a Task approved 2 February
  succeeds.
- **A4.** A Task submitted for Review on 31 January and approved on 3 February appears in
  the February Contribution Report, not January's.
- **A5.** Reassigning a Task from A to B and then approving it credits all of its points to
  B and none to A.
- **A6.** The Contribution Report filtered to "Video Editor" shows only points from Tasks
  stamped Video Editor, including such Tasks done by a person whose Primary Role is Content
  Creator.
- **A7.** CSV export totals reconcile exactly with the on-screen per-person and company
  totals.
- **A8.** A deactivated Staff Member cannot log in, receives no new assignments, and still
  appears in reports for periods where they have approved Tasks.

## 7. Open items

- Draft an internal staff privacy notice (Kenya Data Protection Act 2019) before go-live.
  Tracked in [roadmap.md](roadmap.md).
