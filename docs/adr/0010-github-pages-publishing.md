# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live site must work from day one and be served by GitHub Pages.

## Decision

Publish from the `main` branch `/docs` directory.

Vite uses `base: "/meshtrack-studio/"` and writes production assets to `docs/`. `npm run build:pages` copies `docs/index.html` to `docs/404.html` for SPA fallback behavior. The `docs/` directory is intentionally committed and is not gitignored.

Live URL: https://baditaflorin.github.io/meshtrack-studio/

Repository URL: https://github.com/baditaflorin/meshtrack-studio

## Consequences

- A normal push to `main` can update Pages without GitHub Actions.
- Built assets are visible in git history.
- Cache busting uses Vite hashed filenames.

## Alternatives Considered

- `gh-pages` branch: rejected because it adds a branch management step.
- GitHub Actions Pages deployment: rejected because the project explicitly avoids GitHub Actions.
