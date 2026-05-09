# 0049 - Inspectability and Debug Surface

## Status

Accepted

## Context

Phase 2 inference needs an explicit inspection path for support and power users.

## Decision

Expose a debug surface behind `?debug=1` that shows:

- import state
- provenance
- issue list
- decision log
- normalized track IDs

## Consequences

- Support and QA can inspect import decisions without browser devtools spelunking.
- Debug information does not clutter the default UI.

## Alternatives Considered

- No debug surface: rejected because inference-heavy behavior becomes hard to trust and diagnose.
