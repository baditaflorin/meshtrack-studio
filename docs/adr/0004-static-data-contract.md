# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no generated data pipeline or runtime API. The app still needs stable seed content for demo tracks and local project serialization.

## Decision

Use in-repo TypeScript constants for default project templates and a versioned JSON shape for IndexedDB export/import. The schema is validated with Zod in the browser.

The v1 project schema is `meshtrack.project.v1` and contains:

- project metadata: id, title, bpm, updatedAt
- tracks: id, name, color, synth, volume, muted, solo, pattern steps
- collaboration metadata: optional room name

## Consequences

- No static `docs/data` artifacts are required.
- Exported projects can be validated before import.
- Breaking serialization changes require a new schema id.

## Alternatives Considered

- REST API contract: rejected because Mode C is not used.
- Static JSON fixtures: rejected because seed content is small and tightly coupled to the TypeScript model.
