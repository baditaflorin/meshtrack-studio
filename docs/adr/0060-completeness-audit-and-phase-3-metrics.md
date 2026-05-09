# 0060 Completeness Audit And Phase 3 Metrics

- Status: accepted

## Context

Phase 2 made import logic smarter, but the merged 0.4.x app still had usability gaps around input coverage, output coverage, reset flows, persistent FX state, and documentation drift.

## Decision

Use the Phase 3 audit documents in `docs/phase3/` as the implementation rubric. Treat the following as release gates:

- green input and output rows have to work on the live app
- persisted project settings must survive save, export, import, and reload
- documentation claims must match the shipped product

## Consequences

- Phase 3 work is weighted toward completeness over new musical features.
- We will touch both product surface and code-health boundaries in the same phase.

## Alternatives Considered

- Ship the richer import engine without expanding input/output affordances: rejected because it leaves real users stuck behind a hidden file picker.
