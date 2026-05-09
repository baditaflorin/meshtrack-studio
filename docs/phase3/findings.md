# Phase 3 Findings

Audit date: 2026-05-10

## Top 5 Usability Gaps

1. Mobile input still depends on the browser’s file and clipboard affordances.
2. Collaboration still swaps live state into the current session, which needs careful labeling.
3. `App.tsx` remains too large for long-term maintainability.
4. `projectImport.ts` still concentrates too much logic in one file.
5. Share URLs are practical for sketches, not arbitrarily large projects.

## Top 5 Half-Baked Features: Finish, Hide, Or Delete

1. Master FX controls: finished and persisted.
2. Project import UX: finished with drag-drop, paste, and clipboard paths.
3. Project sharing: finished with a stateful URL, separate from collaboration-room links.
4. Reset/clear-state workflow: finished with explicit new-project and clear-local-save actions.
5. Release/docs messaging: finished so README claims match the current product surface.

## Top 5 Codebase Pain Points

1. `App.tsx` is a god component.
2. `projectImport.ts` is the single biggest change bottleneck in the repo.
3. Input/output affordances still live inside `App.tsx` instead of a dedicated project I/O surface.
4. Persisted project state and live audio-engine overlays still meet in `AudioEngine`, even though the canonical data model is much healthier now.
5. Output/input affordances are spread across UI code instead of a reusable project I/O surface.

## Top 5 Documentation / Reality Mismatches

1. Room sharing versus project sharing still needs careful user-facing explanation.
2. Offline support remains best-effort rather than deterministic across every device/browser pair.
3. The README is aligned now, but the live product still needs ongoing claim discipline as new features land.

## Definition Of Fully Usable For Meshtrack Studio

1. A stranger can start a new sketch, edit it, save it, reload, and continue where they left off.
2. A stranger can bring their own project-shaped JSON by file, drag-drop, paste, or clipboard and get a useful result.
3. A stranger can take their work back out as a file, copied JSON, or a shareable project URL.
4. A stranger can change FX/scale settings, reload, and get the same sound-state back.
5. A stranger can understand the difference between sharing a room and sharing a project.

## Phase 3 Success Metrics

- Every green input path works on the live app and has at least one test.
- Every green output path works on the live app and has at least one test.
- FX state survives save, export, import, and reload.
- New-project and clear-local-state flows leave no stale project behind.
- README release/version references are current and all user-visible claims have a matching test or documented limitation.

## Out Of Scope

- No new musical features beyond making current controls and state pathways complete.
- No backend, auth, or architecture-mode change.
- No marketing/polish pass.
- No remote URL scraping/import flow that would imply a backend or secret-bearing proxy.
