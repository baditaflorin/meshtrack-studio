# Architecture

Live site: https://baditaflorin.github.io/meshtrack-studio/

Repository: https://github.com/baditaflorin/meshtrack-studio

## Context

```mermaid
C4Context
  title Meshtrack Studio context
  Person(producer, "Producer", "Creates local-first music sketches")
  Person(peer, "Peer collaborator", "Joins a WebRTC room")
  System_Boundary(githubPages, "GitHub Pages static boundary") {
    System(meshtrack, "Meshtrack Studio", "React, TypeScript, Tone.js, Yjs")
  }
  System_Ext(signaling, "Public y-webrtc signaling server", "Peer discovery")
  Rel(producer, meshtrack, "Uses", "HTTPS")
  Rel(peer, meshtrack, "Uses", "HTTPS")
  Rel(meshtrack, signaling, "Finds peers", "WSS")
  Rel(producer, peer, "Collaborative project sync", "WebRTC data channel")
```

## Containers

```mermaid
C4Container
  title Meshtrack Studio containers
  Person(user, "User", "Producer or collaborator")
  System_Boundary(pages, "GitHub Pages") {
    Container(app, "Static frontend", "React + Vite", "Main DAW UI, routing, version display")
    Container(sw, "Service worker", "Browser API", "Best-effort offline shell and asset caching")
  }
  ContainerDb(indexeddb, "IndexedDB", "Browser storage", "Current project snapshot")
  System_Ext(signaling, "y-webrtc signaling", "Public WebSocket signaling")
  Container_Ext(peer, "Peer browser", "Meshtrack Studio", "Another user's browser")
  Rel(user, app, "Interacts with")
  Rel(app, indexeddb, "Reads/writes project snapshots")
  Rel(app, sw, "Registers in production")
  Rel(app, signaling, "Discovers peers")
  Rel(app, peer, "Syncs Yjs updates", "WebRTC")
```

## Module Boundaries

- `src/features/studio` contains the versioned project schema and pure state mutations.
- `src/features/audio` lazy-loads Tone.js and owns playback scheduling.
- `src/features/storage` owns IndexedDB load, save, import, and export.
- `src/features/collaboration` lazy-loads Yjs and `y-webrtc`.
- `src/lib` contains app metadata injected at build time.

## GitHub Pages Boundary

The only deployed runtime is static content under `docs/`, served from `main` plus `/docs`. There is no private API, no database, no Docker image, and no nginx host in v1.
