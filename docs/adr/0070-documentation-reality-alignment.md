# 0070 Documentation Reality Alignment

- Status: accepted

## Context

README release/version text and a few feature descriptions had drifted from the shipped app.

## Decision

Treat README feature bullets and release text as test-backed claims. Remove or rewrite stale claims rather than leaving them aspirational.

## Consequences

- The README becomes a product contract instead of a memory of earlier milestones.

## Alternatives Considered

- Leave version text loose and generic: rejected because the live page already exposes explicit version metadata.
