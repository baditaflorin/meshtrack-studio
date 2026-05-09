# 0046 - Performance Budgets Per Operation

## Status

Accepted

## Context

Phase 2 import logic adds normalization and diagnostics, which can quietly get slower as heuristics accumulate.

## Decision

Measure fixture import performance and hold the importer to lightweight local budgets:

- median fixture import under 300 ms
- deterministic export under 100 ms for the committed corpus
- no blocking loop large enough to freeze ordinary fixture imports

Results are recorded in `docs/perf/phase2-substance.md`.

## Consequences

- Performance becomes part of the release contract.
- Future inference work must stay honest about cost.

## Alternatives Considered

- No budget until import feels slow: rejected because regressions become subjective and late.
