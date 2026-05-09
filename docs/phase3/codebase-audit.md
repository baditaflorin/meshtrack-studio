# Phase 3 Codebase Audit

Audit date: 2026-05-10

## DRY Violations

1. ID generation is duplicated:
   - [src/features/studio/project.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/studio/project.ts):558
   - [src/features/collaboration/collaborationSession.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/collaboration/collaborationSession.ts):209

2. Slugification logic is duplicated:
   - [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx):309
   - [src/features/studio/project.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/studio/project.ts):511
   - [src/features/storage/projectImport.ts](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/features/storage/projectImport.ts):1223

3. Import-status presentation is embedded directly in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx):749-820, making the same state hard to reuse elsewhere.

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

1. Persisted project state is modeled in `StudioProject`, but session-only FX state still lives in `AudioEngine`.
2. Some user actions route through pure state updaters in `project.ts`, while others directly mutate side-effect systems such as `AudioEngine` without a canonical project state update.
3. File import is robust, but other input pathways do not reuse that same normalization surface because they do not exist yet.

## Test Coverage Holes On Real-User Paths

1. No e2e coverage for drag-drop, paste, clipboard import, or reset flows because those flows do not exist yet.
2. No tests verify that FX settings survive save/export/import because they are not part of project state yet.
3. No tests cover project-state share URLs because they do not exist yet.
