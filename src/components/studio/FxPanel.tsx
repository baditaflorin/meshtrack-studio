import { Sliders } from "lucide-react";
import {
  scaleKeyOptions,
  scaleModeOptions,
  type ScaleKey,
  type ScaleMode,
  type StudioProject,
  setQuantizeEnabled,
  setScaleMode,
  setScaleRoot,
} from "../../features/studio/project";
import type { AudioEngine } from "../../features/audio/audioEngine";

type FxPanelProps = {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
  audioEngine: AudioEngine;
};

const FILTER_TYPES: BiquadFilterType[] = ["lowpass", "highpass", "bandpass", "notch", "allpass"];

export function FxPanel({ project, setProject, audioEngine }: FxPanelProps) {
  return (
    <section className="panel fx-panel" aria-label="Effects">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Master FX</p>
          <h2>Effects &amp; Scale</h2>
        </div>
        <Sliders aria-hidden="true" size={22} />
      </div>

      <div className="fx-body">
        {/* Reverb */}
        <label className="fx-row">
          <span className="fx-label">Reverb</span>
          <input
            type="range" min="0" max="1" step="0.01"
            defaultValue="0.15"
            aria-label="Reverb wet"
            onChange={(e) => audioEngine.setReverb(Number(e.target.value))}
          />
        </label>

        {/* Delay */}
        <label className="fx-row">
          <span className="fx-label">Delay</span>
          <input
            type="range" min="0" max="0.9" step="0.01"
            defaultValue="0.1"
            aria-label="Delay wet"
            onChange={(e) => audioEngine.setDelay(Number(e.target.value))}
          />
        </label>

        {/* Filter cutoff */}
        <label className="fx-row">
          <span className="fx-label">Filter</span>
          <input
            type="range" min="100" max="20000" step="50"
            defaultValue="20000"
            aria-label="Filter cutoff frequency"
            onChange={(e) => audioEngine.setFilterFrequency(Number(e.target.value))}
          />
        </label>

        {/* Filter type */}
        <div className="fx-row fx-row-select">
          <span className="fx-label">Type</span>
          <select
            aria-label="Filter type"
            defaultValue="lowpass"
            onChange={(e) => audioEngine.setFilterType(e.target.value as BiquadFilterType)}
          >
            {FILTER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="fx-divider" />

        {/* Auto-Key / Scale Quantizer */}
        <div className="fx-row fx-row-toggle">
          <span className="fx-label">Auto-Key</span>
          <button
            type="button"
            className={`toggle-btn ${project.quantizeEnabled ? "is-active" : ""}`}
            aria-pressed={project.quantizeEnabled}
            onClick={() =>
              setProject((p) => setQuantizeEnabled(p, !p.quantizeEnabled))
            }
          >
            {project.quantizeEnabled ? "ON" : "OFF"}
          </button>
        </div>

        {project.quantizeEnabled && (
          <>
            <div className="fx-row fx-row-select">
              <span className="fx-label">Root</span>
              <select
                aria-label="Scale root key"
                value={project.scaleRoot}
                onChange={(e) =>
                  setProject((p) => setScaleRoot(p, e.target.value as ScaleKey))
                }
              >
                {scaleKeyOptions.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="fx-row fx-row-select">
              <span className="fx-label">Scale</span>
              <select
                aria-label="Scale mode"
                value={project.scaleMode}
                onChange={(e) =>
                  setProject((p) => setScaleMode(p, e.target.value as ScaleMode))
                }
              >
                {scaleModeOptions.map((m) => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>

            <p className="fx-hint">
              All notes snap to {project.scaleRoot} {project.scaleMode}.
              Patterns always sound musical!
            </p>
          </>
        )}
      </div>
    </section>
  );
}
