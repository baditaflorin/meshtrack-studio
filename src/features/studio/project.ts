import { z } from "zod";

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
  "storage",
  "collaboration",
  "fixture",
] as const;
export const lineEndingOptions = ["none", "lf", "crlf", "mixed"] as const;

export type Instrument = (typeof instrumentOptions)[number];
export type ConfidenceLevel = (typeof confidenceOptions)[number];
export type IssueSeverity = (typeof issueSeverityOptions)[number];
export type ProjectSource = (typeof sourceOptions)[number];
export type LineEndingKind = (typeof lineEndingOptions)[number];

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
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;
export type ScaleKey = (typeof scaleKeyOptions)[number];

export const NOTE_OPTIONS = [
  "C2", "D2", "E2", "F2", "G2", "A2", "B2",
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
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

export function createDefaultProject(): StudioProject {
  const now = new Date().toISOString();

  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: createId("project"),
    title: "Meshtrack sketch",
    bpm: 118,
    quantizeEnabled: false,
    scaleRoot: "C",
    scaleMode: "major",
    updatedAt: now,
    tracks: seedTracks.map((track, index) => ({
      ...track,
      id: createId(`track-${index + 1}`),
      muted: false,
      solo: false,
    })),
    provenance: {
      source: "generated",
      sourceKind: "local-default-project",
      sourceFingerprint: "generated-default-project",
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
      decisions: ["Created locally by Meshtrack Studio."],
    },
  };
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
  const slug = project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 36);

  return `${slug || "meshtrack"}-${createId("room").slice(-6)}`;
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
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
