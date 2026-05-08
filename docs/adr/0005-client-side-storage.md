# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

Projects must survive refreshes without auth or server storage.

## Decision

Use IndexedDB through the `idb` library for project snapshots. Store the current project under a stable key and validate loaded data with Zod before applying it.

Use `localStorage` only for small preferences such as last-opened room names.

## Consequences

- Project data remains private to the user's browser.
- Large pattern data fits better than it would in `localStorage`.
- Cross-device sync is not available in v1.

## Alternatives Considered

- OPFS: rejected because IndexedDB is sufficient and simpler for structured snapshots.
- Server persistence: rejected by ADR 0001.
