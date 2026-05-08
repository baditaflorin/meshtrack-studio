# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deployment is GitHub Pages only.

## Decision

Serve static files from GitHub Pages at `https://baditaflorin.github.io/meshtrack-studio/`. There is no backend host, Docker Compose deployment, nginx proxy, Prometheus service, or runtime database.

## Consequences

- Deployment is a git push containing updated `docs/` output.
- Rollback is a git revert of the publishing commit.
- WebRTC signaling uses external public signaling servers provided to `y-webrtc`.

## Alternatives Considered

- Docker backend topology: rejected by ADR 0001.
- Custom domain: deferred until a domain is explicitly in scope.
