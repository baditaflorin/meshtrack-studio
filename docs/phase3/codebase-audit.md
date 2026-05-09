# Phase 3 Codebase Audit

Audit date: 2026-05-10

## DRY Violations

1. Import-status presentation is embedded directly in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx), making the same state hard to reuse elsewhere.

Resolved during Phase 3:

- ID generation now routes through [src/lib/id.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/lib/id.ts).
- Slugification now routes through [src/lib/slug.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/lib/slug.ts).

## SOLID / Module-Boundary Violations

1. [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx) is 896 lines and owns transport, storage, import UX, collaboration UX, motion UI, performance pads, toast state, and debug state.
2. [src/features/storage/projectImport.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/storage/projectImport.ts) is 1324 lines and mixes parsing, schema migration, inference, UI copy, provenance rules, normalization policy, and fixture-facing diagnostics.
3. [src/features/audio/audioEngine.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/audio/audioEngine.ts) owns synth construction, transport scheduling, FX state application, quantization, and visualizer plumbing.

## Dead Code / Dormant Surface

- No commented-out production blocks were found.
- No TODO/FIXME/XXX/HACK markers were found in source or docs after the merge cleanup.

## Type-Safety Audit

- No `@ts-ignore` usage remains.
- No `any` usage remains in source files after the merge cleanup.
- The main type-safety risk is still at JSON boundaries inside [src/features/storage/projectImport.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/storage/projectImport.ts), which is expected boundary code but too monolithic.

## Inconsistent Patterns

1. Motion controls still apply live overlays directly through `AudioEngine`, which is acceptable for session-only motion input but distinct from persisted FX state.
2. `App.tsx` still owns too much orchestration.
3. `projectImport.ts` still owns too much inference and diagnostic copy.

## Test Coverage Holes On Real-User Paths

1. Drag-drop and clear-local-save still lack e2e coverage, even though the flows now exist.
2. FX persistence is covered in unit tests, but not yet in e2e.
3. Project share URLs are covered in unit and e2e tests, but collaboration-vs-project-share confusion still depends on UI copy.
