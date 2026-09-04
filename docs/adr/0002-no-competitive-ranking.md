# Contribution Reports show totals, not a competitive ranking

Date: 2026-09-02

## Status

Accepted

## Context

The original requirements asked for a "Performance Ranking" that "automatically ranks staff
by completed tasks/hours over a selected period".

## Decision

The system produces **per-person Contribution totals** for a date range, sortable and
filterable by Role, with company-wide and per-Role subtotals. It does **not** present a
ranked "#1, #2, #3" leaderboard.

## Why

- Light Advert has about seven specialties across 8–15 people, so most Roles have only one
  or two people — "rank the Video Editors" is often a list of one.
- Cross-Role ranking was already identified in the requirements as unfair.
- A rank *position* drives no decision that the underlying total does not; the totals are
  exactly what splitting a bonus pool needs.
- A visible leaderboard in a small creative team carries a real morale cost — and the
  sorted totals stay Admin-only anyway (a Staff Member sees only their own numbers, PRD
  R43), which is what makes "no leaderboard" coherent rather than cosmetic.

## Consequences

- If transparency is later requested, the intended path is an opt-in "share my total" or an
  anonymised distribution ("above the median for your Role") — never a names-and-numbers
  board. Recorded in [roadmap.md](../roadmap.md).
