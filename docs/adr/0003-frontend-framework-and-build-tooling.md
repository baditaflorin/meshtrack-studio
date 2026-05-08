# 0003 - Frontend Framework and Build Tooling

## Status

Accepted

## Context

The UI needs a dense sequencer, transport controls, collaboration controls, and accessible interaction states. The build must target GitHub Pages.

## Decision

Use React, TypeScript strict mode, and Vite. Use CSS modules through ordinary imported CSS for predictable payload size and readable responsive styling. Use lucide-react for icons and Vitest for frontend tests.

## Consequences

- Vite provides fast development and hashed production assets.
- React keeps the interactive grid and transport state straightforward.
- The initial bundle must be watched because React plus rich UI can grow quickly; Tone.js, Yjs, and WebRTC stay lazy-loaded.

## Alternatives Considered

- Vanilla TypeScript: rejected because the UI state graph would become harder to maintain.
- Next.js or Remix: rejected because server features are unnecessary for Mode A.
