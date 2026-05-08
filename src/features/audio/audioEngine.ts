import {
  STEP_COUNT,
  cloneProject,
  type StudioProject,
  type Track,
} from "../studio/project";

type ToneModule = typeof import("tone");

type SynthNode = {
  connect(destination: unknown): unknown;
  dispose(): void;
  triggerAttackRelease(
    note: string,
    duration: string,
    time?: number,
    velocity?: number,
  ): void;
};

type VolumeNode = {
  mute: boolean;
  volume: {
    value: number;
  };
  connect(destination: unknown): unknown;
  dispose(): void;
  toDestination(): unknown;
};

type Voice = {
  instrument: SynthNode;
  volume: VolumeNode;
};

const NOTE_DURATION = "16n";

export class AudioEngine {
  private tone: ToneModule | null = null;
  private project: StudioProject | null = null;
  private voices = new Map<string, Voice>();
  private scheduleId: number | null = null;
  private step = -1;
  private masterFilter: any = null;
  private analyser: any = null;

  async play(
    project: StudioProject,
    onStep: (step: number) => void,
  ): Promise<void> {
    const tone = await this.ensureTone();
    await tone.start();
    this.project = cloneProject(project);
    this.ensureMasterNodes();
    this.reconcileVoices(project);

    const transport = tone.getTransport();
    transport.stop();
    transport.cancel();
    this.step = -1;
    transport.bpm.value = project.bpm;

    this.scheduleId = transport.scheduleRepeat((time) => {
      this.step = (this.step + 1) % STEP_COUNT;
      this.triggerStep(this.step, time);
      tone.getDraw().schedule(() => onStep(this.step), time);
    }, NOTE_DURATION);

    transport.start("+0.05");
  }

  update(project: StudioProject): void {
    this.project = cloneProject(project);

    if (!this.tone) {
      return;
    }

    this.reconcileVoices(project);
    this.tone.getTransport().bpm.value = project.bpm;
  }

  stop(): void {
    if (!this.tone) {
      return;
    }

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
      voice.volume.dispose();
    });
    this.voices.clear();
    this.masterFilter?.dispose();
    this.analyser?.dispose();
  }

  triggerLive(trackId: string): void {
    if (!this.tone || !this.project) return;
    const track = this.project.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const voice = this.voices.get(trackId);
    voice?.instrument.triggerAttackRelease(track.note, NOTE_DURATION, undefined, 1);
  }

  setFilterFrequency(frequency: number): void {
    if (this.masterFilter) {
      this.masterFilter.frequency.rampTo(frequency, 0.1);
    }
  }

  getAnalyserData(): Float32Array {
    if (!this.analyser) return new Float32Array(0);
    return this.analyser.getValue();
  }

  private triggerStep(stepIndex: number, time: number): void {
    if (!this.project) {
      return;
    }

    const hasSolo = this.project.tracks.some((track) => track.solo);

    this.project.tracks.forEach((track) => {
      if (
        !track.pattern[stepIndex] ||
        track.muted ||
        (hasSolo && !track.solo)
      ) {
        return;
      }

      const voice = this.voices.get(track.id);
      voice?.instrument.triggerAttackRelease(
        track.note,
        NOTE_DURATION,
        time,
        0.82,
      );
    });
  }

  private ensureMasterNodes(): void {
    if (!this.tone) return;
    if (!this.masterFilter) {
      this.masterFilter = new this.tone.Filter(20000, "lowpass");
      this.analyser = new this.tone.Analyser("waveform", 1024);
      this.masterFilter.connect(this.analyser);
      this.analyser.toDestination();
    }
  }

  private reconcileVoices(project: StudioProject): void {
    const activeTrackIds = new Set(project.tracks.map((track) => track.id));

    this.voices.forEach((voice, trackId) => {
      if (!activeTrackIds.has(trackId)) {
        voice.instrument.dispose();
        voice.volume.dispose();
        this.voices.delete(trackId);
      }
    });

    project.tracks.forEach((track) => {
      const current = this.voices.get(track.id);
      const voice = current ?? this.createVoice(track);
      voice.volume.volume.value = track.volume;
      voice.volume.mute = track.muted;
      this.voices.set(track.id, voice);
    });
  }

  private createVoice(track: Track): Voice {
    if (!this.tone) {
      throw new Error("Audio engine is not initialized.");
    }

    const volume = this.createVolume(track.volume);
    const instrument = this.createInstrument(track);
    instrument.connect(volume);
    
    if (this.masterFilter) {
      volume.connect(this.masterFilter);
    } else {
      volume.toDestination();
    }

    return { instrument, volume };
  }

  private createInstrument(track: Track): SynthNode {
    if (!this.tone) {
      throw new Error("Audio engine is not initialized.");
    }

    const PolySynth = this.tone.PolySynth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;
    const Synth = this.tone.Synth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;
    const AMSynth = this.tone.AMSynth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;
    const MonoSynth = this.tone.MonoSynth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;
    const MembraneSynth = this.tone.MembraneSynth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;
    const PluckSynth = this.tone.PluckSynth as unknown as new (
      ...args: unknown[]
    ) => SynthNode;

    if (track.instrument === "drum") {
      const synth = new MembraneSynth();
      if (track.sound === "Solid") (synth as any).pitchDecay = 0.02;
      if (track.sound === "Deep") (synth as any).octave = 12;
      if (track.sound === "Click") (synth as any).envelope.attack = 0.001;
      return synth;
    }

    if (track.instrument === "bass") {
      const synth = new MonoSynth();
      if (track.sound === "Growl") (synth as any).oscillator.type = "sawtooth";
      if (track.sound === "Sub") (synth as any).oscillator.type = "sine";
      if (track.sound === "Buzzy") (synth as any).oscillator.type = "square";
      return synth;
    }

    if (track.instrument === "pad") {
      const synth = new PolySynth(AMSynth);
      if (track.sound === "Dark") (synth as any).set({ envelope: { release: 4 } });
      if (track.sound === "Bright") (synth as any).set({ oscillator: { type: "triangle" } });
      return synth;
    }

    if (track.instrument === "pluck") {
      return new PluckSynth();
    }

    return new PolySynth(Synth);
  }

  private createVolume(volume: number): VolumeNode {
    if (!this.tone) {
      throw new Error("Audio engine is not initialized.");
    }

    const ToneVolume = this.tone.Volume as unknown as new (
      volume?: number,
    ) => VolumeNode;
    return new ToneVolume(volume);
  }

  private async ensureTone(): Promise<ToneModule> {
    if (!this.tone) {
      this.tone = await import("tone");
    }

    return this.tone;
  }
}
