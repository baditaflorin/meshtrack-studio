# 0042 - Inference Engine

## Status

Accepted

## Context

Meshtrack needs to import project-like JSON that is close to valid, not only exact exports.

## Decision

Build a deterministic importer that infers:

- project wrapper shape
- track list field
- instrument label from `instrument`, `type`, or track name
- pattern field from `pattern`, `steps`, `sequence`, `grid`, or `triggers`
- BPM from `bpm` or `tempo`
- notes and colors from sensible defaults when missing

Pattern normalization targets Meshtrack's 16-step grid.

## Consequences

- The app gives a useful first guess on more inputs.
- Inference stays bounded and explainable rather than opaque or ML-driven.
- The importer can evolve while staying deterministic under fixture tests.

## Alternatives Considered

- No inference: rejected because it makes the app feel brittle.
- Free-form "best effort" repairs with hidden logic: rejected because it is hard to trust and debug.
