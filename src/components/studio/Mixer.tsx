import { Mic2, Music } from "lucide-react";
import {
  NOTE_OPTIONS,
  SOUND_LIBRARY,
  type StudioProject,
  setTrackMuted,
  setTrackNote,
  setTrackSolo,
  setTrackSound,
  setTrackVolume,
} from "../../features/studio/project";

type MixerProps = {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
};

export function Mixer({ project, setProject }: MixerProps) {
  const hasSolo = project.tracks.some((track) => track.solo);

  return (
    <section className="panel mixer-panel" aria-label="Mixer">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Mixer</p>
          <h2>Track controls</h2>
        </div>
        <Mic2 aria-hidden="true" size={22} />
      </div>

      {project.tracks.map((track) => (
        <div className="mixer-strip" key={track.id}>
          <div className="mixer-strip-title">
            <span
              className="track-color"
              style={{ backgroundColor: track.color }}
            />
            <strong>{track.name}</strong>
          </div>

          {/* Sound + Note row */}
          <div className="mixer-selectors">
            <div className="mixer-sound-selector" title="Sound preset">
              <Music size={12} aria-hidden="true" />
              <select
                aria-label={`${track.name} sound`}
                value={track.sound}
                onChange={(e) =>
                  setProject((curr) =>
                    setTrackSound(curr, track.id, e.target.value),
                  )
                }
              >
                {SOUND_LIBRARY[track.instrument].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mixer-sound-selector" title="Root note">
              <span style={{ fontSize: "0.7rem", opacity: 0.6 }}>♩</span>
              <select
                aria-label={`${track.name} note`}
                value={track.note}
                onChange={(e) =>
                  setProject((curr) =>
                    setTrackNote(curr, track.id, e.target.value),
                  )
                }
              >
                {NOTE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Volume */}
          <label className="mixer-label">
            <span>{track.volume} dB</span>
            <input
              aria-label={`${track.name} volume`}
              type="range"
              min="-48"
              max="6"
              step="1"
              value={track.volume}
              onChange={(e) =>
                setProject((curr) =>
                  setTrackVolume(curr, track.id, Number(e.target.value)),
                )
              }
            />
          </label>

          {/* Mute / Solo */}
          <div className="toggle-pair">
            <button
              className={track.muted ? "is-active" : ""}
              type="button"
              aria-pressed={track.muted}
              onClick={() =>
                setProject((curr) =>
                  setTrackMuted(curr, track.id, !track.muted),
                )
              }
            >
              Mute
            </button>
            <button
              className={track.solo ? "is-active" : ""}
              type="button"
              aria-pressed={track.solo}
              onClick={() =>
                setProject((curr) => setTrackSolo(curr, track.id, !track.solo))
              }
            >
              Solo
            </button>
          </div>

          {hasSolo && !track.solo && (
            <p className="dimmed-note">Silenced by solo</p>
          )}
        </div>
      ))}
    </section>
  );
}
