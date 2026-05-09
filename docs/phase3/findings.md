# Phase 3 Findings

Audit date: 2026-05-10

## Top 5 Usability Gaps

1. The app can only import through a hidden file picker, even though the importer is much smarter than that.
2. There is no explicit “new project” or “clear local autosave” flow, so state reset is ambiguous.
3. The FX panel reads like saved project state, but most of those controls are session-only.
4. Export only means “download a file”; there is no copy-to-clipboard or project-share URL.
5. README and release messaging lag behind the actual product state, which weakens trust.

## Top 5 Half-Baked Features: Finish, Hide, Or Delete

1. Master FX controls: finish and persist.
2. Project import UX: finish with drag-drop, paste, and clipboard paths.
3. Project sharing: finish with a stateful URL, not just collaboration-room links.
4. Reset/clear-state workflow: finish with explicit new-project and clear-local-state actions.
5. Release/docs messaging: finish so version, release note, and README claims match reality.

## Top 5 Codebase Pain Points

1. `App.tsx` is a god component.
2. `projectImport.ts` is the single biggest change bottleneck in the repo.
3. ID and slug helpers are duplicated.
4. Persisted project state and live audio-engine state are split inconsistently.
5. Output/input affordances are spread across UI code instead of a reusable project I/O surface.

## Top 5 Documentation / Reality Mismatches

1. README release text still references `v0.1.0`.
2. README understates project portability because it only talks about file import/export, not state-level sharing.
3. The FX panel implies persistence it does not yet provide.
4. The app’s strongest Phase 2 capability, tolerant import, is not reflected in the main user workflow.
5. There is no limitations section calling out what collaboration sharing does not do.

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
