# Phase 3 Feature Claims Audit

Audit date: 2026-05-10

| Claim source           | Claim                                                            | Status | Notes                                                                                                  |
| ---------------------- | ---------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| README “What Works”    | Four-track 16-step sequencer                                     | green  | Accurate.                                                                                              |
| README “What Works”    | Transport, tempo, randomize, clear, mute, solo, per-track volume | green  | Accurate.                                                                                              |
| README “What Works”    | Local autosave, manual save, JSON export/import                  | green  | Accurate.                                                                                              |
| README “What Works”    | WebRTC collaboration rooms                                       | green  | Accurate, with public signaling dependency.                                                            |
| README “What Works”    | PWA manifest and best-effort offline service worker              | yellow | Installable shell exists, but the README oversells practical offline reuse of imported/exported state. |
| README “What Works”    | Visible version and commit on the live page                      | green  | Accurate.                                                                                              |
| README “Release”       | `v0.1.0` marks the current Pages version                         | red    | Stale. The repo has already moved beyond that release line.                                            |
| In-app import behavior | Import arbitrary project JSON                                    | yellow | Phase 2 makes the importer smart, but the UI still exposes only a file picker path.                    |
| In-app FX panel        | Effects and scale settings are part of the project               | red    | Scale persists, but the reverb/delay/filter controls are session-only today.                           |

## Highest-Priority Mismatches

1. README release text is stale.
2. FX controls visually read like saved project settings, but only the scale controls persist.
3. Import capability is broader than the UI affordance, which makes the product undersell its strongest logic.
