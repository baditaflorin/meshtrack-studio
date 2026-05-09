# 0041 - Input Robustness and Normalization Policy

## Status

Accepted

## Context

Real imports arrive with BOMs, CRLF, trailing commas, numeric strings, wrapped objects, duplicate IDs, and inconsistent pattern formats.

## Decision

Normalize safe compatibility issues at the boundary:

- strip UTF-8 BOM
- normalize line endings for hashing and diagnostics
- parse tolerant JSON with trailing-comma support
- coerce safe numeric and boolean strings
- infer common wrapper and pattern fields
- reject broken syntax with a precise, actionable error

## Consequences

- Users correct the app's first guess instead of pre-cleaning files.
- Every repair must be reported in `importAnalysis`.
- Dangerous ambiguity still fails loudly rather than silently guessing.

## Alternatives Considered

- Strict schema-only parsing: rejected because it performs poorly on real user data.
- Heuristic parsing without reporting: rejected because it creates silent wrongness.
