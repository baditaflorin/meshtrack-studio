# 0012 - Metrics and Observability

## Status

Accepted

## Context

Mode A has no server-side metrics endpoint. The app handles creative work and should be privacy-preserving by default.

## Decision

Ship with no analytics in v1. Observability is limited to local UI status, local test results, and user-reported issues.

## Consequences

- No PII or behavioral analytics are collected.
- Product usage metrics are unavailable unless users voluntarily report feedback.
- If analytics are added later, they require an ADR and documentation in `docs/privacy.md`.

## Alternatives Considered

- Plausible analytics: rejected for v1 because success can be verified functionally without collecting usage data.
- Custom beacon endpoint: rejected because it would require runtime infrastructure.
