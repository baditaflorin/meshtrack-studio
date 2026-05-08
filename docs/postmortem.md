# Postmortem

## What Was Built

Meshtrack Studio v0.1.0 is a static browser DAW published on GitHub Pages. It includes a 16-step sequencer, Tone.js playback, track mixer controls, local IndexedDB persistence, JSON import/export, WebRTC/Yjs collaboration rooms, a PWA manifest, local hooks, tests, ADRs, and Pages deployment docs.

Live site: https://baditaflorin.github.io/meshtrack-studio/

Repository: https://github.com/baditaflorin/meshtrack-studio

## Was Mode A Correct?

Yes. Mode A was the right choice for v1. Browser APIs covered audio, storage, and peer collaboration. A runtime backend would mainly add account/cloud sync semantics that were explicitly non-goals.

The main compromise is signaling. WebRTC peers still need public signaling servers for discovery, but Meshtrack Studio does not own or run a sync server.

## What Worked

- Vite produced a Pages-ready build with hashed assets and a stable base path.
- Tone.js, Yjs, and `y-webrtc` could be lazy-loaded so first-load JS stayed under the 200 KB gzip target.
- The static Pages publishing model was simple once the build script preserved human docs under `docs/`.
- Playwright smoke testing caught the actual built artifact path.

## What Did Not Work

- Vite's initial `emptyOutDir` behavior deleted `docs/adr/`, so the build had to be adjusted to clean only generated outputs.
- Playwright generated local run metadata that needed to be explicitly ignored.

## Surprises

- The latest lucide package in this environment does not expose a GitHub brand icon, so the UI uses a generic branch icon for the repository link.
- Zod adds noticeable main-bundle weight, but the app still lands comfortably under the initial JS budget.

## Accepted Tech Debt

- Collaboration is snapshot-based over Yjs rather than deeply modeling every clip and control as shared CRDT substructures.
- The synth library is intentionally basic and does not include sample import, piano roll editing, mastering, or automation lanes.
- The service worker is best-effort and network-first; it is not yet a polished offline release system.

## Next Improvements

1. Model sequencer steps and mixer controls as nested Yjs types for finer-grained merge behavior.
2. Add sample slots, a simple piano roll, and project-level arrangement sections.
3. Add an in-app collaboration diagnostics panel for signaling and peer connection state.

## Time Spent vs Estimate

The initial implementation fit the expected one-session scaffold-and-v1 range. The extra time went into Pages publishing details, hook verification, and smoke testing the generated `docs/` build instead of only the dev server.
