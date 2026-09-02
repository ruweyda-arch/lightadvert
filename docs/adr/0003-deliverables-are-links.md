# Deliverables are external links, not uploaded files

Date: 2026-09-02

## Context

The original requirements said staff would "attach finished files (videos, scripts,
designs) directly to their tasks". Light Advert's output includes multi-gigabyte video.

## Decision

A **Deliverable** is a label plus a URL pointing at a file hosted elsewhere (Google Drive,
Frame.io, Dropbox, YouTube/Vimeo, and so on). The system stores **no files** and has no
object storage. URLs get syntactic validation only — no host allowlist, no fetching, no
preview.

## Why

Hosting multi-GB video means object storage, upload pipelines, streaming delivery,
lifecycle and cost management, and virus scanning — a large surface for no real benefit,
since the team already keeps master files in dedicated tools. A URL is enough to review the
work and to keep an audit link from the Task.

## Consequences

- The system cannot guarantee a Deliverable link stays live or unchanged; this is accepted.
- If provenance ever matters, a lightweight "Deliverable snapshot" (hash + timestamp) could
  be added later without changing the model.
