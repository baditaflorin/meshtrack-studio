# Deploy Guide

Live site: https://baditaflorin.github.io/meshtrack-studio/

Repository: https://github.com/baditaflorin/meshtrack-studio

## Deployment Mode

Mode A: Pure GitHub Pages.

GitHub Pages is configured to serve `main` plus `/docs`. The Vite base path is `/meshtrack-studio/`.

## Publish

```bash
npm install
make install-hooks
make lint
make test
make build
make smoke
git add .
git commit -m "chore: publish pages build"
git push
```

## Rollback

Rollback is a normal git revert of the bad publishing commit:

```bash
git revert <commit_sha>
git push
```

## Custom Domain

No custom domain is configured in v1. If one is added later:

- Add `docs/CNAME`.
- Configure DNS with the provider.
- Keep the Vite base path and service worker scope in sync with the final URL.
- Update ADR 0010.

## Pages Gotchas

- GitHub Pages does not support `_headers` or `_redirects`.
- SPA fallback is handled by copying `docs/index.html` to `docs/404.html`.
- Built assets use hashed filenames for cache busting.
- `docs/adr`, `docs/architecture.md`, `docs/deploy.md`, `docs/privacy.md`, and `docs/postmortem.md` are preserved by `scripts/build-pages.sh`.
