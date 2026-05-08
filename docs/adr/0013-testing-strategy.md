# 0013 - Testing Strategy

## Status

Accepted

## Context

The app needs confidence in project state mutation, storage validation, rendering, and one browser happy path.

## Decision

Use Vitest for unit tests and React component tests. Use a shell smoke test that builds the Pages artifact, serves it locally with Vite preview, and verifies the static page loads. Use Playwright for at least one happy-path browser test when browser binaries are available.

## Consequences

- Pure state logic remains fast to test.
- Smoke checks catch broken base paths and missing Pages output.
- Web Audio collaboration edge cases still need manual multi-browser verification.

## Alternatives Considered

- Full Cypress suite: rejected because Playwright is lighter for the required happy path.
- No browser smoke test: rejected because Pages base-path regressions are common.
