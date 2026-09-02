# Light Advert

Light Advert is a digital marketing agency. This system is its public website plus an
internal tool for assigning creative work to staff and measuring each person's
contribution so pay decisions can be made transparently.

## People

**Staff Member**:
A person who performs creative work. Holds one or more Roles, is assigned Tasks, and
sees only their own Tasks, Deliverables, and Contribution history.
_Avoid_: employee, worker, user, resource

**Admin**:
The owner/manager who creates accounts, assigns Tasks, approves completion, locks Pay
Periods, and generates Contribution Reports. Has full access.
_Avoid_: manager, owner, superuser

**Role**:
A creative specialty: Content Creator, Camera Operator, Script Writer, Voice Over
Artist, Video Editor, Graphic Designer, Motion Graphic Designer. A Staff Member holds
one or more Roles. Every Task is stamped with exactly one Role at assignment (usually
one the assignee holds), and Contribution Reports subtotal by that stamped Role — not
by the assignee's profile.
_Avoid_: title, position, department, discipline

**Primary Role**:
The first of a Staff Member's Roles. Used as the default Role stamped on a Task when one
is assigned to them; the Admin can override it at assignment.
_Avoid_: main role, default specialty

## Work

**Project**:
A named body of work with a deadline and priority that groups related Tasks, and is
either Active or Archived. May carry a free-text client label and a short brief.
_Avoid_: campaign, job, engagement, account

**Task**:
The unit of assignable work. Belongs to a Project, has exactly one assignee, is stamped
with exactly one Role, carries an Effort Estimate, and moves through Task Statuses to
completion.
_Avoid_: ticket, todo, assignment, item

**Task Status**:
The stage of a Task: Assigned, In Progress, Review, Completed, or Cancelled. Only the
assignee moves a Task into Review; only an Admin moves it to Completed or Cancelled.
There is no Rejected status — during Review the Admin either approves the Task or hands
it back, and feedback goes through the Task's comment thread.
_Avoid_: state, stage, phase, column

**Task Type**:
An optional, free-form label on a Task (e.g. "voice over", "video edit"), with a
suggested list per Role but no hard constraint. Not used for Contribution Report
filtering.
_Avoid_: category, kind, discipline

**Deliverable**:
The finished output of a Task, recorded as a link to an externally hosted file. Not an
uploaded video.
_Avoid_: asset, attachment, upload, file

**Reassignment**:
Changing the single assignee of a Task. All Contribution credit goes to whoever is the
assignee at Approval; to divide credit, an Admin splits the work into separate Tasks.
_Avoid_: handover, transfer, delegation

## Contribution & Pay

**Effort Estimate**:
The manager-set measure of how much work a Task represents, on the fixed point scale
1, 2, 3, 5, 8, 13. Set at the Assigned status; editable only by Admin, and only with an
audit entry once the Task has left Assigned.
_Avoid_: weight, size, hours, cost

**Approval**:
The act of an Admin moving a Task to Completed after Review. The Approval Date is when
this happens and determines which Pay Period the Task's Contribution counts toward.
_Avoid_: sign-off, acceptance, closing

**Contribution**:
The sum of Effort Estimates on a Staff Member's Tasks that reached Completed status,
counted by Approval Date within a chosen date range. The metric that informs pay
decisions.
_Avoid_: performance, productivity, score, output

**Kill Fee**:
A separate, smaller Task an Admin creates to credit partial work on a Cancelled Task,
keeping the record auditable instead of adjusting the cancelled Task's numbers.
_Avoid_: partial credit, compensation task

**Pay Period**:
The date range over which Contribution is totalled to inform payment. Defaults to a
calendar month; the Admin may also report over any custom range.
_Avoid_: pay cycle, billing period

**Locked Pay Period**:
A Pay Period an Admin has locked, freezing the Effort Estimate and Approval Date of
every Task approved within it so historical totals cannot drift after payment.
_Avoid_: closed period, finalised period, frozen month

**Audit Entry**:
An immutable record of a change that could affect pay: Effort Estimate edits, Role-stamp
edits, Approvals, Reassignments, back-dated Task creation, Pay Period lock and unlock,
and cancellation of an approved Task. Each carries who, when, old value, new value, and
a reason where one is required. Kept forever.
_Avoid_: log line, history record, changelog

**Contribution Report**:
The per-person summary of Contribution over a Pay Period or custom date range, sortable
by total points, filterable by the Role stamped on each Task, with company-wide and
per-Role subtotals, exportable as CSV to support payroll. A Staff Member with several
Roles appears in several per-Role subtotals; the company-wide total counts each person
once. Not a competitive ranking.
_Avoid_: payroll report, leaderboard, performance ranking

**Workload Board**:
An Admin-only screen listing every Staff Member with counts of their Tasks by Status.
The original requirements' "Workload Dashboard", without the calendar.
_Avoid_: workload dashboard, capacity view
