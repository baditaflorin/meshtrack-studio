# 0048 - Determinism and Reproducibility Guarantees

## Status

Accepted

## Context

Phase 2 requires identical input to produce identical output.

## Decision

Canonical export is a stable, sorted JSON serialization of the normalized project. Canonical projects use `meshtrack.project.v2` and carry:

- provenance
- issue codes
- confidence
- preserved unknown fields under `extensions`

Re-importing canonical v2 projects returns the same project object without re-normalizing it.

## Consequences

- Round-trip export and re-import are lossless for canonical exports.
- Source fingerprints and issue logs remain stable across reruns.

## Alternatives Considered

- Recompute provenance on every import: rejected because it breaks byte-identical round-trips.
