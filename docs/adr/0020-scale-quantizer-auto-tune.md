# ADR-0020: Scale Quantizer and Auto-Tune

## Status
Accepted

## Context
Most users don't know music theory. Pressing a pad on the wrong note sounds bad. WASM-based pitch correction (e.g., compiling a Rubber Band or autocorrelation library to WASM) would add significant bundle size and complexity for a feature that can be approximated effectively in pure JavaScript for a step-sequencer context.

## Decision
Implement a **Scale Quantizer** in pure TypeScript:
- Defines a set of common musical scales (Major, Minor, Pentatonic, Blues, Dorian, Mixolydian, Chromatic).
- When the quantizer is enabled, any note assigned to a track is snapped to the nearest note in the selected scale and root key.
- The per-track `note` property is mapped through the quantizer before being passed to Tone.js.
- Users pick a root key (C, D, E, F, G, A, B) and a scale mode from the UI.

## Why not WASM
- A step-sequencer plays pre-programmed notes, not live microphone input, so real-time pitch detection is not required.
- Scale quantization is a deterministic lookup table operation — zero benefit from WASM.
- Future enhancement: if microphone-based auto-tune is added (e.g., for the sample track feature), a WASM pitch-shift library (like `soundtouch-js` compiled to WASM or `pitch-shift` via AudioWorklet) would be appropriate. That is deferred to ADR-0021.

## Consequences
- Users can enable "Auto-Key" mode and their patterns will always sound musical.
- Zero WASM bundle overhead.
- Scales can be extended trivially by adding entries to the lookup table.
