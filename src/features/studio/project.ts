import { z } from "zod";
import { createStableId } from "../../lib/id";
import { slugify } from "../../lib/slug";

export const PROJECT_SCHEMA_VERSION = "meshtrack.project.v1";
export const CANONICAL_SCHEMA_VERSION = "meshtrack.project.v2";
export const STEP_COUNT = 16;
export const LARGE_PROJECT_TRACK_COUNT = 8;

export const instrumentOptions = [
  "lead",
  "bass",
  "pad",
  "pluck",
  "drum",
] as const;

export const confidenceOptions = ["low", "medium", "high"] as const;
export const issueSeverityOptions = ["info", "warning", "error"] as const;
export const sourceOptions = [
  "generated",
  "file",
  "pasted",
  "clipboard",
  "share",
  "storage",
  "collaboration",
  "fixture",
] as const;
export const lineEndingOptions = ["none", "lf", "crlf", "mixed"] as const;
export const filterTypeOptions = [
  "lowpass",
  "highpass",
  "bandpass",
  "notch",
  "allpass",
] as const;

export type Instrument = (typeof instrumentOptions)[number];
export type ConfidenceLevel = (typeof confidenceOptions)[number];
export type IssueSeverity = (typeof issueSeverityOptions)[number];
export type ProjectSource = (typeof sourceOptions)[number];
export type LineEndingKind = (typeof lineEndingOptions)[number];
export type FilterType = (typeof filterTypeOptions)[number];

export type ImportIssue = {
  code: string;
  severity: IssueSeverity;
  message: string;
  why: string;
  nextStep: string;
  field?: string;
  fixApplied?: boolean;
};

export type ImportAnalysis = {
  confidence: ConfidenceLevel;
  score: number;
  issues: ImportIssue[];
  decisions: string[];
};

export type ProjectProvenance = {
  source: ProjectSource;
  sourceKind: string;
  sourceFingerprint: string;
  lineEndings: LineEndingKind;
  hadBom: boolean;
  normalizationVersion: number;
  deterministicExport: true;
  issueCodes: string[];
  warningCount: number;
};

export type MasterFxSettings = {
  reverbWet: number;
  delayWet: number;
  delayTime: string;
  filterFrequency: number;
  filterType: FilterType;
};

export const scaleModeOptions = [
  "major",
  "minor",
  "pentatonic",
  "blues",
  "dorian",
  "mixolydian",
  "chromatic",
] as const;
export type ScaleMode = (typeof scaleModeOptions)[number];

export const scaleKeyOptions = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;
export type ScaleKey = (typeof scaleKeyOptions)[number];

export const NOTE_OPTIONS = [
  "C2",
  "D2",
  "E2",
  "F2",
  "G2",
  "A2",
  "B2",
  "C3",
  "D3",
  "E3",
  "F3",
  "G3",
  "A3",
  "B3",
  "C4",
  "D4",
  "E4",
  "F4",
  "G4",
  "A4",
  "B4",
] as const;

export type Track = {
  id: string;
  name: string;
  color: string;
  instrument: Instrument;
  sound: string;
  note: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  pattern: boolean[];
  extensions?: Record<string, unknown>;
};

export type StudioProject = {
  schemaVersion:
    | typeof PROJECT_SCHEMA_VERSION
    | typeof CANONICAL_SCHEMA_VERSION;
  id: string;
  title: string;
  bpm: number;
  quantizeEnabled: boolean;
  scaleRoot: ScaleKey;
  scaleMode: ScaleMode;
  masterFx: MasterFxSettings;
  updatedAt: string;
  tracks: Track[];
  provenance?: ProjectProvenance;
  importAnalysis?: ImportAnalysis;
  extensions?: Record<string, unknown>;
};

const issueSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(issueSeverityOptions),
  message: z.string().min(1),
  why: z.string().min(1),
  nextStep: z.string().min(1),
  field: z.string().min(1).optional(),
  fixApplied: z.boolean().optional(),
});

const importAnalysisSchema = z.object({
  confidence: z.enum(confidenceOptions),
  score: z.number().min(0).max(1),
  issues: z.array(issueSchema),
  decisions: z.array(z.string()),
});

const projectProvenanceSchema = z.object({
  source: z.enum(sourceOptions),
  sourceKind: z.string().min(1),
  sourceFingerprint: z.string().min(1),
  lineEndings: z.enum(lineEndingOptions),
  hadBom: z.boolean(),
  normalizationVersion: z.number().int().min(1),
  deterministicExport: z.literal(true),
  issueCodes: z.array(z.string()),
  warningCount: z.number().int().min(0),
});

const masterFxSchema = z.object({
  reverbWet: z.number().min(0).max(1).default(0.15),
  delayWet: z.number().min(0).max(0.9).default(0.1),
  delayTime: z.string().min(1).default("8n"),
  filterFrequency: z.number().min(100).max(20000).default(20000),
  filterType: z.enum(filterTypeOptions).default("lowpass"),
});

const trackSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(48),
    color: z.string().min(3).max(32),
    instrument: z.enum(instrumentOptions),
    sound: z.string().min(1).max(48),
    note: z.string().min(1).max(8),
    volume: z.number().min(-48).max(6),
    muted: z.boolean(),
    solo: z.boolean(),
    pattern: z.array(z.boolean()).length(STEP_COUNT),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export const projectSchema = z
  .object({
    schemaVersion: z.enum([PROJECT_SCHEMA_VERSION, CANONICAL_SCHEMA_VERSION]),
    id: z.string().min(1),
    title: z.string().min(1).max(80),
    bpm: z.number().int().min(60).max(180),
    quantizeEnabled: z.boolean().optional().default(false),
    scaleRoot: z.enum(scaleKeyOptions).optional().default("C"),
    scaleMode: z.enum(scaleModeOptions).optional().default("major"),
    masterFx: masterFxSchema.optional().default({
      reverbWet: 0.15,
      delayWet: 0.1,
      delayTime: "8n",
      filterFrequency: 20000,
      filterType: "lowpass",
    }),
    updatedAt: z.string().min(1),
    tracks: z.array(trackSchema).min(1).max(64),
    provenance: projectProvenanceSchema.optional(),
    importAnalysis: importAnalysisSchema.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const seedTracks = [
  {
    name: "Kick pulse",
    color: "#f25f5c",
    instrument: "drum",
    sound: "Pulse",
    note: "C2",
    volume: -6,
    pattern: [
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
  },
  {
    name: "Neon bass",
    color: "#00b894",
    instrument: "bass",
    sound: "Neon",
    note: "C2",
    volume: -10,
    pattern: [
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
    ],
  },
  {
    name: "Glass lead",
    color: "#0984e3",
    instrument: "lead",
    sound: "Glass",
    note: "G4",
    volume: -13,
    pattern: [
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      true,
    ],
  },
  {
    name: "Warm pad",
    color: "#fdcb6e",
    instrument: "pad",
    sound: "Warm",
    note: "C4",
    volume: -18,
    pattern: [
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
  },
] satisfies Array<Omit<Track, "id" | "muted" | "solo">>;

export const SOUND_LIBRARY: Record<Instrument, string[]> = {
  drum: ["Pulse", "Solid", "Deep", "Click", "Crunch"],
  bass: ["Neon", "Growl", "Sub", "Buzzy", "Pluck"],
  lead: ["Glass", "Sine", "Square", "Wavy", "Chirp"],
  pad: ["Warm", "Ethereal", "Dark", "Bright", "Soft"],
  pluck: ["Nylon", "Metallic", "Short", "Snap", "Wooden"],
};

export function setTrackSound(
  project: StudioProject,
  trackId: string,
  sound: string,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({
    ...track,
    sound,
  }));
}

export function randomizeSounds(project: StudioProject): StudioProject {
  return touchProject({
    ...project,
    tracks: project.tracks.map((track) => {
      const sounds = SOUND_LIBRARY[track.instrument];
      const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
      return {
        ...track,
        sound: randomSound,
      };
    }),
  });
}

export const templateKinds = [
  "default",
  "lofi",
  "techno",
  "trap",
  "drum-and-bass",
  "ambient",
] as const;
export type TemplateKind = (typeof templateKinds)[number];

export const templateLabels: Record<TemplateKind, string> = {
  default: "Meshtrack sketch",
  lofi: "Lofi study loop",
  techno: "Techno warehouse",
  trap: "Trap night ride",
  "drum-and-bass": "DnB rolling cut",
  ambient: "Ambient long drift",
};

interface TemplateBlueprint {
  title: string;
  bpm: number;
  scaleRoot: ScaleKey;
  scaleMode: ScaleMode;
  tracks: Array<Omit<Track, "id" | "muted" | "solo">>;
}

/** Compact 16-step pattern literal: "1" = hit, anything else = rest. */
function pat(literal: string): boolean[] {
  const padded =
    literal.length >= STEP_COUNT ? literal : literal.padEnd(STEP_COUNT, ".");
  return Array.from(padded.slice(0, STEP_COUNT), (char) => char === "1");
}

const templateBlueprints: Record<TemplateKind, TemplateBlueprint> = {
  default: {
    title: templateLabels.default,
    bpm: 118,
    scaleRoot: "C",
    scaleMode: "major",
    tracks: seedTracks,
  },
  lofi: {
    // Slow swung beat, dusty rhodes-style pad, warm bass on the off-eighths.
    title: templateLabels.lofi,
    bpm: 78,
    scaleRoot: "A",
    scaleMode: "minor",
    tracks: [
      {
        name: "Lofi kick",
        color: "#d97757",
        instrument: "drum",
        sound: "Deep",
        note: "C2",
        volume: -7,
        pattern: pat("1...........1..."),
      },
      {
        name: "Brush snare",
        color: "#e8a87c",
        instrument: "drum",
        sound: "Click",
        note: "C2",
        volume: -12,
        pattern: pat("....1.......1..."),
      },
      {
        name: "Warm bass",
        color: "#41b3a3",
        instrument: "bass",
        sound: "Warm",
        note: "A1",
        volume: -10,
        pattern: pat("1..1..1.1..1..1."),
      },
      {
        name: "Dusty rhodes pad",
        color: "#c38d9e",
        instrument: "pad",
        sound: "Warm",
        note: "E4",
        volume: -16,
        pattern: pat("1......11......."),
      },
    ],
  },
  techno: {
    // Driving four-on-the-floor with an off-beat hat and a pulsing acid bass.
    title: templateLabels.techno,
    bpm: 128,
    scaleRoot: "A",
    scaleMode: "minor",
    tracks: [
      {
        name: "Four-on-the-floor kick",
        color: "#f25f5c",
        instrument: "drum",
        sound: "Pulse",
        note: "C2",
        volume: -5,
        pattern: pat("1...1...1...1..."),
      },
      {
        name: "Off-beat hat",
        color: "#ffe66d",
        instrument: "drum",
        sound: "Click",
        note: "C2",
        volume: -14,
        pattern: pat("..1...1...1...1."),
      },
      {
        name: "Acid bass",
        color: "#00b894",
        instrument: "bass",
        sound: "Neon",
        note: "A1",
        volume: -9,
        pattern: pat("1.1.1.1.1.1.1.1."),
      },
      {
        name: "Riser lead",
        color: "#0984e3",
        instrument: "lead",
        sound: "Glass",
        note: "E5",
        volume: -16,
        pattern: pat("...........1...1"),
      },
    ],
  },
  trap: {
    // Half-time feel, sparse kick, rolling hat at the end of the bar.
    title: templateLabels.trap,
    bpm: 70,
    scaleRoot: "F",
    scaleMode: "minor",
    tracks: [
      {
        name: "808 kick",
        color: "#6c5ce7",
        instrument: "drum",
        sound: "Deep",
        note: "C2",
        volume: -4,
        pattern: pat("1.......1...1..."),
      },
      {
        name: "Snap snare",
        color: "#fdcb6e",
        instrument: "drum",
        sound: "Crunch",
        note: "C2",
        volume: -10,
        pattern: pat("....1.......1..."),
      },
      {
        name: "Roll hat",
        color: "#dfe6e9",
        instrument: "drum",
        sound: "Click",
        note: "C2",
        volume: -15,
        pattern: pat("1.1.1.1.1.111111"),
      },
      {
        name: "Sub bass",
        color: "#e17055",
        instrument: "bass",
        sound: "Neon",
        note: "F1",
        volume: -6,
        pattern: pat("1.......1.1.1..."),
      },
    ],
  },
  "drum-and-bass": {
    // 174 BPM with the canonical two-step snare on 5 and 13.
    title: templateLabels["drum-and-bass"],
    bpm: 174,
    scaleRoot: "D",
    scaleMode: "minor",
    tracks: [
      {
        name: "Tight kick",
        color: "#fab1a0",
        instrument: "drum",
        sound: "Solid",
        note: "C2",
        volume: -6,
        pattern: pat("1.......1.....1."),
      },
      {
        name: "Two-step snare",
        color: "#74b9ff",
        instrument: "drum",
        sound: "Click",
        note: "C2",
        volume: -10,
        pattern: pat("....1.......1..."),
      },
      {
        name: "Reese bass",
        color: "#a29bfe",
        instrument: "bass",
        sound: "Neon",
        note: "D1",
        volume: -8,
        pattern: pat("1.1.1...1.1.1..."),
      },
      {
        name: "Stab lead",
        color: "#55efc4",
        instrument: "lead",
        sound: "Glass",
        note: "D5",
        volume: -15,
        pattern: pat("....1.......1..."),
      },
    ],
  },
  ambient: {
    // Drone tempo, single sparse hits per bar — pads carry the piece.
    title: templateLabels.ambient,
    bpm: 60,
    scaleRoot: "C",
    scaleMode: "minor",
    tracks: [
      {
        name: "Drone pad",
        color: "#81ecec",
        instrument: "pad",
        sound: "Warm",
        note: "C4",
        volume: -14,
        pattern: pat("1..............."),
      },
      {
        name: "Bell shimmer",
        color: "#ffeaa7",
        instrument: "pluck",
        sound: "Nylon",
        note: "G5",
        volume: -18,
        pattern: pat("........1......."),
      },
      {
        name: "Sub drone",
        color: "#0984e3",
        instrument: "bass",
        sound: "Warm",
        note: "C2",
        volume: -12,
        pattern: pat("1..............."),
      },
      {
        name: "Air pulse",
        color: "#dfe6e9",
        instrument: "drum",
        sound: "Solid",
        note: "C2",
        volume: -22,
        pattern: pat("1..............."),
      },
    ],
  },
};

export function createTemplateProject(
  kind: TemplateKind = "default",
): StudioProject {
  const blueprint = templateBlueprints[kind] ?? templateBlueprints.default;
  const now = new Date().toISOString();
  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: createId("project"),
    title: blueprint.title,
    bpm: blueprint.bpm,
    quantizeEnabled: false,
    scaleRoot: blueprint.scaleRoot,
    scaleMode: blueprint.scaleMode,
    masterFx: createDefaultMasterFx(),
    updatedAt: now,
    tracks: blueprint.tracks.map((track, index) => ({
      ...track,
      id: createId(`track-${index + 1}`),
      muted: false,
      solo: false,
    })),
    provenance: {
      source: "generated",
      sourceKind:
        kind === "default" ? "local-default-project" : `local-template:${kind}`,
      sourceFingerprint:
        kind === "default"
          ? "generated-default-project"
          : `generated-template-${kind}`,
      lineEndings: "none",
      hadBom: false,
      normalizationVersion: 2,
      deterministicExport: true,
      issueCodes: [],
      warningCount: 0,
    },
    importAnalysis: {
      confidence: "high",
      score: 1,
      issues: [],
      decisions:
        kind === "default"
          ? ["Created locally by Meshtrack Studio."]
          : [`Created locally from the ${kind} template.`],
    },
  };
}

export function createDefaultProject(): StudioProject {
  return createTemplateProject("default");
}

export function setQuantizeEnabled(
  project: StudioProject,
  enabled: boolean,
): StudioProject {
  return touchProject({ ...project, quantizeEnabled: enabled });
}

export function setScaleRoot(
  project: StudioProject,
  root: ScaleKey,
): StudioProject {
  return touchProject({ ...project, scaleRoot: root });
}

export function setScaleMode(
  project: StudioProject,
  mode: ScaleMode,
): StudioProject {
  return touchProject({ ...project, scaleMode: mode });
}

export function setMasterFxReverb(
  project: StudioProject,
  reverbWet: number,
): StudioProject {
  return touchProject({
    ...project,
    masterFx: {
      ...project.masterFx,
      reverbWet: clamp(reverbWet, 0, 1),
    },
  });
}

export function setMasterFxDelay(
  project: StudioProject,
  delayWet: number,
): StudioProject {
  return touchProject({
    ...project,
    masterFx: {
      ...project.masterFx,
      delayWet: clamp(delayWet, 0, 0.9),
    },
  });
}

export function setMasterFxFilterFrequency(
  project: StudioProject,
  filterFrequency: number,
): StudioProject {
  return touchProject({
    ...project,
    masterFx: {
      ...project.masterFx,
      filterFrequency: clamp(filterFrequency, 100, 20000),
    },
  });
}

export function setMasterFxFilterType(
  project: StudioProject,
  filterType: FilterType,
): StudioProject {
  return touchProject({
    ...project,
    masterFx: {
      ...project.masterFx,
      filterType,
    },
  });
}

export function setTrackNote(
  project: StudioProject,
  trackId: string,
  note: string,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({ ...track, note }));
}

export function cloneProject(project: StudioProject): StudioProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      pattern: [...track.pattern],
      extensions: cloneJsonRecord(track.extensions),
    })),
    masterFx: { ...project.masterFx },
    provenance: project.provenance ? { ...project.provenance } : undefined,
    importAnalysis: project.importAnalysis
      ? {
          ...project.importAnalysis,
          issues: project.importAnalysis.issues.map((issue) => ({ ...issue })),
          decisions: [...project.importAnalysis.decisions],
        }
      : undefined,
    extensions: cloneJsonRecord(project.extensions),
  };
}

export function parseProject(candidate: unknown): StudioProject {
  return projectSchema.parse(candidate);
}

export function safeParseProject(candidate: unknown): StudioProject | null {
  const parsed = projectSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function toggleStep(
  project: StudioProject,
  trackId: string,
  stepIndex: number,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({
    ...track,
    pattern: track.pattern.map((step, index) =>
      index === stepIndex ? !step : step,
    ),
  }));
}

export function setTrackVolume(
  project: StudioProject,
  trackId: string,
  volume: number,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({
    ...track,
    volume: clamp(volume, -48, 6),
  }));
}

export function setTrackMuted(
  project: StudioProject,
  trackId: string,
  muted: boolean,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({
    ...track,
    muted,
  }));
}

export function setTrackSolo(
  project: StudioProject,
  trackId: string,
  solo: boolean,
): StudioProject {
  return updateTrack(project, trackId, (track) => ({
    ...track,
    solo,
  }));
}

export function setProjectBpm(
  project: StudioProject,
  bpm: number,
): StudioProject {
  return touchProject({
    ...project,
    bpm: Math.round(clamp(bpm, 60, 180)),
  });
}

export function setProjectTitle(
  project: StudioProject,
  title: string,
): StudioProject {
  const safeTitle = title.trim().slice(0, 80) || "Untitled sketch";
  return touchProject({
    ...project,
    title: safeTitle,
  });
}

export function clearPattern(project: StudioProject): StudioProject {
  return touchProject({
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      pattern: Array.from({ length: STEP_COUNT }, () => false),
    })),
  });
}

export function randomizePattern(project: StudioProject): StudioProject {
  return touchProject({
    ...project,
    tracks: project.tracks.map((track, trackIndex) => ({
      ...track,
      pattern: track.pattern.map((_, stepIndex) => {
        const downbeat = stepIndex % 4 === 0;
        const density = track.instrument === "drum" ? 0.34 : 0.22;
        return (
          Math.random() < density ||
          (downbeat && trackIndex < 2 && Math.random() < 0.55)
        );
      }),
    })),
  });
}

export function createShareRoomName(project: StudioProject): string {
  const slug = slugify(project.title, "meshtrack").slice(0, 36);

  return `${slug || "meshtrack"}-${createStableId("room").slice(-6)}`;
}

export function getImportConfidence(
  project: StudioProject,
): ConfidenceLevel | null {
  return project.importAnalysis?.confidence ?? null;
}

function updateTrack(
  project: StudioProject,
  trackId: string,
  updater: (track: Track) => Track,
): StudioProject {
  return touchProject({
    ...project,
    tracks: project.tracks.map((track) =>
      track.id === trackId ? updater(track) : track,
    ),
  });
}

function touchProject(project: StudioProject): StudioProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}

function createDefaultMasterFx(): MasterFxSettings {
  return {
    reverbWet: 0.15,
    delayWet: 0.1,
    delayTime: "8n",
    filterFrequency: 20000,
    filterType: "lowpass",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneJsonRecord(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function createId(prefix: string): string {
  return createStableId(prefix);
}
