# Contribution is measured in effort points, not hours or task count

Date: 2026-09-02

## Status

Accepted

## Context

Pay decisions at Light Advert use a contribution-weighted bonus pool, so the system needs
a per-person measure of work done in a period. The original requirements suggested
"tasks completed and/or hours worked".

## Decision

Each Task carries an **Effort Estimate** on the fixed scale **1, 2, 3, 5, 8, 13**, set by
an Admin at assignment. A Staff Member's **Contribution** over a date range is the sum of
those points across their approved-complete Tasks, bucketed by Approval Date. There is
**no time tracking anywhere** in the system, and raw task count is not the metric.

Effort Estimates are Admin-only to set or change, and any change after a Task has left the
Assigned status writes an Audit Entry with a required reason.

## Why

- **Task count** rewards slicing work into many small Tasks and ignores that Tasks vary by
  an order of magnitude in effort even within one Role.
- **Logged hours** are disputable ("I actually spent 40 on it") and reward working slowly.
- A **small fixed point scale** forces a quick comparative judgement at assignment time, is
  fast to agree, and is stable to reason about later.

## Consequences

- The measure is only as good as the Admin's estimates; the audit trail on estimate
  changes is what keeps that honest.
- Cross-Role comparison is still not meaningful, so Contribution Reports subtotal by the
  Role stamped on each Task and never present a single global ranking — see
  [0002](0002-no-competitive-ranking.md).
