# 0016 - Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions, so checks must be easy to run locally and through git hooks.

## Decision

Use a plain `.githooks/` directory wired by `make install-hooks`. Hooks cover formatting checks, linting, type checks, gitleaks secret scanning, Conventional Commit validation, build, tests, and smoke checks.

## Consequences

- Contributors can inspect and run hooks without an extra hook framework.
- The repository does not depend on CI to enforce basics.
- Contributors need local tools such as `gitleaks` installed for the full hook suite.

## Alternatives Considered

- Lefthook: rejected because plain shell scripts are sufficient for v1.
- GitHub Actions: rejected by project constraints.
