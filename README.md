# Meshtrack Studio

![Live on GitHub Pages](https://img.shields.io/badge/live-GitHub%20Pages-48dbb5)
![Mode A](https://img.shields.io/badge/deployment-Mode%20A%20static-ffd166)
![License MIT](https://img.shields.io/badge/license-MIT-f25f5c)

Live site: https://baditaflorin.github.io/meshtrack-studio/

Repository: https://github.com/baditaflorin/meshtrack-studio

Support: https://www.paypal.com/paypalme/florinbadita

Meshtrack Studio is a local-first browser DAW for quick collaborative sketches: Tone.js handles synth playback, IndexedDB keeps projects on-device, and Yjs plus WebRTC syncs edits between peers without a project-owned runtime backend.

![Meshtrack Studio screenshot](docs/screenshot.png)

## Quickstart

```bash
git clone https://github.com/baditaflorin/meshtrack-studio.git
cd meshtrack-studio
npm install
make install-hooks
make dev
```

## What Works

- Four-track 16-step sequencer with synth, bass, pad, and drum voices.
- Transport, tempo, randomize, clear, mute, solo, and per-track volume controls.
- Local autosave, manual save, JSON export, and JSON import through IndexedDB.
- WebRTC collaboration rooms using Yjs shared state.
- GitHub Pages production build from `main` plus `/docs`.
- PWA manifest and best-effort offline service worker.
- Visible version and commit on the live page.

## Architecture

```mermaid
C4Context
  title Meshtrack Studio context
  Person(producer, "Producer", "Creates browser-based music sketches")
  Person(collaborator, "Collaborator", "Joins a room from a shared link")
  System_Boundary(pages, "GitHub Pages: https://baditaflorin.github.io/meshtrack-studio/") {
    System(app, "Meshtrack Studio", "Static React app")
  }
  System_Ext(signaling, "Public y-webrtc signaling", "Peer discovery only")
  Rel(producer, app, "Creates and edits projects", "Browser")
  Rel(collaborator, app, "Joins room and edits shared project", "Browser")
  Rel(app, signaling, "Discovers peers", "WebSocket")
  Rel(producer, collaborator, "Syncs CRDT updates", "WebRTC mesh")
```

More detail: docs/architecture.md

ADRs: docs/adr/

Deploy guide: docs/deploy.md

Privacy notes: docs/privacy.md

Postmortem: docs/postmortem.md

## Commands

```bash
make help
make lint
make test
make build
make smoke
make pages-preview
```

## Release

Version is managed in `package.json`. A release tag such as `v0.1.0` marks the static Pages version; no Docker image is produced because ADR 0001 chooses Mode A.
