# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 1/10 fixtures completed the primary import flow without manual file edits.

After: 8/10 fixtures complete the primary import flow. The remaining 2 fixtures fail intentionally, but now fail with actionable diagnostics instead of generic errors.

| Fixture                            | Before              | After      |
| ---------------------------------- | ------------------- | ---------- |
| clean-v1-export.json               | pass                | pass       |
| bom-crlf-export.json               | fail                | pass       |
| trailing-comma-project.json        | fail                | pass       |
| numeric-strings-project.json       | fail                | pass       |
| eight-step-sequencer.json          | fail                | pass       |
| duplicate-track-ids.json           | wrong-but-confident | pass       |
| wrapped-project-with-metadata.json | fail or silent loss | pass       |
| huge-12-track-project.json         | fail                | pass       |
| empty-input.txt                    | generic fail        | clear fail |
| truncated-broken-project.json      | generic fail        | clear fail |

## Top 5 Logic Gaps: Closed Or Not

1. Exact-schema-only import: closed with tolerant parsing, wrapper inference, type coercion, and pattern normalization.
2. Generic import errors: closed with explicit failure codes and `what / why / now what` copy.
3. Duplicate ID wrongness: closed with deterministic ID rewrites.
4. Silent metadata loss: closed with canonical `extensions` preservation and provenance reporting.
5. Non-deterministic or lossy round-trip: closed for canonical v2 exports through stable JSON serialization and canonical re-import.

## Smart Behaviors That Now Work

- Meshtrack imports project-like JSON instead of requiring an exact Phase 1 export.
- Common messes such as BOM, CRLF, trailing commas, numeric strings, wrapped projects, and duplicate IDs are repaired automatically and explained.
- Imports surface confidence, issues, decisions, and provenance in the UI.
- Canonical exports re-import byte-identically in the fixture suite.
- Large projects beyond 8 tracks import successfully.

## Determinism Check

- Successful fixtures: pass
- Designed-failure fixtures: pass, because they fail with stable error codes instead of unstable behavior

## Performance

Source: `docs/perf/phase2-substance.md`

- Median import: 0.76 ms
- Worst import: 53.45 ms
- Median export: 0.06 ms
- Worst export: 9.72 ms

## Surprises

- The importer needed a canonical-project fast path to preserve provenance and round-trip determinism.
- UTF-8 decode success was not enough; replacement characters still needed a Windows-1252 fallback path.
- The biggest user-facing win came from import honesty, not from adding more musical surface area.

## Phase 3 Candidates

1. Teach the importer to recover top-level arrays and additional foreign project shapes even more aggressively.
2. Add cancellation and progress UI for very large or streamed imports.
3. Persist a structured activity log for imports, saves, and collaboration events.
4. Add explicit session-level correction memory instead of only reporting repairs.
5. Expand the fixture corpus with non-JSON exchange formats.

## Honest Take

Meshtrack feels much less like a toy on import and recovery now. A user can bring messy project-like JSON and usually get a usable first guess instead of a brick wall.

It still feels toy-like in the musical sense because the sequencing surface is intentionally small: no arrangement view, no piano roll, no sample editing, no MIDI interchange. Phase 2 fixed brittle substance inside the existing feature set, but it did not turn the product into a full production DAW.
