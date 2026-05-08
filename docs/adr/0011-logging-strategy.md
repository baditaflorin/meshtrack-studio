# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Production browser console output should be minimal and never include project contents.

## Decision

Use browser console logging only for unexpected developer diagnostics. User-facing failures appear as inline status messages or toasts. Production code should avoid routine `console.log` calls.

## Consequences

- Users see actionable errors in the interface.
- Private project data is not emitted to logs.
- Debugging remote collaboration issues may require explicit user reproduction steps.

## Alternatives Considered

- Remote logging service: rejected to avoid analytics and PII handling in v1.
