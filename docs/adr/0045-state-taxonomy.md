# 0045 - State Taxonomy

## Status

Accepted

## Context

Import, storage recovery, and collaboration now have meaningful intermediate and failure states.

## Decision

Document and implement explicit states for import, storage, and collaboration. The authoritative list lives in `docs/phase2-substance/states.md`.

## Consequences

- No failure may silently reset the user to the demo project.
- Every recoverable state needs a visible exit path.

## Alternatives Considered

- Implicit state through toasts alone: rejected because it creates ambiguity and stuck-state risk.
