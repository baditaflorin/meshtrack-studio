# 0040 - Real-Data Audit and Substance Success Metrics

## Status

Accepted

## Context

Phase 1 proved the happy path. Phase 2 needs a grounded definition of "smart" based on real project-like inputs instead of demo-only data.

## Decision

Use the 10 committed fixtures under `test/fixtures/realdata/` as the primary grading rubric for import, recovery, and export behavior.

Phase 2 success means:

- At least 8 of 10 fixtures import without manual editing
- All failures are actionable
- Canonical export is deterministic
- Large fixtures remain responsive

## Consequences

- Fixture regressions block the push.
- Import changes must explain which real-data gap they close.
- Docs and postmortem track pass-rate changes against the same corpus.

## Alternatives Considered

- Mocked-only test data: rejected because it would optimize for idealized inputs.
- Ad hoc manual QA: rejected because it does not prevent regressions.
