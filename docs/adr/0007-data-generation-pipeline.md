# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

Mode B projects require offline data generation. Meshtrack Studio is Mode A and has no external static dataset.

## Decision

Do not create a data generation pipeline in v1.

## Consequences

- There is no `make data` target in v1.
- The project has no committed data artifacts beyond static app assets.
- If future sample packs or public project templates are generated offline, a Mode B ADR will define artifact paths, schemas, and release cadence.

## Alternatives Considered

- Add a placeholder Go generator: rejected because unused scaffolding would add maintenance noise.
