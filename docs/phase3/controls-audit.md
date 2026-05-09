# Phase 3 Controls Audit

Audit date: 2026-05-10

## Controls That Work End To End

- Transport: play, stop, tempo slider, tap tempo, randomize pattern, randomize sounds, clear pattern
- Sequencer grid step toggles
- Live pads and keyboard triggers
- Mixer sound, note, volume, mute, solo
- Collaboration room join, leave, room-name generation, link copy
- Save, export, import file
- Import report and importer reasoning disclosures
- Motion DJ permission prompt and live telemetry display

## Controls That Are Present But Incomplete

1. Master FX sliders in [src/components/studio/FxPanel.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/components/studio/FxPanel.tsx)
   - Reverb, delay, filter cutoff, and filter type affect live audio only.
   - They do not persist into saved/exported project state.
   - They use `defaultValue`, so the UI cannot prove what the current saved setting is after reload.

2. Record toggle in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx)
   - The button is functional, but there is no explicit reset cue or saved state marker.
   - It behaves like a session-local mode, which is fine, but the UI does not say so.

3. Motion DJ mode in [src/App.tsx](/Users/live/Documents/Codex/2026-05-08/implemment-the-following-soundtrap-bandlab-premium/src/App.tsx)
   - Permission and telemetry work.
   - There is no explicit unsupported-browser state beyond “Motion Blocked”, which conflates denial with lack of platform support.

## Controls Missing For The Existing Workflow

- New project / start fresh
- Clear local autosave
- Drag-drop import affordance
- Paste / clipboard import
- Copy project JSON
- Copy project share URL
