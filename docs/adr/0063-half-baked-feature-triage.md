# 0063 Half-Baked Feature Triage

- Status: accepted

## Context

Several visible controls looked complete but were not:

- master FX values were session-only
- import was robust but hidden behind one input path
- state reset was implicit instead of explicit

## Decision

- Finish master FX persistence.
- Finish project I/O affordances.
- Finish reset and clear-local-state flows.
- Keep collaboration-room sharing, but label it separately from project sharing.

Nothing in this set is deleted; each item is finished instead.

## Consequences

- The app surface becomes denser, but every added control has a complete handler.

## Alternatives Considered

- Hide FX controls until they persist: rejected because the controls are already useful and worth finishing.
