import {
  STEP_COUNT,
  cloneProject,
  type ScaleKey,
  type ScaleMode,
  type StudioProject,
  type Track,
} from "../studio/project";

type ToneModule = typeof import("tone");

// ─── Minimal structural types so we avoid "any" and keep TypeScript happy ───

interface ToneNode {
  connect(destination: ToneNode | ToneDestination): this;
  toDestination(): this;
  dispose(): void;
}

interface ToneDestination {}

interface SynthNode extends ToneNode {
  triggerAttackRelease(
    note: string,
    duration: string,
    time?: number,
    velocity?: number,
  ): void;
}

interface VolumeNode extends ToneNode {
  mute: boolean;
  volume: { value: number };
}

interface FilterNode extends ToneNode {
  frequency: { rampTo(value: number, rampTime: number): void };
  type: string;
}

interface EffectNode extends ToneNode {
  wet: { value: number };
}

interface AnalyserNode {
  getValue(): Float32Array;
  connect(dest: ToneNode): void;
  toDestination(): void;
  dispose(): void;
}

// ─── Scale quantizer ────────────────────────────────────────────────────────

const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major:       [0, 2, 4, 5, 7, 9, 11],
  minor:       [0, 2, 3, 5, 7, 8, 10],
  pentatonic:  [0, 2, 4, 7, 9],
  blues:       [0, 3, 5, 6, 7, 10],
  dorian:      [0, 2, 3, 5, 7, 9, 10],
  mixolydian:  [0, 2, 4, 5, 7, 9, 10],
  chromatic:   [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function quantizeNote(noteName: string, root: ScaleKey, mode: ScaleMode): string {
  if (mode === "chromatic") return noteName;

  // Parse note name like "C4", "G#3", "A#2"
  const match = noteName.match(/^([A-G]#?)(\d+)$/);
  if (!match) return noteName;

  const [, pitch, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const midiBase = NOTE_NAMES.indexOf(pitch);
  if (midiBase < 0) return noteName;

  const midi = octave * 12 + midiBase + 12; // +12 to keep non-negative

  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = SCALE_INTERVALS[mode];

  // Find nearest note in scale
  let bestMidi = midi;
  let bestDist = Infinity;
  for (let offset = -12; offset <= 12; offset++) {
    const candidate = midi + offset;
    const semitone = ((candidate - rootIndex) % 12 + 12) % 12;
    if (intervals.includes(semitone)) {
      const dist = Math.abs(offset);
      if (dist < bestDist) {
        bestDist = dist;
        bestMidi = candidate;
      }
    }
  }

  const newOctave = Math.floor((bestMidi - 12) / 12);
  const newPitch = NOTE_NAMES[((bestMidi - 12) % 12 + 12) % 12];
  return `${newPitch}${newOctave}`;
}

// ─── Synth preset builder ────────────────────────────────────────────────────

function buildSynthOptions(track: Track): object {
  const sound = track.sound;

  if (track.instrument === "drum") {
    const presets: Record<string, object> = {
      Pulse:  { pitchDecay: 0.05, octaves: 8, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 1.4 } },
      Solid:  { pitchDecay: 0.02, octaves: 6, envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.8 } },
      Deep:   { pitchDecay: 0.12, octaves: 10, envelope: { attack: 0.001, decay: 0.8, sustain: 0, release: 1.8 } },
      Click:  { pitchDecay: 0.005, octaves: 3, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.2 } },
      Crunch: { pitchDecay: 0.06, octaves: 5, envelope: { attack: 0.001, decay: 0.3, sustain: 0.1, release: 0.6 } },
    };
    return presets[sound] ?? presets["Pulse"];
  }

  if (track.instrument === "bass") {
    const oscTypes: Record<string, string> = {
      Neon:  "triangle",
      Growl: "sawtooth",
      Sub:   "sine",
      Buzzy: "square",
      Pluck: "triangle",
    };
    return {
      oscillator: { type: oscTypes[sound] ?? "triangle" },
      filter: { Q: 2, type: "lowpass", rolloff: -24, frequency: sound === "Growl" ? 800 : 1200 },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.4, baseFrequency: 200, octaves: 3 },
    };
  }

  if (track.instrument === "pad") {
    const presets: Record<string, object> = {
      Warm:     { oscillator: { type: "triangle" }, envelope: { attack: 0.5, decay: 0.3, sustain: 0.7, release: 2 } },
      Ethereal: { oscillator: { type: "sine" },     envelope: { attack: 1.2, decay: 0.5, sustain: 0.9, release: 4 } },
      Dark:     { oscillator: { type: "sawtooth" }, envelope: { attack: 0.8, decay: 0.4, sustain: 0.6, release: 3 } },
      Bright:   { oscillator: { type: "triangle" }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1 } },
      Soft:     { oscillator: { type: "sine" },     envelope: { attack: 0.6, decay: 0.4, sustain: 0.5, release: 2.5 } },
    };
    return presets[sound] ?? presets["Warm"];
  }

  if (track.instrument === "pluck") {
    const presets: Record<string, object> = {
      Nylon:    { attackNoise: 0.1, dampening: 4000, resonance: 0.9 },
      Metallic: { attackNoise: 0.5, dampening: 8000, resonance: 0.98 },
      Short:    { attackNoise: 0.2, dampening: 3000, resonance: 0.7 },
      Snap:     { attackNoise: 1.0, dampening: 2000, resonance: 0.6 },
      Wooden:   { attackNoise: 0.3, dampening: 1500, resonance: 0.8 },
    };
    return presets[sound] ?? presets["Nylon"];
  }

  // lead
  const leadTypes: Record<string, string> = {
    Glass:  "sine",
    Sine:   "sine",
    Square: "square",
    Wavy:   "triangle",
    Chirp:  "sawtooth",
  };
  return {
    oscillator: { type: leadTypes[sound] ?? "sine" },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.5, release: 0.5 },
  };
}

// ─── Voice type ──────────────────────────────────────────────────────────────

type Voice = {
  instrument: SynthNode;
  panner: VolumeNode;
  sound: string; // snapshot so we can detect changes
};

const NOTE_DURATION = "16n";

// ─── AudioEngine ─────────────────────────────────────────────────────────────

export class AudioEngine {
  private tone: ToneModule | null = null;
  private project: StudioProject | null = null;
  private voices = new Map<string, Voice>();
  private scheduleId: number | null = null;
  private step = -1;

  // Master bus nodes
  private masterFilter: FilterNode | null = null;
  private masterReverb: EffectNode | null = null;
  private masterDelay: EffectNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Effect params (stored so we can apply before play())
  private reverbWet = 0.15;
  private delayWet = 0.1;
  private delayTime = "8n";
  private filterFreq = 20000;

  async play(
    project: StudioProject,
    onStep: (step: number) => void,
  ): Promise<void> {
    const tone = await this.ensureTone();
    await tone.start();
    this.project = cloneProject(project);
    await this.ensureMasterBus();
    this.reconcileVoices(project);

    const transport = tone.getTransport();
    transport.stop();
    transport.cancel();
    this.step = -1;
    transport.bpm.value = project.bpm;

    this.scheduleId = transport.scheduleRepeat((time: number) => {
      this.step = (this.step + 1) % STEP_COUNT;
      this.triggerStep(this.step, time);
      tone.getDraw().schedule(() => onStep(this.step), time);
    }, NOTE_DURATION);

    transport.start("+0.05");
  }

  update(project: StudioProject): void {
    this.project = cloneProject(project);
    if (!this.tone) return;
    this.reconcileVoices(project);
    this.tone.getTransport().bpm.value = project.bpm;
  }

  stop(): void {
    if (!this.tone) return;
    const transport = this.tone.getTransport();
    transport.stop();
    if (this.scheduleId !== null) {
      transport.clear(this.scheduleId);
      this.scheduleId = null;
    }
  }

  dispose(): void {
    this.stop();
    this.voices.forEach((voice) => {
      voice.instrument.dispose();
      voice.panner.dispose();
    });
    this.voices.clear();
    this.masterFilter?.dispose();
    this.masterReverb?.dispose();
    this.masterDelay?.dispose();
    this.analyser?.dispose();
  }

  // ── Public live-performance API ──────────────────────────────────────────

  async triggerLive(trackId: string): Promise<void> {
    const tone = await this.ensureTone();
    await tone.start();
    await this.ensureMasterBus();

    if (!this.project) return;
    const track = this.project.tracks.find((t) => t.id === trackId);
    if (!track) return;

    // Ensure voice exists
    if (!this.voices.has(trackId)) {
      this.reconcileVoices(this.project);
    }

    const voice = this.voices.get(trackId);
    if (!voice) return;

    const note = this.resolveNote(track);
    voice.instrument.triggerAttackRelease(note, NOTE_DURATION, undefined, 1);
  }

  // ── Global effects API ────────────────────────────────────────────────────

  setFilterFrequency(frequency: number): void {
    this.filterFreq = frequency;
    this.masterFilter?.frequency.rampTo(frequency, 0.1);
  }

  setFilterType(type: BiquadFilterType): void {
    if (this.masterFilter) {
      (this.masterFilter as any).type = type;
    }
  }

  setReverb(wet: number): void {
    this.reverbWet = wet;
    if (this.masterReverb) {
      this.masterReverb.wet.value = wet;
    }
  }

  setDelay(wet: number, time?: string): void {
    this.delayWet = wet;
    if (time) this.delayTime = time;
    if (this.masterDelay) {
      this.masterDelay.wet.value = wet;
      (this.masterDelay as any).delayTime.value = this.delayTime;
    }
  }

  getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(1024);
    return this.analyser.getValue();
  }

  getReverbWet(): number { return this.reverbWet; }
  getDelayWet(): number { return this.delayWet; }
  getFilterFreq(): number { return this.filterFreq; }

  // ── Private ───────────────────────────────────────────────────────────────

  private resolveNote(track: Track): string {
    if (!this.project) return track.note;
    const { scaleRoot, scaleMode, quantizeEnabled } = this.project;
    if (!quantizeEnabled) return track.note;
    return quantizeNote(track.note, scaleRoot, scaleMode);
  }

  private triggerStep(stepIndex: number, time: number): void {
    if (!this.project) return;
    const hasSolo = this.project.tracks.some((t) => t.solo);

    this.project.tracks.forEach((track) => {
      if (!track.pattern[stepIndex] || track.muted || (hasSolo && !track.solo)) return;

      const voice = this.voices.get(track.id);
      if (!voice) return;

      const note = this.resolveNote(track);
      voice.instrument.triggerAttackRelease(note, NOTE_DURATION, time, 0.82);
    });
  }

  private async ensureMasterBus(): Promise<void> {
    if (!this.tone || this.masterFilter) return;

    const tone = this.tone;

    // Build master chain: filter → reverb → delay → analyser → destination
    const Filter = tone.Filter as unknown as new (freq: number, type: string) => FilterNode;
    const Reverb = tone.Reverb as unknown as new (options: object) => EffectNode;
    const FeedbackDelay = tone.FeedbackDelay as unknown as new (delayTime: string, feedback: number) => EffectNode;
    const Analyser = tone.Analyser as unknown as new (type: string, size: number) => AnalyserNode;

    this.masterFilter = new Filter(this.filterFreq, "lowpass");
    this.masterReverb = new Reverb({ decay: 2.5, wet: this.reverbWet });
    this.masterDelay = new FeedbackDelay(this.delayTime as string, 0.3);
    this.analyser = new Analyser("waveform", 1024);

    this.masterDelay.wet.value = this.delayWet;

    // Chain: filter → reverb → delay → analyser → speakers
    (this.masterFilter as unknown as ToneNode).connect(this.masterReverb as unknown as ToneNode);
    (this.masterReverb as unknown as ToneNode).connect(this.masterDelay as unknown as ToneNode);
    (this.masterDelay as unknown as ToneNode).connect(this.analyser as unknown as ToneNode);
    (this.analyser as any).toDestination();
  }

  private reconcileVoices(project: StudioProject): void {
    const activeIds = new Set(project.tracks.map((t) => t.id));

    // Dispose removed tracks
    this.voices.forEach((voice, trackId) => {
      if (!activeIds.has(trackId)) {
        voice.instrument.dispose();
        voice.panner.dispose();
        this.voices.delete(trackId);
      }
    });

    project.tracks.forEach((track) => {
      const existing = this.voices.get(track.id);

      // Rebuild if sound changed or voice missing
      if (existing && existing.sound === track.sound) {
        // Just update volume/mute
        existing.panner.volume.value = track.volume;
        existing.panner.mute = track.muted;
        return;
      }

      // Dispose old voice if sound changed
      if (existing) {
        existing.instrument.dispose();
        existing.panner.dispose();
      }

      if (!this.tone || !this.masterFilter) return;

      const panner = this.createPanner(track.volume);
      const instrument = this.createInstrument(track);
      instrument.connect(panner);
      (panner as unknown as ToneNode).connect(this.masterFilter as unknown as ToneNode);

      this.voices.set(track.id, { instrument, panner, sound: track.sound });
    });
  }

  private createInstrument(track: Track): SynthNode {
    if (!this.tone) throw new Error("Tone not loaded.");

    const opts = buildSynthOptions(track);

    if (track.instrument === "drum") {
      const MembraneSynth = this.tone.MembraneSynth as unknown as new (opts: object) => SynthNode;
      return new MembraneSynth(opts);
    }
    if (track.instrument === "bass") {
      const MonoSynth = this.tone.MonoSynth as unknown as new (opts: object) => SynthNode;
      return new MonoSynth(opts);
    }
    if (track.instrument === "pad") {
      const PolySynth = this.tone.PolySynth as unknown as new (Voice: unknown, opts: object) => SynthNode;
      const AMSynth = this.tone.AMSynth as unknown as new () => SynthNode;
      return new PolySynth(AMSynth, opts);
    }
    if (track.instrument === "pluck") {
      const PluckSynth = this.tone.PluckSynth as unknown as new (opts: object) => SynthNode;
      return new PluckSynth(opts);
    }

    // lead — PolySynth<Synth>
    const PolySynth = this.tone.PolySynth as unknown as new (Voice: unknown, opts: object) => SynthNode;
    const Synth = this.tone.Synth as unknown as new () => SynthNode;
    return new PolySynth(Synth, opts);
  }

  private createPanner(volume: number): VolumeNode {
    if (!this.tone) throw new Error("Tone not loaded.");
    const Volume = this.tone.Volume as unknown as new (vol: number) => VolumeNode;
    return new Volume(volume);
  }

  private async ensureTone(): Promise<ToneModule> {
    if (!this.tone) {
      this.tone = await import("tone");
    }
    return this.tone;
  }
}
