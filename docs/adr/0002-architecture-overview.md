# 0002 - Architecture Overview and Module Boundaries

## Status

Accepted

## Context

The app must keep audio scheduling, project state, persistence, and collaboration understandable as the UI grows.

## Decision

Use feature-oriented frontend modules:

- `features/studio` owns project state, sequencer editing, mixer controls, and validation.
- `features/audio` owns Tone.js lazy loading and Web Audio playback.
- `features/collaboration` owns Yjs documents, WebRTC providers, and remote presence.
- `features/storage` owns IndexedDB persistence.
- `components` owns shared UI primitives.

## Consequences

- Audio and collaboration dependencies can be lazy-loaded behind user actions.
- Tests can cover pure state logic without initializing Web Audio.
- The app remains static because all modules execute in the browser.

## Alternatives Considered

- One large app state file: rejected because audio, storage, and collaboration would be tightly coupled.
- Backend-backed project model: rejected by ADR 0001.
