# 0064 DRY Consolidation Map

- Status: accepted

## Context

Phase 3 audit found duplicated ID generation and slugification logic in multiple modules.

## Decision

Extract small shared helpers for:

- stable ID generation
- slugification

Do not force a larger abstraction over import or audio logic in this phase.

## Consequences

- Repeated string logic leaves feature modules.
- Large modules still need future extraction, but the easiest duplication is removed now.

## Alternatives Considered

- Broader utility refactor: rejected because it would risk mixing unrelated concerns during a usability phase.
