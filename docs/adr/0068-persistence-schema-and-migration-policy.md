# 0068 Persistence Schema And Migration Policy

- Status: accepted

## Context

The merged app introduced session-only FX state that users would reasonably expect to survive save, export, import, and reload.

## Decision

Extend the canonical project model to include master FX settings. Older projects remain importable by filling missing FX values with deterministic defaults during normalization.

## Consequences

- Exported projects carry the sound-shaping settings users actually hear.
- Import normalization grows slightly, but persistence coherence improves.

## Alternatives Considered

- Keep FX state inside `AudioEngine`: rejected because it breaks the expectation that saved projects reload the same way.
