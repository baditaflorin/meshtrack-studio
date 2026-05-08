import { Mic2, Music } from "lucide-react";
import { type StudioProject, setTrackVolume, setTrackMuted, setTrackSolo, setTrackSound, SOUND_LIBRARY } from "../../features/studio/project";

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
          
          <div className="mixer-sound-selector">
             <Music size={14} />
             <select 
               aria-label={`${track.name} sound`}
               value={track.sound} 
               onChange={(e) => setProject(curr => setTrackSound(curr, track.id, e.target.value))}
             >
               {SOUND_LIBRARY[track.instrument].map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>

          <label>
            <span>{track.volume} dB</span>
            <input
              aria-label={`${track.name} volume`}
              type="range"
              min="-48"
              max="6"
              value={track.volume}
              onChange={(event) =>
                setProject((current) =>
                  setTrackVolume(
                    current,
                    track.id,
                    Number(event.target.value),
                  ),
                )
              }
            />
          </label>
          <div className="toggle-pair">
            <button
              className={track.muted ? "is-active" : ""}
              type="button"
              onClick={() =>
                setProject((current) =>
                  setTrackMuted(current, track.id, !track.muted),
                )
              }
            >
              Mute
            </button>
            <button
              className={track.solo ? "is-active" : ""}
              type="button"
              onClick={() =>
                setProject((current) =>
                  setTrackSolo(current, track.id, !track.solo),
                )
              }
            >
              Solo
            </button>
          </div>
          {hasSolo && !track.solo ? (
            <p className="dimmed-note">Held by solo</p>
          ) : null}
        </div>
      ))}
    </section>
  );
}
