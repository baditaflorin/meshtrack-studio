import {
  Download,
  GitBranch,
  HeartHandshake,
  Mic2,
  Pause,
  Play,
  Radio,
  Save,
  Shuffle,
  Square,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import './App.css'
import { AudioEngine } from './features/audio/audioEngine'
import {
  CollaborationSession,
  type PeerPresence,
} from './features/collaboration/collaborationSession'
import {
  STEP_COUNT,
  clearPattern,
  createDefaultProject,
  createShareRoomName,
  randomizePattern,
  setProjectBpm,
  setProjectTitle,
  setTrackMuted,
  setTrackSolo,
  setTrackVolume,
  toggleStep,
  type StudioProject,
} from './features/studio/project'
import {
  exportProject,
  importProject,
  loadCurrentProject,
  saveCurrentProject,
} from './features/storage/projectStorage'
import { appMeta } from './lib/meta'

type ToastState = {
  tone: 'neutral' | 'success' | 'warning'
  message: string
}

const steps = Array.from({ length: STEP_COUNT }, (_, index) => index)

function App() {
  const [project, setProject] = useState<StudioProject>(() => createDefaultProject())
  const [hydrated, setHydrated] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [roomName, setRoomName] = useState(() => getInitialRoomName())
  const [peers, setPeers] = useState<PeerPresence[]>([])
  const [toast, setToast] = useState<ToastState>(() => getInitialToast(roomName))
  const audioEngine = useMemo(() => new AudioEngine(), [])
  const collabRef = useRef<CollaborationSession | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const applyingRemoteRef = useRef(false)

  const shareUrl = useMemo(() => {
    if (!roomName.trim()) {
      return ''
    }

    const url = new URL(window.location.href)
    url.searchParams.set('room', roomName.trim())
    return url.toString()
  }, [roomName])

  const hasSolo = project.tracks.some((track) => track.solo)

  useEffect(() => {
    loadCurrentProject()
      .then((savedProject) => {
        if (savedProject) {
          setProject(savedProject)
          setToast({
            tone: 'success',
            message: 'Restored your latest local project.',
          })
        }
      })
      .catch(() => {
        setToast({
          tone: 'warning',
          message: 'Local project storage is unavailable in this browser.',
        })
      })
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    audioEngine.update(project)

    if (collabRef.current && !applyingRemoteRef.current) {
      collabRef.current.publish(project)
    }

    if (!hydrated) {
      return
    }

    const saveTimer = window.setTimeout(() => {
      saveCurrentProject(project).catch(() => {
        setToast({
          tone: 'warning',
          message: 'Could not save the project locally.',
        })
      })
    }, 300)

    return () => window.clearTimeout(saveTimer)
  }, [audioEngine, hydrated, project])

  useEffect(() => {
    return () => {
      collabRef.current?.disconnect()
      audioEngine.dispose()
    }
  }, [audioEngine])

  async function handlePlay() {
    try {
      await audioEngine.play(project, setActiveStep)
      setIsPlaying(true)
      setToast({
        tone: 'success',
        message: 'Transport running. Browser audio is warmed up.',
      })
    } catch {
      setToast({
        tone: 'warning',
        message: 'Audio could not start. Check browser audio permissions and try again.',
      })
    }
  }

  function handleStop() {
    audioEngine.stop()
    setIsPlaying(false)
    setActiveStep(null)
    setToast({
      tone: 'neutral',
      message: 'Transport stopped.',
    })
  }

  function handleStepToggle(trackId: string, stepIndex: number) {
    setProject((current) => toggleStep(current, trackId, stepIndex))
  }

  function handleExport() {
    const blob = new Blob([exportProject(project)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'meshtrack-project'}.json`
    link.click()
    URL.revokeObjectURL(url)
    setToast({
      tone: 'success',
      message: 'Project export prepared.',
    })
  }

  async function handleImport(file: File | undefined) {
    if (!file) {
      return
    }

    try {
      const importedProject = importProject(await file.text())
      setProject(importedProject)
      setToast({
        tone: 'success',
        message: 'Imported project loaded.',
      })
    } catch {
      setToast({
        tone: 'warning',
        message: 'That file is not a valid Meshtrack Studio project.',
      })
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleManualSave() {
    await saveCurrentProject(project)
    setToast({
      tone: 'success',
      message: 'Saved to IndexedDB on this device.',
    })
  }

  async function handleJoinRoom() {
    const nextRoom = roomName.trim() || createShareRoomName(project)
    setRoomName(nextRoom)
    collabRef.current?.disconnect()

    try {
      collabRef.current = await CollaborationSession.connect(nextRoom, project, {
        onProject(nextProject) {
          applyingRemoteRef.current = true
          setProject(nextProject)
          window.setTimeout(() => {
            applyingRemoteRef.current = false
          }, 0)
          setToast({
            tone: 'success',
            message: 'Received a peer update.',
          })
        },
        onPeers(nextPeers) {
          setPeers(nextPeers)
        },
        onStatus(status, message) {
          setToast({
            tone: status === 'error' ? 'warning' : 'neutral',
            message,
          })
        },
      })

      const url = new URL(window.location.href)
      url.searchParams.set('room', nextRoom)
      window.history.replaceState(null, '', url)
      setIsCollaborating(true)
    } catch {
      setToast({
        tone: 'warning',
        message: 'Could not open the WebRTC room. Try a different network or room name.',
      })
    }
  }

  function handleLeaveRoom() {
    collabRef.current?.disconnect()
    collabRef.current = null
    setIsCollaborating(false)
    setPeers([])
  }

  async function handleCopyShareUrl() {
    if (!shareUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setToast({
        tone: 'success',
        message: 'Room link copied.',
      })
    } catch {
      setToast({
        tone: 'warning',
        message: 'Copy failed. Select the room link manually.',
      })
    }
  }

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local-first browser DAW</p>
          <h1>Meshtrack Studio</h1>
          <p className="subtitle">
            Tone.js synth tracks, IndexedDB saves, and Yjs/WebRTC rooms with no runtime backend.
          </p>
        </div>
        <nav className="topbar-actions" aria-label="Project links">
          <a className="icon-link" href={appMeta.repositoryUrl} target="_blank" rel="noreferrer">
            <GitBranch aria-hidden="true" size={18} />
            Star on GitHub
          </a>
          <a className="icon-link support" href={appMeta.paypalUrl} target="_blank" rel="noreferrer">
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
            onChange={(event) => setProject((current) => setProjectTitle(current, event.target.value))}
          />
        </label>

        <div className="transport-buttons">
          <button className="primary" type="button" onClick={isPlaying ? handleStop : handlePlay}>
            {isPlaying ? <Pause aria-hidden="true" size={18} /> : <Play aria-hidden="true" size={18} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={handleStop}>
            <Square aria-hidden="true" size={18} />
            Stop
          </button>
          <button type="button" onClick={() => setProject((current) => randomizePattern(current))}>
            <Shuffle aria-hidden="true" size={18} />
            Randomize
          </button>
          <button type="button" onClick={() => setProject((current) => clearPattern(current))}>
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
            onChange={(event) => setProject((current) => setProjectBpm(current, Number(event.target.value)))}
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
                <span key={step} className={activeStep === step ? 'is-current' : ''}>
                  {step + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="track-list">
            {project.tracks.map((track) => (
              <div className="track-row" key={track.id}>
                <div className="track-meta">
                  <span className="track-color" style={{ backgroundColor: track.color }} />
                  <div>
                    <strong>{track.name}</strong>
                    <span>
                      {track.instrument} / {track.note}
                    </span>
                  </div>
                </div>
                <div className="step-grid" role="grid" aria-label={`${track.name} pattern`}>
                  {track.pattern.map((isActive, stepIndex) => (
                    <button
                      aria-label={`${track.name} step ${stepIndex + 1} ${isActive ? 'on' : 'off'}`}
                      className={[
                        'step-cell',
                        isActive ? 'is-on' : '',
                        activeStep === stepIndex ? 'is-current' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={`${track.id}-${stepIndex}`}
                      onClick={() => handleStepToggle(track.id, stepIndex)}
                      style={{ '--track-color': track.color } as CSSProperties}
                      type="button"
                    >
                      <span />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="side-panels">
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
                  <span className="track-color" style={{ backgroundColor: track.color }} />
                  <strong>{track.name}</strong>
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
                      setProject((current) => setTrackVolume(current, track.id, Number(event.target.value)))
                    }
                  />
                </label>
                <div className="toggle-pair">
                  <button
                    className={track.muted ? 'is-active' : ''}
                    type="button"
                    onClick={() => setProject((current) => setTrackMuted(current, track.id, !track.muted))}
                  >
                    Mute
                  </button>
                  <button
                    className={track.solo ? 'is-active' : ''}
                    type="button"
                    onClick={() => setProject((current) => setTrackSolo(current, track.id, !track.solo))}
                  >
                    Solo
                  </button>
                </div>
                {hasSolo && !track.solo ? <p className="dimmed-note">Held by solo</p> : null}
              </div>
            ))}
          </section>

          <section className="panel collab-panel" aria-label="Collaboration">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">WebRTC mesh</p>
                <h2>Collaboration room</h2>
              </div>
              {isCollaborating ? <Wifi aria-hidden="true" size={22} /> : <WifiOff aria-hidden="true" size={22} />}
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
            <button className="wide" type="button" onClick={() => setRoomName(createShareRoomName(project))}>
              Create room name
            </button>
            {shareUrl ? (
              <button className="share-url" type="button" onClick={handleCopyShareUrl}>
                {shareUrl}
              </button>
            ) : null}
            <p className="peer-count">
              {peers.length === 0 ? 'No remote peers connected.' : `${peers.length} peer${peers.length > 1 ? 's' : ''}: ${peers.map((peer) => peer.name).join(', ')}`}
            </p>
          </section>

          <section className="panel storage-panel" aria-label="Local project storage">
            <div className="panel-heading compact">
              <div>
                <p className="eyebrow">Local state</p>
                <h2>Save, import, export</h2>
              </div>
              <Save aria-hidden="true" size={22} />
            </div>
            <p className="storage-meta">Updated {formatDate(project.updatedAt)}. Autosaves stay in this browser.</p>
            <div className="button-row">
              <button type="button" onClick={handleManualSave}>
                <Save aria-hidden="true" size={16} />
                Save
              </button>
              <button type="button" onClick={handleExport}>
                <Download aria-hidden="true" size={16} />
                Export
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}>
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
  )
}

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

function getInitialRoomName(): string {
  return new URLSearchParams(window.location.search).get('room') ?? ''
}

function getInitialToast(roomName: string): ToastState {
  if (roomName) {
    return {
      tone: 'neutral',
      message: `Room "${roomName}" is ready to join.`,
    }
  }

  return {
    tone: 'neutral',
    message: 'Ready. Start audio, sketch a loop, or open a collaboration room.',
  }
}

export default App
