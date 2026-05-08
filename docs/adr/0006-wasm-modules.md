# 0006 - WASM Modules

## Status

Accepted

## Context

The prompt allows WASM where needed, but GitHub Pages cannot set COOP/COEP headers. Audio synthesis and collaboration do not require WASM in v1.

## Decision

Use no WASM modules in v1. Tone.js and browser Web Audio provide the needed synthesis and scheduling in JavaScript.

## Consequences

- No COOP/COEP workaround is required.
- The app remains compatible with ordinary GitHub Pages hosting.
- Advanced audio processing can revisit AudioWorklets or WASM in a later ADR.

## Alternatives Considered

- DuckDB-WASM or sql.js: rejected because v1 has no queryable dataset.
- Custom DSP WASM: rejected because Tone.js covers the v1 synth library needs.
