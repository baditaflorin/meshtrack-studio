# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Audio startup, IndexedDB, and WebRTC can fail because of browser permissions, storage settings, or network conditions.

## Decision

Represent recoverable errors as typed UI statuses. Avoid throwing from event handlers after a failure can be shown to the user. Storage import uses Zod validation and rejects invalid project shapes with a clear message.

## Consequences

- The app remains usable if collaboration fails.
- Users get concrete next steps for browser audio or storage failures.
- Tests can assert failure states without inspecting console output.

## Alternatives Considered

- Global catch-all alerts: rejected because they are disruptive and hard to test.
