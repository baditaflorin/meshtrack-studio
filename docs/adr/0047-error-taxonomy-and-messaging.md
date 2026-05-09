# 0047 - Error Taxonomy and Messaging

## Status

Accepted

## Context

Different import failures need different recovery paths.

## Decision

Use explicit import issue and failure codes such as:

- `empty-input`
- `invalid-json-syntax`
- `missing-tracks`
- `invalid-project-shape`

Every user-facing failure includes:

- what failed
- why it failed
- what to do next

## Consequences

- UI copy is stable and testable.
- Debug output stays machine-friendly while user copy stays domain-friendly.

## Alternatives Considered

- Single generic import error: rejected because it blocks recovery.
