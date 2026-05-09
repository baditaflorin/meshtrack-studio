# ADR-0019: Audio Engine Effects Chain

## Status

Accepted

## Context

The previous `audioEngine.ts` had several critical bugs:

- The master filter was only created during `play()`, so accelerometer tilt had no effect before first playback.
- Sound presets set Tone.js synth properties after construction which has no effect for most parameters (oscillator type, envelope values must be passed as constructor options).
- `reconcileVoices` never detected `sound` changes, so selecting a new sound in the mixer was ignored.
- `triggerLive` silently failed if voices hadn't been created yet (before first `play()`).

## Decision

Rewrite `AudioEngine` with the following architecture:

1. **Eager initialization**: Call `ensureTone()` and create the master bus lazily but before it's needed — exposed as `init()`.
2. **Per-voice effects chain**: Each voice routes through its own `PanVol` → master `Reverb` → master `Delay` → master `Filter` → `Analyser` → destination.
3. **Sound preset as constructor options**: Synth parameters (oscillator type, envelope) are passed as constructor arguments, not post-hoc mutations.
4. **Voice invalidation by sound**: `reconcileVoices` tracks the `sound` field and rebuilds voices when it changes.
5. **Scale quantizer**: A `quantizeToScale(note, scale, root)` utility maps any MIDI note to the nearest note in a musical scale — implemented in pure JS with no WASM dependency needed.
6. **Global effect parameters**: `setReverb(wet)`, `setDelay(wet, time)`, `setFilterFrequency(freq)` are all safe to call before and during playback.

## Consequences

- Live triggering works correctly even before the first `play()` call (after `init()`).
- Sound changes in the mixer are immediately reflected in audio.
- Tilt-to-filter control works from the moment permissions are granted.
- The effects chain adds a small but perceptible CPU overhead.
