# 0043 - Domain Vocabulary and UI Language

## Status

Accepted

## Context

Technical parse errors are accurate but not helpful to music-tool users.

## Decision

Use domain language in import messaging:

- "track data" instead of "object schema"
- "16-step grid" instead of "array length mismatch"
- "compatibility repair" instead of "coercion" in user-facing copy

The UI exposes `what`, `why`, and `now what` for each issue.

## Consequences

- Failures are easier to understand and recover from.
- Power users can still inspect precise issue codes in debug output.

## Alternatives Considered

- Raw parser and Zod messages: rejected because they force users to think like the implementation.
