import {
  Download,
  GitBranch,
  HeartHandshake,
  Mic2,
  Music,
  Pause,
  Play,
  Radio,
  Save,
  Shuffle,
  Square,
  Timer,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./App.css";
import { AudioEngine } from "./features/audio/audioEngine";
import {
  CollaborationSession,
  type PeerPresence,
} from "./features/collaboration/collaborationSession";
import {
  STEP_COUNT,
  clearPattern,
  createDefaultProject,
  createShareRoomName,
  randomizePattern,
  randomizeSounds,
  setProjectBpm,
  setProjectTitle,
  toggleStep,
  type StudioProject,
} from "./features/studio/project";
import {
  exportProject,
  importProject,
  loadCurrentProject,
  saveCurrentProject,
} from "./features/storage/projectStorage";
import { appMeta } from "./lib/meta";
import { useAccelerometer } from "./hooks/useAccelerometer";
import { Visualizer } from "./components/studio/Visualizer";
import { Mixer } from "./components/studio/Mixer";
import { FxPanel } from "./components/studio/FxPanel";

type ToastState = {
  tone: "neutral" | "success" | "warning";
  message: string;
};

const steps = Array.from({ length: STEP_COUNT }, (_, index) => index);

function App() {
  const [project, setProject] = useState<StudioProject>(() =>
    createDefaultProject(),
  );
  const [hydrated, setHydrated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [roomName, setRoomName] = useState(() => getInitialRoomName());
  const [peers, setPeers] = useState<PeerPresence[]>([]);
  const [toast, setToast] = useState<ToastState>(() =>
    getInitialToast(roomName),
  );
  const [isRecording, setIsRecording] = useState(false);
  const [activePad, setActivePad] = useState<string | null>(null);
  const audioEngine = useMemo(() => new AudioEngine(), []);
  const collabRef = useRef<CollaborationSession | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const applyingRemoteRef = useRef(false);

  const { data: accelData, permissionGranted: accelPermission, triggerPermission: requestAccel } = useAccelerometer();

  // Keyboard map: number keys 1-5 trigger tracks, Shift+R = record, space = play/stop
  // Deliberately no overlap between pad keys and shortcuts
  const PAD_KEYS: Record<string, number> = {
    "z": 0, "x": 1, "c": 2, "v": 3, "b": 4,
  };

  const shareUrl = useMemo(() => {
    if (!roomName.trim()) {
      return "";
    }

    const url = new URL(window.location.href);
    url.searchParams.set("room", roomName.trim());
    return url.toString();
  }, [roomName]);

  const hasSolo = project.tracks.some((track) => track.solo);


  useEffect(() => {
    loadCurrentProject()
      .then((savedProject) => {
        if (savedProject) {
          setProject(savedProject);
          setToast({
            tone: "success",
            message: "Restored your latest local project.",
          });
        }
      })
      .catch(() => {
        setToast({
          tone: "warning",
          message: "Local project storage is unavailable in this browser.",
        });
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    audioEngine.update(project);

    if (collabRef.current && !applyingRemoteRef.current) {
      collabRef.current.publish(project);
    }

    if (!hydrated) {
      return;
    }

    const saveTimer = window.setTimeout(() => {
      saveCurrentProject(project).catch(() => {
        setToast({
          tone: "warning",
          message: "Could not save the project locally.",
        });
      });
    }, 300);

    return () => window.clearTimeout(saveTimer);
  }, [audioEngine, hydrated, project]);

  useEffect(() => {
    if (accelData.beta !== null) {
      // Map tilt (-90 to 90) to frequency (200 to 15000)
      const freq = Math.max(200, Math.min(15000, ((accelData.beta + 90) / 180) * 15000));
      audioEngine.setFilterFrequency(freq);
    }
  }, [accelData, audioEngine]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger pads when typing in an input/select
      if ((e.target as HTMLElement).tagName === "INPUT" ||
          (e.target as HTMLElement).tagName === "SELECT" ||
          (e.target as HTMLElement).tagName === "TEXTAREA") return;

      const trackIndex = PAD_KEYS[e.key.toLowerCase()];
      if (trackIndex !== undefined && project.tracks[trackIndex]) {
        void handleLiveTrigger(project.tracks[trackIndex].id);
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        isPlaying ? handleStop() : void handlePlay();
        return;
      }

      if (e.key.toLowerCase() === "r" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setIsRecording((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.tracks, isPlaying, activeStep, isRecording]);

  useEffect(() => {
    return () => {
      collabRef.current?.disconnect();
      audioEngine.dispose();
    };
  }, [audioEngine]);

  const tapTimes = useRef<number[]>([]);

  function handleTapTempo() {
    const now = Date.now();
    tapTimes.current = [...tapTimes.current, now].slice(-4);
    if (tapTimes.current.length >= 2) {
      const diffs = [];
      for (let i = 1; i < tapTimes.current.length; i++) {
        diffs.push(tapTimes.current[i] - tapTimes.current[i - 1]);
      }
      const avg = diffs.reduce((a, b) => a + b) / diffs.length;
      const bpm = Math.round(60000 / avg);
      if (bpm >= 60 && bpm <= 180) {
        setProject(current => setProjectBpm(current, bpm));
      }
    }
  }

  async function handlePlay() {
    try {
      await audioEngine.play(project, setActiveStep);
      setIsPlaying(true);
      setToast({
        tone: "success",
        message: "Transport running. Browser audio is warmed up.",
      });
    } catch {
      setToast({
        tone: "warning",
        message:
          "Audio could not start. Check browser audio permissions and try again.",
      });
    }
  }

  function handleStop() {
    audioEngine.stop();
    setIsPlaying(false);
    setIsRecording(false);
    setActiveStep(null);
    setToast({
      tone: "neutral",
      message: "Transport stopped.",
    });
  }

  function handleStepToggle(trackId: string, stepIndex: number) {
    setProject((current) => toggleStep(current, trackId, stepIndex));
  }

  async function handleLiveTrigger(trackId: string) {
    await audioEngine.triggerLive(trackId);
    setActivePad(trackId);
    setTimeout(() => setActivePad(null), 120);

    if (isRecording && isPlaying && activeStep !== null) {
      handleStepToggle(trackId, activeStep);
    }
  }

  function handleExport() {
    const blob = new Blob([exportProject(project)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "meshtrack-project"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({
      tone: "success",
      message: "Project export prepared.",
    });
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const importedProject = importProject(await file.text());
      setProject(importedProject);
      setToast({
        tone: "success",
        message: "Imported project loaded.",
      });
    } catch {
      setToast({
        tone: "warning",
        message: "That file is not a valid Meshtrack Studio project.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleManualSave() {
    await saveCurrentProject(project);
    setToast({
      tone: "success",
      message: "Saved to IndexedDB on this device.",
    });
  }

  async function handleJoinRoom() {
    const nextRoom = roomName.trim() || createShareRoomName(project);
    setRoomName(nextRoom);
    collabRef.current?.disconnect();

    try {
      collabRef.current = await CollaborationSession.connect(
        nextRoom,
        project,
        {
          onProject(nextProject) {
            applyingRemoteRef.current = true;
            setProject(nextProject);
            window.setTimeout(() => {
              applyingRemoteRef.current = false;
            }, 0);
            setToast({
              tone: "success",
              message: "Received a peer update.",
            });
          },
          onPeers(nextPeers) {
            setPeers(nextPeers);
          },
          onStatus(status, message) {
            setToast({
              tone: status === "error" ? "warning" : "neutral",
              message,
            });
          },
        },
      );

      const url = new URL(window.location.href);
      url.searchParams.set("room", nextRoom);
      window.history.replaceState(null, "", url);
      setIsCollaborating(true);
    } catch {
      setToast({
        tone: "warning",
        message:
          "Could not open the WebRTC room. Try a different network or room name.",
      });
    }
  }

  function handleLeaveRoom() {
    collabRef.current?.disconnect();
    collabRef.current = null;
    setIsCollaborating(false);
    setPeers([]);
  }

  async function handleCopyShareUrl() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast({
        tone: "success",
        message: "Room link copied.",
      });
    } catch {
      setToast({
        tone: "warning",
        message: "Copy failed. Select the room link manually.",
      });
    }
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first browser DAW</p>
          <h1>Meshtrack Studio</h1>
          <p className="subtitle">
            Tone.js synth tracks, IndexedDB saves, and Yjs/WebRTC rooms with no
            runtime backend.
          </p>
        </div>
        <nav className="topbar-actions" aria-label="Project links">
          <a
            className="icon-link"
            href={appMeta.repositoryUrl}
            target="_blank"
            rel="noreferrer"
          >
            <GitBranch aria-hidden="true" size={18} />
            Star on GitHub
          </a>
          <a
            className="icon-link support"
            href={appMeta.paypalUrl}
            target="_blank"
            rel="noreferrer"
          >
            <HeartHandshake aria-hidden="true" size={18} />
            Support via PayPal
          </a>
          <p className="version-chip">
            v{appMeta.version} / {appMeta.commit}
          </p>
        </nav>
      </header>

      <section className={`toast toast-${toast.tone}`} aria-live="polite">
        <Radio aria-hidden="true" size={18} />
        <span>{toast.message}</span>
      </section>

      <section className="transport" aria-label="Transport controls">
        <label className="project-title">
          <span>Project</span>
          <input
            value={project.title}
            onChange={(event) =>
              setProject((current) =>
                setProjectTitle(current, event.target.value),
              )
            }
          />
        </label>

        <div className="transport-buttons">
          <button
            className="primary"
            type="button"
            onClick={isPlaying ? handleStop : handlePlay}
          >
            {isPlaying ? (
              <Pause aria-hidden="true" size={18} />
            ) : (
              <Play aria-hidden="true" size={18} />
            )}
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button type="button" onClick={handleStop}>
            <Square aria-hidden="true" size={18} />
            Stop
          </button>
          <button
            type="button"
            onClick={() => setProject((current) => randomizePattern(current))}
          >
            <Shuffle aria-hidden="true" size={18} />
            Randomize Pattern
          </button>
          <button
            type="button"
            onClick={() => setProject((current) => randomizeSounds(current))}
          >
            <Music aria-hidden="true" size={18} />
            Randomize Sounds
          </button>
          <button
            type="button"
            className={isRecording ? "primary" : ""}
            onClick={() => setIsRecording(!isRecording)}
            title="Shortcut: R"
          >
            <Mic2 aria-hidden="true" size={18} />
            {isRecording ? "Recording..." : "Record"}
          </button>
          <button
            type="button"
            onClick={handleTapTempo}
            title="Tap along to set BPM"
          >
            <Timer aria-hidden="true" size={18} />
            Tap
          </button>
          <button
            type="button"
            onClick={() => setProject((current) => clearPattern(current))}
          >
            <Trash2 aria-hidden="true" size={18} />
            Clear
          </button>
        </div>

        <label className="tempo-control">
          <span>{project.bpm} BPM</span>
          <input
            aria-label="Tempo"
            type="range"
            min="60"
            max="180"
            value={project.bpm}
            onChange={(event) =>
              setProject((current) =>
                setProjectBpm(current, Number(event.target.value)),
              )
            }
          />
        </label>
      </section>

      <section className="workspace-grid">
        <div className="sequencer-panel" aria-label="Step sequencer">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Sequencer</p>
              <h2>16-step sketchpad</h2>
            </div>
            <div className="step-count" aria-label={`${STEP_COUNT} steps`}>
              {steps.map((step) => (
                <span
                  key={step}
                  className={activeStep === step ? "is-current" : ""}
                >
                  {step + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="track-list">
              {project.tracks.map((track) => {
                const isMuted = track.muted || (hasSolo && !track.solo);
                return (
                  <div 
                    className={`track-row ${isMuted ? "is-muted" : ""} ${track.solo ? "is-soloed" : ""}`} 
                    key={track.id}
                  >
                    <div className="track-meta">
                      <span
                        className="track-color"
                        style={{ backgroundColor: track.color }}
                      />
                      <div>
                        <div className="track-name-row">
                          <strong>{track.name}</strong>
                          {track.solo && <span className="badge solo-badge">SOLO</span>}
                          {track.muted && <span className="badge mute-badge">MUTE</span>}
                          {!track.solo && !track.muted && isMuted && <span className="badge mute-badge">SILENCED</span>}
                        </div>
                        <span>
                          {track.instrument} / {track.note}
                        </span>
                      </div>
                    </div>
                    <div
                      className="step-grid"
                      role="grid"
                      aria-label={`${track.name} pattern`}
                    >
                      {track.pattern.map((isActive, stepIndex) => (
                        <button
                          aria-label={`${track.name} step ${stepIndex + 1} ${isActive ? "on" : "off"}`}
                          className={[
                            "step-cell",
                            isActive ? "is-on" : "",
                            activeStep === stepIndex ? "is-current" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={`${track.id}-${stepIndex}`}
                          onClick={() => handleStepToggle(track.id, stepIndex)}
                          style={{ "--track-color": track.color } as CSSProperties}
                          type="button"
                        >
                          <span />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="performance-zone">
            <p className="eyebrow">Performance Mode</p>
            <div className="live-pads">
              {project.tracks.map((track, i) => (
                <button
                  key={`pad-${track.id}`}
                  className={`pad ${activePad === track.id ? "is-active" : ""}`}
                  onClick={() => handleLiveTrigger(track.id)}
                  style={{ "--track-color": track.color } as CSSProperties}
                >
                  <span className="key-hint">{["Z","X","C","V","B"][i] ?? ""}</span>
                  <strong>{track.name}</strong>
                </button>
              ))}
            </div>
            
            <div className="accelerometer-status">
              {accelPermission === null ? (
                <button onClick={requestAccel} className="mini-btn">Enable Motion Control</button>
              ) : accelPermission ? (
                <span>Motion Active (Tilt for Filter)</span>
              ) : (
                <span>Motion Blocked</span>
              )}
            </div>

            <Visualizer 
              getAnalyserData={() => audioEngine.getAnalyserData()} 
              isActive={isPlaying} 
            />
          </div>
        </div>

        <aside className="side-panels">
          <Mixer project={project} setProject={setProject} />
          <FxPanel
            project={project}
            setProject={setProject}
            audioEngine={audioEngine}
          />

          <section className="panel collab-panel" aria-label="Collaboration">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">WebRTC mesh</p>
                <h2>Collaboration room</h2>
              </div>
              {isCollaborating ? (
                <Wifi aria-hidden="true" size={22} />
              ) : (
                <WifiOff aria-hidden="true" size={22} />
              )}
            </div>
            <label>
              <span>Room name</span>
              <input
                value={roomName}
                placeholder="meshtrack-room"
                onChange={(event) => setRoomName(event.target.value)}
              />
            </label>
            <div className="button-row">
              <button type="button" onClick={handleJoinRoom}>
                Join
              </button>
              <button type="button" onClick={handleLeaveRoom}>
                Leave
              </button>
            </div>
            <button
              className="wide"
              type="button"
              onClick={() => setRoomName(createShareRoomName(project))}
            >
              Create room name
            </button>
            {shareUrl ? (
              <button
                className="share-url"
                type="button"
                onClick={handleCopyShareUrl}
              >
                {shareUrl}
              </button>
            ) : null}
            <p className="peer-count">
              {peers.length === 0
                ? "No remote peers connected."
                : `${peers.length} peer${peers.length > 1 ? "s" : ""}: ${peers.map((peer) => peer.name).join(", ")}`}
            </p>
          </section>

          <section
            className="panel storage-panel"
            aria-label="Local project storage"
          >
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Local state</p>
                <h2>Save, import, export</h2>
              </div>
              <Save aria-hidden="true" size={22} />
            </div>
            <p className="storage-meta">
              Updated {formatDate(project.updatedAt)}. Autosaves stay in this
              browser.
            </p>
            <div className="button-row">
              <button type="button" onClick={handleManualSave}>
                <Save aria-hidden="true" size={16} />
                Save
              </button>
              <button type="button" onClick={handleExport}>
                <Download aria-hidden="true" size={16} />
                Export
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload aria-hidden="true" size={16} />
                Import
              </button>
            </div>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="application/json"
              onChange={(event) => void handleImport(event.target.files?.[0])}
            />
          </section>
        </aside>
      </section>
    </main>
  );
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

function getInitialRoomName(): string {
  return new URLSearchParams(window.location.search).get("room") ?? "";
}

function getInitialToast(roomName: string): ToastState {
  if (roomName) {
    return {
      tone: "neutral",
      message: `Room "${roomName}" is ready to join.`,
    };
  }

  return {
    tone: "neutral",
    message: "Ready. Start audio, sketch a loop, or open a collaboration room.",
  };
}

export default App;
