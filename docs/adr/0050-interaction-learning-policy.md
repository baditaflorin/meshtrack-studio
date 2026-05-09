# 0050 - Interaction-Learning Policy

## Status

Accepted

## Context

The catalog allows session memory of user corrections, but Phase 2 is scoped to substance within the existing feature set.

## Decision

Do not persist user correction learning yet. Phase 2 surfaces repairs, confidence, and reasoning, but it does not silently adapt future defaults based on user history.

## Consequences

- Behavior stays deterministic and easier to test.
- A later phase can add explicit per-session learning with its own ADR.

## Alternatives Considered

- Silent per-user learning in this phase: rejected because it mixes new behavior policy with core importer hardening.
