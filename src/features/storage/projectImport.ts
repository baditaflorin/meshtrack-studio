import { parse as parseJsonc } from "jsonc-parser";
import {
  CANONICAL_SCHEMA_VERSION,
  LARGE_PROJECT_TRACK_COUNT,
  SOUND_LIBRARY,
  STEP_COUNT,
  type ImportAnalysis,
  type ImportIssue,
  type Instrument,
  type LineEndingKind,
  type ProjectSource,
  type ScaleKey,
  type ScaleMode,
  type StudioProject,
  type Track,
  projectSchema,
  scaleKeyOptions,
  scaleModeOptions,
} from "../studio/project";

export type ImportFailure = {
  ok: false;
  code: string;
  message: string;
  why: string;
  nextStep: string;
  issues: ImportIssue[];
};

export type ImportSuccess = {
  ok: true;
  project: StudioProject;
};

export type ImportResult = ImportSuccess | ImportFailure;

type JsonRecord = Record<string, unknown>;
type ImportContext = {
  source: ProjectSource;
  issues: ImportIssue[];
  decisions: string[];
  sourceKind: string;
  hadBom: boolean;
  lineEndings: LineEndingKind;
  sourceFingerprint: string;
};

const NORMALIZATION_VERSION = 2;
const DEFAULT_UPDATED_AT = "1970-01-01T00:00:00.000Z";
const DEFAULT_COLORS = [
  "#f25f5c",
  "#00b894",
  "#0984e3",
  "#fdcb6e",
  "#6c5ce7",
  "#e84393",
  "#55efc4",
  "#d63031",
  "#00cec9",
  "#fab1a0",
  "#74b9ff",
  "#636e72",
];

export function importProjectText(
  rawText: string,
  source: ProjectSource = "file",
): ImportResult {
  return importNormalizedText(rawText, source, "utf-8");
}

export function importProjectBytes(
  bytes: Uint8Array,
  source: ProjectSource = "file",
): ImportResult {
  const hadUtf8Bom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  const utf8Result = importNormalizedText(utf8, source, "utf-8", hadUtf8Bom);
  const utf8LooksHealthy = !utf8.includes("\uFFFD");

  if ((utf8Result.ok && utf8LooksHealthy) || utf8.trim() === "") {
    return utf8Result;
  }

  const windows1252 = new TextDecoder("windows-1252").decode(bytes);
  if (windows1252 === utf8) {
    return utf8Result;
  }

  const fallbackResult = importNormalizedText(
    windows1252,
    source,
    "windows-1252",
    hadUtf8Bom,
  );

  if (!fallbackResult.ok) {
    return utf8Result;
  }

  if (utf8Result.ok && utf8LooksHealthy) {
    return utf8Result;
  }

  fallbackResult.project.importAnalysis?.issues.unshift(
    makeIssue("decoded-windows-1252"),
  );
  if (fallbackResult.project.importAnalysis) {
    fallbackResult.project.importAnalysis = recomputeAnalysis(
      fallbackResult.project.importAnalysis,
    );
  }
  fallbackResult.project.provenance = buildProvenance(
    fallbackResult.project,
    source,
    detectSourceKind(fallbackResult.project),
    false,
    detectLineEndings(windows1252),
    fingerprintString(windows1252),
  );
  return fallbackResult;
}

export function importProjectCandidate(
  candidate: unknown,
  source: ProjectSource = "storage",
): ImportResult {
  const context = createContext(
    source,
    "structured-candidate",
    false,
    "none",
    "",
  );

  if (!candidate || typeof candidate !== "object") {
    return fail(
      "invalid-project-shape",
      "This saved project does not contain project data.",
      "Meshtrack expected a project object but found something else.",
      "Reset local storage or re-import a healthy export.",
    );
  }

  return buildProjectFromCandidate(candidate, context);
}

function importNormalizedText(
  rawText: string,
  source: ProjectSource,
  decodedAs: "utf-8" | "windows-1252",
  hadBomOverride = false,
): ImportResult {
  if (rawText.trim() === "") {
    return fail(
      "empty-input",
      "This file is empty.",
      "Meshtrack needs a project-like JSON document, but the input had no content.",
      "Import a Meshtrack export or paste a project-shaped JSON object.",
    );
  }

  const hadBom = hadBomOverride || rawText.charCodeAt(0) === 0xfeff;
  const lineEndings = detectLineEndings(rawText);
  const normalizedText = rawText.replace(/^\uFEFF/, "");
  const context = createContext(
    source,
    "project-object",
    hadBom,
    lineEndings,
    fingerprintString(normalizedText),
  );

  if (hadBom) {
    context.issues.push(makeIssue("normalized-bom"));
    context.decisions.push("Removed a UTF-8 byte-order mark before parsing.");
  }

  if (lineEndings === "crlf" || lineEndings === "mixed") {
    context.issues.push(makeIssue("normalized-line-endings"));
    context.decisions.push("Normalized Windows-style or mixed line endings.");
  }

  if (decodedAs === "windows-1252") {
    context.issues.push(makeIssue("decoded-windows-1252"));
    context.decisions.push(
      "Decoded the file as Windows-1252 after UTF-8 parsing failed.",
    );
  }

  const errors: Array<{ error: number; offset: number; length: number }> = [];
  const candidate = parseJsonc(normalizedText, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (hasTrailingCommaRepair(normalizedText)) {
    context.issues.push(makeIssue("tolerated-json-trailing-comma"));
    context.decisions.push(
      "Accepted trailing commas from a hand-edited JSON file.",
    );
  }

  if (errors.length > 0) {
    const firstError = errors[0];
    const location = describeOffset(normalizedText, firstError.offset);
    return fail(
      "invalid-json-syntax",
      `This file stops being valid JSON near line ${location.line}, column ${location.column}.`,
      "The project text looks truncated or syntactically broken.",
      "Re-export the project or fix the JSON syntax before importing.",
      [makeIssue("invalid-json-syntax")],
    );
  }

  return buildProjectFromCandidate(candidate, context);
}

function buildProjectFromCandidate(
  candidate: unknown,
  context: ImportContext,
): ImportResult {
  const canonicalProject = projectSchema.safeParse(candidate);
  if (
    canonicalProject.success &&
    canonicalProject.data.schemaVersion === CANONICAL_SCHEMA_VERSION
  ) {
    return {
      ok: true,
      project: canonicalProject.data,
    };
  }

  if (Array.isArray(candidate)) {
    context.issues.push(makeIssue("wrapped-track-array"));
    context.decisions.push("Promoted a top-level track array into a project.");
    return buildProjectFromCandidate(
      {
        id: "imported-track-array",
        title: "Imported track list",
        bpm: 120,
        updatedAt: DEFAULT_UPDATED_AT,
        tracks: candidate,
      },
      context,
    );
  }

  const parsed = safeObject(candidate);

  if (!parsed) {
    return fail(
      "invalid-project-shape",
      "This file does not describe a project.",
      "Meshtrack expected a JSON object or track list, but the input shape does not match a project.",
      "Export from Meshtrack or provide a project-like JSON object with tracks.",
    );
  }

  const { projectCandidate, sourceKind, extensions } = unwrapProjectCandidate(
    parsed,
    context,
  );
  context.sourceKind = sourceKind;

  const title = coerceString(
    projectCandidate.title ??
      projectCandidate.name ??
      projectCandidate.projectName,
    "Imported sketch",
  );
  const bpm = normalizeBpm(
    projectCandidate.bpm ?? projectCandidate.tempo,
    context,
  );
  const updatedAt = normalizeUpdatedAt(projectCandidate.updatedAt);
  const quantizeEnabled = normalizeBoolean(
    projectCandidate.quantizeEnabled,
    false,
    context,
  );
  const scaleRoot = normalizeScaleRoot(projectCandidate.scaleRoot);
  const scaleMode = normalizeScaleMode(projectCandidate.scaleMode);
  const rawTracks = readTrackCandidates(projectCandidate, context);

  if (rawTracks.length === 0) {
    return fail(
      "missing-tracks",
      "Meshtrack could not find any track data in this file.",
      "The JSON object parsed correctly, but it does not contain an obvious track list or sequencer pattern.",
      "Provide a project object with `tracks`, or a single track-like object with `pattern` or `steps`.",
      [makeIssue("missing-tracks")],
    );
  }

  const normalizedTracks = rawTracks
    .map((track, index) => normalizeTrack(track, index, context))
    .filter((track): track is Track => Boolean(track));

  if (normalizedTracks.length === 0) {
    return fail(
      "missing-tracks",
      "Meshtrack found track candidates, but none could be normalized safely.",
      "Every track candidate was missing critical fields such as pattern data.",
      "Check that each track has a usable `pattern`, `steps`, or `sequence` field.",
      [makeIssue("missing-tracks")],
    );
  }

  const dedupedTracks = deduplicateTrackIds(normalizedTracks, context);

  if (
    extensions ||
    dedupedTracks.some(
      (track) => track.extensions && Object.keys(track.extensions).length > 0,
    )
  ) {
    context.issues.push(makeIssue("preserved-unknown-fields"));
    context.decisions.push(
      "Preserved unknown metadata under canonical `extensions` fields.",
    );
  }

  if (dedupedTracks.length > LARGE_PROJECT_TRACK_COUNT) {
    context.issues.push(makeIssue("large-project"));
    context.decisions.push(
      `Imported a larger project with ${dedupedTracks.length} tracks.`,
    );
  }

  const importAnalysis = recomputeAnalysis({
    confidence: "high",
    score: 1,
    issues: context.issues,
    decisions: context.decisions,
  });

  const project = projectSchema.parse({
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: normalizeProjectId(projectCandidate.id, title),
    title,
    bpm,
    quantizeEnabled,
    scaleRoot,
    scaleMode,
    updatedAt,
    tracks: dedupedTracks,
    provenance: {
      source: context.source,
      sourceKind: context.sourceKind,
      sourceFingerprint: context.sourceFingerprint,
      lineEndings: context.lineEndings,
      hadBom: context.hadBom,
      normalizationVersion: NORMALIZATION_VERSION,
      deterministicExport: true,
      issueCodes: unique(context.issues.map((issue) => issue.code)),
      warningCount: context.issues.filter((issue) => issue.severity !== "info")
        .length,
    },
    importAnalysis,
    extensions,
  });

  return {
    ok: true,
    project,
  };
}

function unwrapProjectCandidate(
  candidate: JsonRecord,
  context: ImportContext,
): {
  projectCandidate: JsonRecord;
  sourceKind: string;
  extensions: Record<string, unknown> | undefined;
} {
  if (Array.isArray(candidate.tracks)) {
    return {
      projectCandidate: candidate,
      sourceKind: "project-object",
      extensions: extractUnknownFields(candidate, knownProjectKeys),
    };
  }

  if (safeObject(candidate.project)) {
    context.issues.push(makeIssue("unwrapped-project"));
    context.decisions.push("Unwrapped a nested `project` object.");

    return {
      projectCandidate: candidate.project as JsonRecord,
      sourceKind: "wrapped-project",
      extensions: {
        ...(extractUnknownFields(candidate, ["project"]) ?? {}),
        wrapper: "project",
      },
    };
  }

  if (Array.isArray(candidate.sequenceTracks)) {
    context.issues.push(makeIssue("inferred-track-list-key"));
    context.decisions.push("Used `sequenceTracks` as the track list.");

    return {
      projectCandidate: {
        ...candidate,
        tracks: candidate.sequenceTracks,
      },
      sourceKind: "project-object",
      extensions: extractUnknownFields(candidate, [
        ...knownProjectKeys,
        "sequenceTracks",
      ]),
    };
  }

  if (hasTrackShape(candidate)) {
    context.issues.push(makeIssue("recovered-single-track"));
    context.decisions.push(
      "Promoted a single track-like object into a one-track project.",
    );

    return {
      projectCandidate: {
        id: normalizeProjectId(
          undefined,
          coerceString(candidate.name, "Recovered sketch"),
        ),
        title: coerceString(candidate.name, "Recovered sketch"),
        bpm: candidate.tempo ?? candidate.bpm ?? 120,
        updatedAt: DEFAULT_UPDATED_AT,
        tracks: [candidate],
      },
      sourceKind: "single-track-object",
      extensions: undefined,
    };
  }

  if (Array.isArray(candidate as unknown)) {
    context.issues.push(makeIssue("wrapped-track-array"));
    context.decisions.push("Promoted a top-level track list into a project.");
  }

  return {
    projectCandidate: candidate,
    sourceKind: "project-object",
    extensions: extractUnknownFields(candidate, knownProjectKeys),
  };
}

function readTrackCandidates(
  candidate: JsonRecord,
  context: ImportContext,
): unknown[] {
  if (Array.isArray(candidate.tracks)) {
    return candidate.tracks;
  }

  if (Array.isArray(candidate.sequenceTracks)) {
    context.issues.push(makeIssue("inferred-track-list-key"));
    return candidate.sequenceTracks;
  }

  if (Array.isArray(candidate.rows)) {
    context.issues.push(makeIssue("inferred-track-list-key"));
    return candidate.rows;
  }

  if (hasTrackShape(candidate)) {
    return [candidate];
  }

  return [];
}

function normalizeTrack(
  rawTrack: unknown,
  index: number,
  context: ImportContext,
): Track | null {
  const track = safeObject(rawTrack);
  if (!track) {
    return null;
  }

  const name = coerceString(
    track.name ?? track.title ?? track.label,
    `Track ${index + 1}`,
  ).slice(0, 48);
  const instrument = normalizeInstrument(track, name, context);
  const pattern = normalizePattern(track, context);
  const note = normalizeNote(
    track.note ?? track.pitch ?? track.key,
    instrument,
  );
  const volume = normalizeVolume(track.volume, context);
  const muted = normalizeBoolean(track.muted, false, context);
  const solo = normalizeBoolean(track.solo, false, context);
  const color = normalizeColor(track.color, index);
  const sound = normalizeSound(track.sound, instrument);

  return {
    id: normalizeTrackId(track.id, name, index),
    name,
    color,
    instrument,
    sound,
    note,
    volume,
    muted,
    solo,
    pattern,
    extensions: extractUnknownFields(track, knownTrackKeys),
  };
}

function normalizePattern(
  track: JsonRecord,
  context: ImportContext,
): boolean[] {
  const patternSource =
    track.pattern ??
    track.steps ??
    track.sequence ??
    track.grid ??
    track.triggers;

  if (patternSource !== track.pattern && patternSource !== undefined) {
    context.issues.push(makeIssue("inferred-track-pattern-key"));
  }

  let values: boolean[] = [];

  if (Array.isArray(patternSource)) {
    values = patternSource.map((value) =>
      normalizePatternValue(value, context),
    );
  } else if (typeof patternSource === "string") {
    values = Array.from(patternSource)
      .filter((character) => !/\s/.test(character))
      .map((character) =>
        ["1", "x", "X", "*", "o", "O"].includes(character) ? true : false,
      );
    context.issues.push(makeIssue("parsed-string-pattern"));
  } else if (safeObject(patternSource)) {
    const patternRecord = patternSource as JsonRecord;
    values = Object.keys(patternRecord)
      .sort((left, right) => Number(left) - Number(right))
      .map((key) => normalizePatternValue(patternRecord[key], context));
  }

  if (values.length === STEP_COUNT) {
    return values;
  }

  if (values.length === 8) {
    context.issues.push(makeIssue("expanded-pattern-8-to-16"));
    return values.flatMap((value) => [value, value]);
  }

  if (values.length === 32) {
    context.issues.push(makeIssue("downsampled-pattern-32-to-16"));
    return Array.from({ length: STEP_COUNT }, (_, index) =>
      Boolean(values[index * 2] || values[index * 2 + 1]),
    );
  }

  if (values.length > STEP_COUNT) {
    context.issues.push(makeIssue("trimmed-pattern-to-16"));
    return values.slice(0, STEP_COUNT);
  }

  if (values.length > 0) {
    context.issues.push(makeIssue("padded-pattern-to-16"));
    return [
      ...values,
      ...Array.from({ length: STEP_COUNT - values.length }, () => false),
    ];
  }

  context.issues.push(makeIssue("missing-pattern"));
  return Array.from({ length: STEP_COUNT }, () => false);
}

function normalizePatternValue(
  value: unknown,
  context: ImportContext,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (
      !context.issues.some((issue) => issue.code === "coerced-pattern-value")
    ) {
      context.issues.push(makeIssue("coerced-pattern-value"));
    }
    return value > 0;
  }

  if (typeof value === "string") {
    if (
      !context.issues.some((issue) => issue.code === "coerced-pattern-value")
    ) {
      context.issues.push(makeIssue("coerced-pattern-value"));
    }

    const normalized = value.trim().toLowerCase();
    return ["1", "true", "x", "on", "yes"].includes(normalized);
  }

  return false;
}

function normalizeInstrument(
  track: JsonRecord,
  name: string,
  context: ImportContext,
): Instrument {
  const direct =
    typeof track.instrument === "string" ? track.instrument : track.type;
  if (typeof direct === "string") {
    const normalized = direct.toLowerCase();
    if (isInstrument(normalized)) {
      return normalized;
    }
  }

  const haystack = `${coerceString(track.type, "")} ${name}`.toLowerCase();
  const inferred = inferInstrument(haystack);
  context.issues.push(makeIssue("inferred-track-instrument"));
  return inferred;
}

function normalizeNote(value: unknown, instrument: Instrument): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 8);
  }

  switch (instrument) {
    case "drum":
      return "C2";
    case "bass":
      return "C2";
    case "pad":
      return "C4";
    case "pluck":
      return "E4";
    case "lead":
    default:
      return "G4";
  }
}

function normalizeSound(value: unknown, instrument: Instrument): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 48);
  }

  return SOUND_LIBRARY[instrument][0];
}

function normalizeVolume(value: unknown, context: ImportContext): number {
  const numberValue = coerceNumber(value);

  if (numberValue === null) {
    return -8;
  }

  if (typeof value !== "number") {
    context.issues.push(makeIssue("coerced-number"));
  }

  return Math.min(6, Math.max(-48, Math.round(numberValue)));
}

function normalizeBpm(value: unknown, context: ImportContext): number {
  const numberValue = coerceNumber(value);

  if (numberValue === null) {
    context.issues.push(makeIssue("defaulted-bpm"));
    return 120;
  }

  if (typeof value !== "number") {
    context.issues.push(makeIssue("coerced-number"));
  }

  return Math.min(180, Math.max(60, Math.round(numberValue)));
}

function normalizeBoolean(
  value: unknown,
  fallback: boolean,
  context: ImportContext,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      context.issues.push(makeIssue("coerced-boolean"));
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      context.issues.push(makeIssue("coerced-boolean"));
      return false;
    }
  }

  if (typeof value === "number") {
    context.issues.push(makeIssue("coerced-boolean"));
    return value > 0;
  }

  return fallback;
}

function normalizeColor(value: unknown, index: number): string {
  if (
    typeof value === "string" &&
    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  ) {
    return value;
  }

  return DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function normalizeUpdatedAt(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }

  return DEFAULT_UPDATED_AT;
}

function normalizeScaleRoot(value: unknown): ScaleKey {
  if (
    typeof value === "string" &&
    scaleKeyOptions.includes(value as ScaleKey)
  ) {
    return value as ScaleKey;
  }

  return "C";
}

function normalizeScaleMode(value: unknown): ScaleMode {
  if (
    typeof value === "string" &&
    scaleModeOptions.includes(value as ScaleMode)
  ) {
    return value as ScaleMode;
  }

  return "major";
}

function normalizeProjectId(value: unknown, title: string): string {
  if (typeof value === "string" && value.trim()) {
    return slugify(value.trim(), "project");
  }

  return slugify(title, "project");
}

function normalizeTrackId(value: unknown, name: string, index: number): string {
  if (typeof value === "string" && value.trim()) {
    return slugify(value.trim(), `track-${index + 1}`);
  }

  return slugify(name, `track-${index + 1}`);
}

function deduplicateTrackIds(tracks: Track[], context: ImportContext): Track[] {
  const counts = new Map<string, number>();
  let deduplicated = false;

  return tracks
    .map((track) => {
      const currentCount = counts.get(track.id) ?? 0;
      counts.set(track.id, currentCount + 1);

      if (currentCount === 0) {
        return track;
      }

      deduplicated = true;
      return {
        ...track,
        id: `${track.id}-${currentCount + 1}`,
      };
    })
    .map((track, index, allTracks) => {
      if (index === allTracks.length - 1 && deduplicated) {
        context.issues.push(makeIssue("deduplicated-track-id"));
        context.decisions.push(
          "Rewrote duplicate track IDs so each track can be edited independently.",
        );
      }
      return track;
    });
}

function recomputeAnalysis(analysis: ImportAnalysis): ImportAnalysis {
  const uniqueIssues = uniqueByCode(analysis.issues);
  const score = Math.max(
    0,
    1 -
      uniqueIssues.reduce((total, issue) => {
        switch (issue.severity) {
          case "info":
            return total + 0.03;
          case "warning":
            return total + 0.1;
          case "error":
            return total + 0.25;
        }
      }, 0),
  );

  const confidence = score >= 0.85 ? "high" : score >= 0.6 ? "medium" : "low";

  return {
    confidence,
    score: Number(score.toFixed(2)),
    issues: uniqueIssues,
    decisions: unique(analysis.decisions),
  };
}

function buildProvenance(
  project: StudioProject,
  source: ProjectSource,
  sourceKind: string,
  hadBom: boolean,
  lineEndings: LineEndingKind,
  sourceFingerprint: string,
) {
  return {
    source,
    sourceKind,
    sourceFingerprint,
    lineEndings,
    hadBom,
    normalizationVersion: NORMALIZATION_VERSION,
    deterministicExport: true as const,
    issueCodes: unique(
      project.importAnalysis?.issues.map((issue) => issue.code) ?? [],
    ),
    warningCount:
      project.importAnalysis?.issues.filter(
        (issue) => issue.severity !== "info",
      ).length ?? 0,
  };
}

function detectSourceKind(project: StudioProject): string {
  return project.provenance?.sourceKind ?? "project-object";
}

function createContext(
  source: ProjectSource,
  sourceKind: string,
  hadBom: boolean,
  lineEndings: LineEndingKind,
  sourceFingerprint: string,
): ImportContext {
  return {
    source,
    issues: [],
    decisions: [],
    sourceKind,
    hadBom,
    lineEndings,
    sourceFingerprint,
  };
}

function fail(
  code: string,
  message: string,
  why: string,
  nextStep: string,
  issues: ImportIssue[] = [makeIssue(code)],
): ImportFailure {
  return {
    ok: false,
    code,
    message,
    why,
    nextStep,
    issues,
  };
}

function makeIssue(code: string): ImportIssue {
  switch (code) {
    case "normalized-bom":
      return issue(
        code,
        "info",
        "Removed an invisible UTF-8 BOM.",
        "Some editors prefix JSON files with a byte-order mark that strict parsers reject.",
        "No action needed.",
      );
    case "normalized-line-endings":
      return issue(
        code,
        "info",
        "Normalized Windows-style line endings.",
        "The file used CRLF or mixed newlines, which can make parsing and hashing inconsistent.",
        "No action needed.",
      );
    case "tolerated-json-trailing-comma":
      return issue(
        code,
        "warning",
        "Accepted trailing commas in the JSON file.",
        "The file was hand-edited and included syntax noise that strict JSON rejects.",
        "Meshtrack repaired it for this import. Re-export if you want the file cleaned up.",
      );
    case "coerced-number":
      return issue(
        code,
        "warning",
        "Converted numeric-looking text into numbers.",
        "Spreadsheet exports often turn BPM and volume values into strings.",
        "Verify the imported numbers if the source came from a spreadsheet.",
      );
    case "coerced-boolean":
      return issue(
        code,
        "warning",
        "Converted text or numeric flags into booleans.",
        "Some exports use 0/1 or true/false strings instead of real booleans.",
        "Verify mute and solo states if they matter to this session.",
      );
    case "coerced-pattern-value":
      return issue(
        code,
        "warning",
        "Converted non-boolean pattern values into steps.",
        "This source encoded steps as numbers or text instead of booleans.",
        "Listen once after import to confirm the groove feels right.",
      );
    case "expanded-pattern-8-to-16":
      return issue(
        code,
        "warning",
        "Expanded an 8-step pattern into Meshtrack’s 16-step grid.",
        "The source sequencer used a smaller step count than Meshtrack.",
        "Verify the doubled pattern if the groove feels too dense.",
      );
    case "downsampled-pattern-32-to-16":
      return issue(
        code,
        "warning",
        "Condensed a 32-step pattern into Meshtrack’s 16-step grid.",
        "The source sequencer used a denser grid than Meshtrack’s sketchpad.",
        "Verify accents and syncopation after import.",
      );
    case "trimmed-pattern-to-16":
      return issue(
        code,
        "warning",
        "Trimmed a longer pattern to 16 steps.",
        "Meshtrack’s current sketch grid is 16 steps wide.",
        "Inspect the imported pattern to confirm that the most important steps survived.",
      );
    case "padded-pattern-to-16":
      return issue(
        code,
        "warning",
        "Padded a short pattern with silent steps.",
        "The source pattern was shorter than Meshtrack’s 16-step grid.",
        "Inspect the tail of the pattern if you expected more notes.",
      );
    case "parsed-string-pattern":
      return issue(
        code,
        "warning",
        "Parsed a text pattern into steps.",
        "The source stored trigger data as a compact text string.",
        "Verify the imported rhythm if the source used unusual symbols.",
      );
    case "missing-pattern":
      return issue(
        code,
        "warning",
        "A track had no usable pattern data, so Meshtrack filled it with silence.",
        "The track shape existed, but no `pattern`, `steps`, or equivalent grid was found.",
        "Edit the silent track manually or re-export from the source tool.",
      );
    case "inferred-track-pattern-key":
      return issue(
        code,
        "info",
        "Used a nonstandard pattern field.",
        "The track used `steps`, `sequence`, `grid`, or `triggers` instead of `pattern`.",
        "No action needed unless the rhythm looks wrong.",
      );
    case "inferred-track-instrument":
      return issue(
        code,
        "warning",
        "Inferred an instrument type from the track name or type.",
        "The source did not use one of Meshtrack’s instrument labels.",
        "Verify the synth voice if the imported timbre feels off.",
      );
    case "deduplicated-track-id":
      return issue(
        code,
        "warning",
        "Rewrote duplicate track IDs.",
        "Duplicate IDs cause edits to hit multiple tracks at once.",
        "No action needed. Meshtrack made the IDs unique.",
      );
    case "unwrapped-project":
      return issue(
        code,
        "info",
        "Unwrapped a nested project object.",
        "The import was wrapped in another object, often by sync tools or API payloads.",
        "No action needed.",
      );
    case "preserved-unknown-fields":
      return issue(
        code,
        "info",
        "Preserved extra metadata under `extensions`.",
        "The source included fields Meshtrack does not edit directly.",
        "No action needed. Exported projects will keep that metadata.",
      );
    case "large-project":
      return issue(
        code,
        "info",
        "Imported a large project.",
        "This project has more than 8 tracks, which is larger than the original Phase 1 demo assumptions.",
        "Scroll and verify the whole arrangement after import.",
      );
    case "empty-input":
      return issue(
        code,
        "error",
        "The input file was empty.",
        "There was nothing to parse.",
        "Import a Meshtrack export or a project-like JSON document.",
      );
    case "invalid-json-syntax":
      return issue(
        code,
        "error",
        "The file is not valid JSON.",
        "The payload is truncated or syntactically broken.",
        "Re-export the source file or repair the JSON syntax.",
      );
    case "missing-tracks":
      return issue(
        code,
        "error",
        "No track data could be found.",
        "The file parsed, but Meshtrack could not identify a usable track list or sequencer pattern.",
        "Provide a project object with tracks or a single track-like object.",
      );
    case "defaulted-bpm":
      return issue(
        code,
        "warning",
        "Defaulted the tempo to 120 BPM.",
        "The source did not provide a usable BPM or tempo field.",
        "Adjust the tempo slider if the groove plays back at the wrong speed.",
      );
    case "decoded-windows-1252":
      return issue(
        code,
        "warning",
        "Decoded the file using Windows-1252.",
        "The byte stream did not behave like valid UTF-8.",
        "Check any accented characters if the file came from a very old export path.",
      );
    case "recovered-single-track":
      return issue(
        code,
        "warning",
        "Recovered a single track into a one-track project.",
        "The input looked like one track instead of a full project document.",
        "Add more tracks manually if this was meant to be a bigger session.",
      );
    case "inferred-track-list-key":
      return issue(
        code,
        "info",
        "Used a nonstandard track-list field.",
        "The project used a track array key other than `tracks`.",
        "No action needed unless the wrong rows were imported.",
      );
    case "wrapped-track-array":
      return issue(
        code,
        "warning",
        "Promoted a top-level track list into a project.",
        "The input was a list of tracks without project metadata.",
        "Review the generated project title and BPM after import.",
      );
    case "invalid-project-shape":
      return issue(
        code,
        "error",
        "The input shape does not look like a project.",
        "Meshtrack could not map the JSON structure to tracks and transport settings.",
        "Import a Meshtrack export or a project-like JSON object.",
      );
    default:
      return issue(
        code,
        "warning",
        "Meshtrack applied a compatibility repair.",
        "The source data did not exactly match Meshtrack’s canonical schema.",
        "Review the import details and verify the result.",
      );
  }
}

function issue(
  code: string,
  severity: ImportIssue["severity"],
  message: string,
  why: string,
  nextStep: string,
): ImportIssue {
  return {
    code,
    severity,
    message,
    why,
    nextStep,
    fixApplied: severity !== "error",
  };
}

function safeObject(candidate: unknown): JsonRecord | null {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  return candidate as JsonRecord;
}

function hasTrackShape(candidate: JsonRecord): boolean {
  return (
    "pattern" in candidate ||
    "steps" in candidate ||
    "sequence" in candidate ||
    "grid" in candidate ||
    "triggers" in candidate
  );
}

function coerceString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const normalized = value.replace(/[,\s]+/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function inferInstrument(value: string): Instrument {
  if (/(kick|snare|hat|clap|perc|drum)/.test(value)) {
    return "drum";
  }
  if (/(bass|sub)/.test(value)) {
    return "bass";
  }
  if (/(pad|chord|wash)/.test(value)) {
    return "pad";
  }
  if (/(pluck|arp)/.test(value)) {
    return "pluck";
  }
  return "lead";
}

function isInstrument(value: string): value is Instrument {
  return ["lead", "bass", "pad", "pluck", "drum"].includes(value);
}

function extractUnknownFields(
  source: JsonRecord,
  knownKeys: readonly string[],
): Record<string, unknown> | undefined {
  const extras = Object.fromEntries(
    Object.entries(source).filter(([key]) => !knownKeys.includes(key)),
  );

  if (Object.keys(extras).length === 0) {
    return undefined;
  }

  return extras;
}

function slugify(value: string, fallback: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || fallback;
}

function fingerprintString(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

function detectLineEndings(value: string): LineEndingKind {
  const hasCrLf = /\r\n/.test(value);
  const hasBareLf = /(^|[^\r])\n/.test(value);
  if (hasCrLf && hasBareLf) {
    return "mixed";
  }
  if (hasCrLf) {
    return "crlf";
  }
  if (hasBareLf) {
    return "lf";
  }
  return "none";
}

function hasTrailingCommaRepair(value: string): boolean {
  return /,\s*[\]}]/.test(value);
}

function describeOffset(
  value: string,
  offset: number,
): { line: number; column: number } {
  const lines = value.slice(0, offset).split("\n");
  return {
    line: lines.length,
    column: lines.at(-1)?.length ?? 0,
  };
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueByCode(issues: ImportIssue[]): ImportIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    if (seen.has(issue.code)) {
      return false;
    }
    seen.add(issue.code);
    return true;
  });
}

const knownProjectKeys = [
  "schemaVersion",
  "id",
  "title",
  "name",
  "projectName",
  "bpm",
  "tempo",
  "quantizeEnabled",
  "scaleRoot",
  "scaleMode",
  "updatedAt",
  "tracks",
  "sequenceTracks",
  "rows",
  "project",
  "extensions",
  "provenance",
  "importAnalysis",
] as const;

const knownTrackKeys = [
  "id",
  "name",
  "title",
  "label",
  "color",
  "instrument",
  "type",
  "sound",
  "note",
  "pitch",
  "key",
  "volume",
  "muted",
  "solo",
  "pattern",
  "steps",
  "sequence",
  "grid",
  "triggers",
  "extensions",
] as const;
