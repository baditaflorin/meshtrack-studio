# 0009 - Configuration and Secrets Management

## Status

Accepted

## Context

The frontend must never contain secrets. Mode A should avoid secret-bearing runtime flows entirely.

## Decision

Use build-time public Vite variables only. `.env.example` documents placeholders, and `.env*` files are ignored except `.env.example`.

The app has no API keys, tokens, passwords, or private keys in v1.

## Consequences

- The same static build can be inspected publicly without revealing credentials.
- Gitleaks runs in local hooks to reduce accidental secret commits.
- Any future secret-dependent feature must use offline generation or a new backend ADR.

## Alternatives Considered

- Encrypted frontend secrets: rejected because frontend secrets are still recoverable.
- Runtime server secrets: rejected by ADR 0001.
