# Phase 2 State Taxonomy

## Import States

- `idle`: no import in progress and no import report yet
- `reading-input`: file bytes are being read
- `analyzing-input`: the importer is decoding, parsing, and inferring structure
- `imported-clean`: import succeeded with high confidence and no warnings
- `imported-repaired`: import succeeded after normalization or inference
- `imported-low-confidence`: import succeeded but needs verification
- `import-failed-recoverable`: import failed with a user-actionable explanation
- `import-failed-fatal`: import failed and no safe fallback object exists

## Storage States

- `storage-unknown`: startup before IndexedDB result
- `storage-ready`: local persistence is available
- `storage-unavailable`: browser storage is not available
- `storage-recovered`: invalid saved data was ignored and surfaced to the user

## Collaboration States

- `collab-idle`: not in a room
- `collab-connecting`: provider setup in progress
- `collab-connected`: room open and snapshots normalized
- `collab-error`: provider failed or delivered an invalid snapshot

## Exit Rules

- Every failure state must expose a next step in UI copy.
- No state may silently reset the user to the demo project without an explanation.
- Long-running analysis must be cancelable or visibly bounded.
