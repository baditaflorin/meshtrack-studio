# 0001 - Deployment Mode

## Status

Accepted

## Context

Meshtrack Studio needs browser audio synthesis, local project persistence, and real-time peer collaboration. The default delivery target is GitHub Pages, and a backend must only exist if browser APIs cannot support the v1 requirements.

## Decision

Use Mode A: Pure GitHub Pages.

The app is a static Vite build served from `https://baditaflorin.github.io/meshtrack-studio/`. Audio runs through Tone.js and Web Audio in the browser. Collaboration uses Yjs plus WebRTC through `y-webrtc`; discovery uses public signaling endpoints supplied by that library instead of a project-owned sync server. Projects persist to IndexedDB.

## Consequences

- No runtime backend, database, Docker image, nginx, or server deployment is required for v1.
- The public surface is static assets only.
- Real-time collaboration depends on browser WebRTC support and public signaling availability.
- Cross-device cloud sync, auth, and account-based storage are intentionally out of scope.

## Alternatives Considered

- Mode B with pre-built data artifacts: rejected because v1 has no canonical server-side dataset.
- Mode C with a runtime sync backend: rejected because WebRTC mesh plus Yjs satisfies v1 collaboration without owning infrastructure.
