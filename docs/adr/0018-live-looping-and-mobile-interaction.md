# ADR-0018: Live Looping and Mobile Interaction

## Status
Proposed

## Context
Meshtrack Studio is currently a static 16-step sequencer. To increase user engagement and support live performance workflows, it needs to transition into a "Live Looper" that accepts real-time input and leverages mobile sensors.

## Decision
We will implement the following:
1.  **Live Recording Mode**: A state where manual triggers (keyboard/UI pads) are persisted into the current step of the active loop.
2.  **Accelerometer Control**: Mapping mobile device orientation to audio parameters (Filter, Pitch, or Effects) to provide an expressive interface.
3.  **Real-time Visual Feedback**: An oscilloscope/analyser to visualize the audio output.
4.  **Modular UI Components**: Refactoring the monolithic `App.tsx` into specialized components to support more complex features.

## Consequences
- **Complexity**: The audio engine will need to handle both scheduled transport events and ad-hoc user triggers.
- **Performance**: Mobile sensor listeners and canvas rendering must be optimized to avoid UI jank.
- **UX**: The interface must remain clean despite adding more controls (Recording, Panning, Effects).
- **Permissions**: Using accelerometer data on mobile may require user permission (especially on iOS).
