# 0017 - Dependency Policy

## Status

Accepted

## Context

The app depends on browser audio and collaboration libraries. Custom protocol or audio engines would add unnecessary risk.

## Decision

Use production-ready libraries for core concerns:

- Tone.js for synthesis and scheduling
- Yjs for CRDT shared state
- `y-webrtc` for WebRTC transport
- `idb` for IndexedDB ergonomics
- Zod for runtime validation
- React and Vite for UI and build
- lucide-react for icons

Dependencies must pass `npm audit` without high or critical vulnerabilities before release.

## Consequences

- The project benefits from maintained libraries for hard problems.
- Bundle size must be controlled with dynamic imports.
- New dependencies require a clear reason and should avoid overlapping existing capabilities.

## Alternatives Considered

- Hand-written CRDT or WebRTC mesh: rejected because Yjs and `y-webrtc` are mature enough for v1.
- Hand-written audio scheduler: rejected because Tone.js is a better-tested foundation.
