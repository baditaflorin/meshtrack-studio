import { z } from "zod";

export const PROJECT_SCHEMA_VERSION = "meshtrack.project.v1";
export const STEP_COUNT = 16;

export const instrumentOptions = [
  "lead",
  "bass",
  "pad",
  "pluck",
  "drum",
] as const;
export type Instrument = (typeof instrumentOptions)[number];

export type Track = {
  id: string;
  name: string;
  color: string;
  instrument: Instrument;
  note: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  pattern: boolean[];
};

export type StudioProject = {
  schemaVersion: typeof PROJECT_SCHEMA_VERSION;
  id: string;
  title: string;
  bpm: number;
  updatedAt: string;
  tracks: Track[];
};

const trackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(48),
  color: z.string().min(3).max(32),
  instrument: z.enum(instrumentOptions),
  note: z.string().min(1).max(8),
  volume: z.number().min(-48).max(6),
  muted: z.boolean(),
  solo: z.boolean(),
  pattern: z.array(z.boolean()).length(STEP_COUNT),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  bpm: z.number().int().min(60).max(180),
  updatedAt: z.string().min(1),
  tracks: z.array(trackSchema).min(1).max(8),
});

const seedTracks = [
  {
    name: "Kick pulse",
    color: "#f25f5c",
    instrument: "drum",
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

export function createDefaultProject(): StudioProject {
  const now = new Date().toISOString();

  return touchProject({
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: createId("project"),
    title: "Meshtrack sketch",
    bpm: 118,
    updatedAt: now,
    tracks: seedTracks.map((track, index) => ({
      ...track,
      id: createId(`track-${index + 1}`),
      muted: false,
      solo: false,
    })),
  });
}

export function cloneProject(project: StudioProject): StudioProject {
  return {
    ...project,
    tracks: project.tracks.map((track) => ({
      ...track,
      pattern: [...track.pattern],
    })),
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

function createId(prefix: string): string {
  if ("crypto" in globalThis && "randomUUID" in globalThis.crypto) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
