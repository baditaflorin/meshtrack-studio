# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

The bootstrap prompt defines Go backend layout for Modes B and C. Meshtrack Studio uses Mode A.

## Decision

Do not include a Go backend in v1.

## Consequences

- No `cmd`, `internal`, `pkg`, `api`, or Docker backend scaffolding is created.
- The repository stays focused on the static frontend.
- Backend layout will be introduced only if a future ADR moves the project to Mode B or C.

## Alternatives Considered

- Empty Go module: rejected because it would imply backend support that does not exist.
