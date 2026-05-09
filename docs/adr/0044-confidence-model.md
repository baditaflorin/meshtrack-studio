# 0044 - Confidence Model and Surfacing

## Status

Accepted

## Context

Phase 2 forbids silent wrongness. Import logic needs a visible honesty layer.

## Decision

Compute confidence from the repair set:

- `high`: no or very light normalization
- `medium`: recoverable repairs changed structural meaning
- `low`: import succeeded but the source shape required heavier adaptation

Confidence is shown in the UI and serialized in `importAnalysis`.

## Consequences

- Users see when Meshtrack is guessing.
- Tests can assert confidence floors per fixture.

## Alternatives Considered

- No confidence: rejected because repaired imports would look more certain than they are.
