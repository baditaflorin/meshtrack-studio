import { STEP_COUNT, cloneProject, type StudioProject, type Track } from '../studio/project'

type ToneModule = typeof import('tone')

type SynthNode = {
  connect(destination: unknown): unknown
  dispose(): void
  triggerAttackRelease(note: string, duration: string, time?: number, velocity?: number): void
}

type VolumeNode = {
  mute: boolean
  volume: {
    value: number
  }
  dispose(): void
  toDestination(): unknown
}

type Voice = {
  instrument: SynthNode
  volume: VolumeNode
}

const NOTE_DURATION = '16n'

export class AudioEngine {
  private tone: ToneModule | null = null
  private project: StudioProject | null = null
  private voices = new Map<string, Voice>()
  private scheduleId: number | null = null
  private step = -1

  async play(project: StudioProject, onStep: (step: number) => void): Promise<void> {
    const tone = await this.ensureTone()
    await tone.start()
    this.project = cloneProject(project)
    this.reconcileVoices(project)

    const transport = tone.getTransport()
    transport.stop()
    transport.cancel()
    this.step = -1
    transport.bpm.value = project.bpm

    this.scheduleId = transport.scheduleRepeat((time) => {
      this.step = (this.step + 1) % STEP_COUNT
      this.triggerStep(this.step, time)
      tone.getDraw().schedule(() => onStep(this.step), time)
    }, NOTE_DURATION)

    transport.start('+0.05')
  }

  update(project: StudioProject): void {
    this.project = cloneProject(project)

    if (!this.tone) {
      return
    }

    this.reconcileVoices(project)
    this.tone.getTransport().bpm.value = project.bpm
  }

  stop(): void {
    if (!this.tone) {
      return
    }

    const transport = this.tone.getTransport()
    transport.stop()

    if (this.scheduleId !== null) {
      transport.clear(this.scheduleId)
      this.scheduleId = null
    }
  }

  dispose(): void {
    this.stop()
    this.voices.forEach((voice) => {
      voice.instrument.dispose()
      voice.volume.dispose()
    })
    this.voices.clear()
  }

  private triggerStep(stepIndex: number, time: number): void {
    if (!this.project) {
      return
    }

    const hasSolo = this.project.tracks.some((track) => track.solo)

    this.project.tracks.forEach((track) => {
      if (!track.pattern[stepIndex] || track.muted || (hasSolo && !track.solo)) {
        return
      }

      const voice = this.voices.get(track.id)
      voice?.instrument.triggerAttackRelease(track.note, NOTE_DURATION, time, 0.82)
    })
  }

  private reconcileVoices(project: StudioProject): void {
    const activeTrackIds = new Set(project.tracks.map((track) => track.id))

    this.voices.forEach((voice, trackId) => {
      if (!activeTrackIds.has(trackId)) {
        voice.instrument.dispose()
        voice.volume.dispose()
        this.voices.delete(trackId)
      }
    })

    project.tracks.forEach((track) => {
      const current = this.voices.get(track.id)
      const voice = current ?? this.createVoice(track)
      voice.volume.volume.value = track.volume
      voice.volume.mute = track.muted
      this.voices.set(track.id, voice)
    })
  }

  private createVoice(track: Track): Voice {
    if (!this.tone) {
      throw new Error('Audio engine is not initialized.')
    }

    const volume = this.createVolume(track.volume)
    const instrument = this.createInstrument(track)
    instrument.connect(volume)
    volume.toDestination()

    return { instrument, volume }
  }

  private createInstrument(track: Track): SynthNode {
    if (!this.tone) {
      throw new Error('Audio engine is not initialized.')
    }

    const PolySynth = this.tone.PolySynth as unknown as new (...args: unknown[]) => SynthNode
    const Synth = this.tone.Synth as unknown as new (...args: unknown[]) => SynthNode
    const AMSynth = this.tone.AMSynth as unknown as new (...args: unknown[]) => SynthNode
    const MonoSynth = this.tone.MonoSynth as unknown as new (...args: unknown[]) => SynthNode
    const MembraneSynth = this.tone.MembraneSynth as unknown as new (...args: unknown[]) => SynthNode
    const PluckSynth = this.tone.PluckSynth as unknown as new (...args: unknown[]) => SynthNode

    if (track.instrument === 'drum') {
      return new MembraneSynth()
    }

    if (track.instrument === 'bass') {
      return new MonoSynth()
    }

    if (track.instrument === 'pad') {
      return new PolySynth(AMSynth)
    }

    if (track.instrument === 'pluck') {
      return new PluckSynth()
    }

    return new PolySynth(Synth)
  }

  private createVolume(volume: number): VolumeNode {
    if (!this.tone) {
      throw new Error('Audio engine is not initialized.')
    }

    const ToneVolume = this.tone.Volume as unknown as new (volume?: number) => VolumeNode
    return new ToneVolume(volume)
  }

  private async ensureTone(): Promise<ToneModule> {
    if (!this.tone) {
      this.tone = await import('tone')
    }

    return this.tone
  }
}
