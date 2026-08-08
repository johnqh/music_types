/**
 * @sudobility/music_types — types and Zod schemas for the ScoreSmith music family.
 *
 * Single sectioned entry point (sudojo_types convention):
 *   1. Score model types (spec §4 of the ScoreSmith spec)
 *   2. Type guards
 *   3. Selection / fragment types
 *   4. Zod schemas for the score tree
 *   5. AI generation contracts (requests, results, provider interface)
 *   6. Zod schemas for the generation contracts
 *   7. Project API types (music_api payloads)
 *   8. Zod schemas for the project API
 *   9. Response envelope + error codes
 *
 * This package contains types, schemas, and pure helpers only — no domain
 * logic (tick math, factories, commands live in @sudobility/music_lib).
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 1. Score model types
// ---------------------------------------------------------------------------

export type UUID = string;

export type Fraction = { numerator: number; denominator: number };

export type PitchStep = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/** -2 = double flat, -1 = flat, 0 = natural, 1 = sharp, 2 = double sharp. */
export type Accidental = -2 | -1 | 0 | 1 | 2;

export type Pitch = { step: PitchStep; accidental: Accidental; octave: number };

export type TimeSignature = { numerator: number; denominator: number };

export type KeySignature = { fifths: number; mode: 'major' | 'minor' };

export type TempoEvent = { id: UUID; tick: number; bpm: number };

/**
 * Renderable note-duration names: base values (whole down to thirty-second),
 * their dotted (1.5x) variants, and their triplet (2/3x) variants.
 */
export type DurationName =
  | 'whole'
  | 'half'
  | 'quarter'
  | 'eighth'
  | 'sixteenth'
  | 'thirtysecond'
  | 'dotted-whole'
  | 'dotted-half'
  | 'dotted-quarter'
  | 'dotted-eighth'
  | 'dotted-sixteenth'
  | 'dotted-thirtysecond'
  | 'triplet-whole'
  | 'triplet-half'
  | 'triplet-quarter'
  | 'triplet-eighth'
  | 'triplet-sixteenth'
  | 'triplet-thirtysecond';

export type Articulation = 'staccato' | 'accent' | 'tenuto' | 'marcato';

export type Clef = 'treble' | 'bass' | 'alto' | 'tenor' | 'percussion';

export type NoteEvent = {
  id: UUID;
  pitch: Pitch;
  startTick: number;
  durationTicks: number;
  velocity: number;
  voiceId: UUID;
  trackId: UUID;
  tieStart?: boolean;
  tieStop?: boolean;
  articulation?: Articulation;
};

export type RestEvent = {
  id: UUID;
  startTick: number;
  durationTicks: number;
  voiceId: UUID;
  trackId: UUID;
};

export type MusicalEvent = NoteEvent | RestEvent;

export type Voice = { id: UUID; name: string; events: MusicalEvent[] };

/**
 * Small-print notes from another instrument, printed in the bar before a long
 * entry so the player knows where they are.
 *
 * Print-only and derived (see `measureCues` in music_lib). Deliberately not
 * part of `Measure.voices`: a cue is not the player's music, and keeping it
 * out is what lets playback, export, selection and note-counting stay correct
 * without learning to skip it.
 */
export type MeasureCue = {
  /** Which instrument this is, e.g. "Flute". Drawn above the notes. */
  label: string;
  /** The cued bar's notes. Never sounded, never selectable. */
  events: MusicalEvent[];
};

export type Measure = {
  id: UUID;
  index: number;
  startTick: number;
  durationTicks: number;
  timeSignature: TimeSignature;
  keySignature: KeySignature;
  voices: Voice[];
  /**
   * How many measures of silence this one stands for, when it is a
   * multi-measure rest. Absent for an ordinary measure.
   *
   * Only ever set on a derived, print-only part (see `extractPart` in
   * music_lib). A stored score always writes its rests out in full, because
   * collapsing loses which bar is which — and the editor needs every bar.
   */
  multiMeasureRestCount?: number;
  /**
   * Rehearsal mark shown above this measure, e.g. "B".
   *
   * Print-only and derived (see `rehearsalMarks` in music_lib): a stored score
   * carries none, and the editor never shows them, because a mark you cannot
   * move would be a control that looks editable and is not.
   */
  rehearsalMark?: string;
  /** Cue notes printed in this measure. Print-only. */
  cue?: MeasureCue;
};

export type Track = {
  id: UUID;
  name: string;
  instrumentName: string;
  midiProgram: number;
  midiChannel: number;
  clef: Clef;
  volume: number;
  pan: number;
  muted: boolean;
  solo: boolean;
  measures: Measure[];
};

export type ScoreMetadata = {
  title: string;
  composer?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Score = {
  id: UUID;
  version: number;
  ppq: number;
  metadata: ScoreMetadata;
  tempoMap: TempoEvent[];
  tracks: Track[];
};

// ---------------------------------------------------------------------------
// 2. Type guards
// ---------------------------------------------------------------------------

/** True for `NoteEvent`s (distinguished from `RestEvent` by the `pitch` property). */
export function isNoteEvent(event: MusicalEvent): event is NoteEvent {
  return 'pitch' in event;
}

/** True for `RestEvent`s (distinguished from `NoteEvent` by lacking a `pitch` property). */
export function isRestEvent(event: MusicalEvent): event is RestEvent {
  return !('pitch' in event);
}

// ---------------------------------------------------------------------------
// 3. Selection / fragment types
// ---------------------------------------------------------------------------

/** A tick range scoped to a set of tracks (e.g. a loop region or regeneration target). */
export type ScoreRange = { startTick: number; endTick: number; trackIds: string[] };

export type ScoreSelection = {
  eventIds: string[];
  measureIds: string[];
  trackIds: string[];
  range?: ScoreRange;
};

/** A region of a score extracted for regeneration/preview: measures per track over a range. */
export type ScoreFragment = {
  range: ScoreRange;
  ppq: number;
  tracks: Array<{ trackId: UUID; measures: Measure[] }>;
};

// ---------------------------------------------------------------------------
// 4. Zod schemas for the score tree
// ---------------------------------------------------------------------------
// Runtime constraints: velocity 0-127, midiProgram 0-127, midiChannel 0-15,
// ppq positive int, accidental -2..2, octave -1..9. `noteEventSchema` /
// `restEventSchema` are `.strict()` so an object with a stray `pitch` field
// cannot be silently accepted as a rest (and vice versa); every other schema
// stays permissive to tolerate forward-compatible additions.

export const uuidSchema = z.string().min(1);

export const pitchStepSchema = z.enum(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

export const accidentalSchema = z.union([
  z.literal(-2),
  z.literal(-1),
  z.literal(0),
  z.literal(1),
  z.literal(2),
]);

export const pitchSchema = z.object({
  step: pitchStepSchema,
  accidental: accidentalSchema,
  octave: z.number().int().min(-1).max(9),
});

export const timeSignatureSchema = z.object({
  numerator: z.number().int().positive(),
  denominator: z.number().int().positive(),
});

export const keySignatureSchema = z.object({
  fifths: z.number().int(),
  mode: z.enum(['major', 'minor']),
});

export const tempoEventSchema = z.object({
  id: uuidSchema,
  tick: z.number().int().nonnegative(),
  bpm: z.number().positive(),
});

export const articulationSchema = z.enum(['staccato', 'accent', 'tenuto', 'marcato']);

export const clefSchema = z.enum(['treble', 'bass', 'alto', 'tenor', 'percussion']);

export const noteEventSchema = z
  .object({
    id: uuidSchema,
    pitch: pitchSchema,
    startTick: z.number().int().nonnegative(),
    durationTicks: z.number().int().positive(),
    velocity: z.number().int().min(0).max(127),
    voiceId: uuidSchema,
    trackId: uuidSchema,
    tieStart: z.boolean().optional(),
    tieStop: z.boolean().optional(),
    articulation: articulationSchema.optional(),
  })
  .strict();

export const restEventSchema = z
  .object({
    id: uuidSchema,
    startTick: z.number().int().nonnegative(),
    durationTicks: z.number().int().positive(),
    voiceId: uuidSchema,
    trackId: uuidSchema,
  })
  .strict();

export const musicalEventSchema = z.union([noteEventSchema, restEventSchema]);

export const voiceSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  events: z.array(musicalEventSchema),
});

export const measureSchema = z.object({
  id: uuidSchema,
  index: z.number().int().nonnegative(),
  startTick: z.number().int().nonnegative(),
  durationTicks: z.number().int().positive(),
  timeSignature: timeSignatureSchema,
  keySignature: keySignatureSchema,
  voices: z.array(voiceSchema),
  // Minimum 2, not 1: a count of one is not a multi-measure rest, and
  // rejecting it here stops a meaningless value reaching the renderer.
  multiMeasureRestCount: z.number().int().min(2).optional(),
  rehearsalMark: z.string().min(1).optional(),
  cue: z
    .object({ label: z.string().min(1), events: z.array(musicalEventSchema) })
    .optional(),
});

export const trackSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  instrumentName: z.string(),
  midiProgram: z.number().int().min(0).max(127),
  midiChannel: z.number().int().min(0).max(15),
  clef: clefSchema,
  volume: z.number(),
  pan: z.number(),
  muted: z.boolean(),
  solo: z.boolean(),
  measures: z.array(measureSchema),
});

export const scoreMetadataSchema = z.object({
  title: z.string(),
  composer: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const scoreSchema = z.object({
  id: uuidSchema,
  version: z.number().int().nonnegative(),
  ppq: z.number().int().positive(),
  metadata: scoreMetadataSchema,
  tempoMap: z.array(tempoEventSchema),
  tracks: z.array(trackSchema),
});

/** Parses and validates untrusted JSON as a `Score`. Throws `ZodError` on invalid input. */
export function parseScore(json: unknown): Score {
  return scoreSchema.parse(json) as Score;
}

// ---------------------------------------------------------------------------
// 5. AI generation contracts
// ---------------------------------------------------------------------------

export type GenerateScoreRequestTrack = {
  name: string;
  instrumentName: string;
  midiProgram: number;
  clef: Track['clef'];
  range?: { lowestMidi: number; highestMidi: number };
  maximumPolyphony?: number;
};

export type GenerateScoreRequest = {
  prompt: string;
  title?: string;
  style?: string;
  mood?: string;
  durationMeasures: number;
  tempo?: number;
  timeSignature?: TimeSignature;
  keySignature?: KeySignature;
  tracks: GenerateScoreRequestTrack[];
  complexity?: 'simple' | 'moderate' | 'complex';
};

/** Never a rendered/notation payload and never raw MIDI: always a structured `Score`. */
export type GenerateScoreResult = { score: Score; warnings: string[] };

export type RegenerationConstraints = {
  /**
   * Absent for a region that does not sit on barlines (Replace Notes), where
   * "preserve the measure count" says nothing and only muddies the prompt.
   * Still never `false`: a regeneration that may add or drop measures is not
   * a thing this system asks for.
   */
  preserveMeasureCount?: true;
  preserveTimeSignatures: true;
  preserveTempoEvents: true;
  preserveBoundaryNotes?: boolean;
  preserveHarmony?: boolean;
  preserveRhythm?: boolean;
  preserveMelody?: boolean;
  maximumPolyphony?: number;
  allowedPitchRangeByTrack?: Record<string, { lowestMidi: number; highestMidi: number }>;
};

export type RegenerateRegionRequest = {
  scoreId: string;
  instruction: string;
  range: ScoreRange;
  precedingContext: ScoreFragment;
  selectedFragment: ScoreFragment;
  followingContext: ScoreFragment;
  constraints: RegenerationConstraints;
  candidateCount: number;
  /** Same three dials whole-score generation has; the prompt builder emits them identically. */
  style?: string;
  mood?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
};

export type RegenerationCandidate = { id: string; label: string; fragment: ScoreFragment };

export type RegenerateRegionResult = { candidates: RegenerationCandidate[]; warnings: string[] };

export interface MusicGenerationProvider {
  id: string;
  name: string;
  generateScore(request: GenerateScoreRequest, signal?: AbortSignal): Promise<GenerateScoreResult>;
  regenerateRegion(
    request: RegenerateRegionRequest,
    signal?: AbortSignal
  ): Promise<RegenerateRegionResult>;
}

// ---------------------------------------------------------------------------
// 6. Zod schemas for the generation contracts
// ---------------------------------------------------------------------------

export const midiRangeSchema = z.object({
  lowestMidi: z.number().int().min(0).max(127),
  highestMidi: z.number().int().min(0).max(127),
});

export const scoreRangeSchema = z.object({
  startTick: z.number().int().nonnegative(),
  endTick: z.number().int().nonnegative(),
  trackIds: z.array(z.string().min(1)),
});

export const scoreFragmentSchema = z.object({
  range: scoreRangeSchema,
  ppq: z.number().int().positive(),
  tracks: z.array(z.object({ trackId: z.string().min(1), measures: z.array(measureSchema) })),
});

export const generateScoreRequestTrackSchema = z.object({
  name: z.string(),
  instrumentName: z.string(),
  midiProgram: z.number().int().min(0).max(127),
  clef: clefSchema,
  range: midiRangeSchema.optional(),
  maximumPolyphony: z.number().int().positive().optional(),
});

export const generateScoreRequestSchema = z.object({
  prompt: z.string(),
  title: z.string().optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  durationMeasures: z.number().int().positive(),
  tempo: z.number().positive().optional(),
  timeSignature: timeSignatureSchema.optional(),
  keySignature: keySignatureSchema.optional(),
  tracks: z.array(generateScoreRequestTrackSchema),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export const generateScoreResultSchema = z.object({
  score: scoreSchema,
  warnings: z.array(z.string()),
});

export const regenerationConstraintsSchema = z.object({
  preserveMeasureCount: z.literal(true).optional(),
  preserveTimeSignatures: z.literal(true),
  preserveTempoEvents: z.literal(true),
  preserveBoundaryNotes: z.boolean().optional(),
  preserveHarmony: z.boolean().optional(),
  preserveRhythm: z.boolean().optional(),
  preserveMelody: z.boolean().optional(),
  maximumPolyphony: z.number().int().positive().optional(),
  allowedPitchRangeByTrack: z.record(z.string(), midiRangeSchema).optional(),
});

export const regenerateRegionRequestSchema = z.object({
  scoreId: z.string().min(1),
  instruction: z.string(),
  range: scoreRangeSchema,
  precedingContext: scoreFragmentSchema,
  selectedFragment: scoreFragmentSchema,
  followingContext: scoreFragmentSchema,
  constraints: regenerationConstraintsSchema,
  candidateCount: z.number().int().positive(),
  style: z.string().optional(),
  mood: z.string().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional(),
});

export const regenerationCandidateSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  fragment: scoreFragmentSchema,
});

export const regenerateRegionResultSchema = z.object({
  candidates: z.array(regenerationCandidateSchema),
  warnings: z.array(z.string()),
});

/** Whether a project can be edited right now. Two states, because that is the only question the editor asks. */
export type ProjectStatus = 'ready' | 'generating';

export const projectStatusSchema = z.enum(['ready', 'generating']);

/** Which of the five generation entry points produced a job. */
export type GenerationJobKind =
  | 'generate-score'
  | 'generate-track'
  | 'replace-notes'
  | 'replace-measures'
  | 'replace-track';

export const generationJobKindSchema = z.enum([
  'generate-score',
  'generate-track',
  'replace-notes',
  'replace-measures',
  'replace-track',
]);

/**
 * A job's own lifecycle, which is richer than its project's: `cancelled`
 * records that a result was produced and thrown away, which `ready` on the
 * project cannot express.
 */
export type GenerationJobStatus = 'running' | 'done' | 'failed' | 'cancelled';

export const generationJobStatusSchema = z.enum(['running', 'done', 'failed', 'cancelled']);

/**
 * A job as reported to the client. The stored `request`/`result` payloads are
 * deliberately absent — they are large and the client never needs them.
 */
export type GenerationJob = {
  id: UUID;
  projectId: UUID;
  kind: GenerationJobKind;
  status: GenerationJobStatus;
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
};

export const generationJobSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: generationJobKindSchema,
  status: generationJobStatusSchema,
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
});

/**
 * `request` is the whole provider request, stored verbatim so the job never
 * re-reads the project. Its shape varies by `kind`, so it is unknown here and
 * narrowed by the runner.
 */
export type CreateGenerationJobRequest = {
  projectId: UUID;
  kind: GenerationJobKind;
  request: unknown;
};

export const createGenerationJobRequestSchema = z.object({
  projectId: z.string().min(1),
  kind: generationJobKindSchema,
  request: z.unknown(),
});

/** Parses and validates untrusted JSON as a `GenerateScoreRequest`. Throws `ZodError` on invalid input. */
export function parseGenerateScoreRequest(json: unknown): GenerateScoreRequest {
  return generateScoreRequestSchema.parse(json) as GenerateScoreRequest;
}

/** Parses and validates untrusted JSON as a `GenerateScoreResult`. Throws `ZodError` on invalid input. */
export function parseGenerateScoreResult(json: unknown): GenerateScoreResult {
  return generateScoreResultSchema.parse(json) as GenerateScoreResult;
}

/** Parses and validates untrusted JSON as a `RegenerateRegionRequest`. Throws `ZodError` on invalid input. */
export function parseRegenerateRegionRequest(json: unknown): RegenerateRegionRequest {
  return regenerateRegionRequestSchema.parse(json) as RegenerateRegionRequest;
}

/** Parses and validates untrusted JSON as a `RegenerateRegionResult`. Throws `ZodError` on invalid input. */
export function parseRegenerateRegionResult(json: unknown): RegenerateRegionResult {
  return regenerateRegionResultSchema.parse(json) as RegenerateRegionResult;
}

/** Parses and validates untrusted JSON as a `RegenerationCandidate`. Throws `ZodError` on invalid input. */
export function parseRegenerationCandidate(json: unknown): RegenerationCandidate {
  return regenerationCandidateSchema.parse(json) as RegenerationCandidate;
}

// ---------------------------------------------------------------------------
// 7. Project API types (music_api payloads)
// ---------------------------------------------------------------------------

export type ProjectUiPrefs = {
  zoom: number;
  /**
   * Track ids to draw. **Absent means every track is visible** — a project
   * saved before this field existed, or one that never hid anything, needs no
   * migration and no backfill. An empty array is not a valid value: a blank
   * page is never what anyone meant.
   *
   * Ids naming tracks that no longer exist are ignored on load rather than
   * treated as an error, so hiding a track, deleting it, and undoing the
   * deletion all behave.
   */
  visibleTrackIds?: string[];
};

/** Project list item — everything but the (potentially large) score payload. */
export type ProjectSummary = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
  /** Required, not optional: a project always has a status, and a missing one would read as editable. */
  status: ProjectStatus;
  /** Why the last generation failed, or null. Survives navigating away, which the job row does not. */
  lastGenerationError: string | null;
};

export type ProjectRecord = ProjectSummary & {
  score: Score;
  uiPrefs?: ProjectUiPrefs;
  /** Which snapshot the live work descends from, so a new one attaches there. */
  parentSnapshotId?: UUID | null;
};

/**
 * A project pinned at a moment, which never changes again.
 *
 * Holds its **own full copy** of the score rather than a delta: reconstructing
 * a version by replaying diffs is exactly the thing that quietly stops being
 * reproducible, and immutability is the whole point here.
 */
export type Snapshot = {
  id: UUID;
  projectId: UUID;
  /** The snapshot this one grew from. Null for the first in a project. */
  parentId: UUID | null;
  name: string;
  score: Score;
  uiPrefs?: ProjectUiPrefs;
  /**
   * Set when published; the public URL is /p/<publicId>. Absent when not.
   *
   * Publishing is metadata about *sharing*, not part of the music — which is
   * why it may change on a snapshot that otherwise never does.
   */
  publicId?: string;
  /** Shown on the Community list. Never the account email. */
  publisherName?: string;
  createdAt: string;
};

/** What an anonymous visitor receives. Carries no owner identity, by construction. */
export type PublishedSnapshot = {
  publicId: string;
  name: string;
  publisherName: string;
  score: Score;
  createdAt: string;
};

/** One row of the Community list. No score — the list would be enormous. */
export type CommunityItem = Omit<PublishedSnapshot, 'score'>;

/** A snapshot without its score — what the picker lists, so it stays cheap. */
export type SnapshotSummary = Omit<Snapshot, 'score' | 'uiPrefs'>;

export type ProjectCreateRequest = {
  name: string;
  score: Score;
  uiPrefs?: ProjectUiPrefs;
};

export type ProjectUpdateRequest = {
  name?: string;
  score?: Score;
  uiPrefs?: ProjectUiPrefs;
};

export type ProjectListQuery = {
  search?: string;
  sort?: 'updatedAt' | 'name';
};

// ---------------------------------------------------------------------------
// 8. Zod schemas for the project API
// ---------------------------------------------------------------------------

export const projectUiPrefsSchema = z.object({
  zoom: z.number().positive(),
  visibleTrackIds: z.array(z.string().min(1)).nonempty().optional(),
});

export const projectSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number().int().nonnegative(),
});

export const projectRecordSchema = projectSummarySchema.extend({
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
  /** Which snapshot the live work descends from, so a new one attaches there. */
  parentSnapshotId: z.string().min(1).nullable().optional(),
});

export const snapshotSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  name: z.string().min(1),
  createdAt: z.string().min(1),
});

export const snapshotSchema = snapshotSummarySchema.extend({
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
  publicId: z.string().min(1).optional(),
  publisherName: z.string().min(1).optional(),
});

/** What an anonymous visitor receives. Carries no owner identity, by construction. */
export const publishedSnapshotSchema = z.object({
  publicId: z.string().min(1),
  name: z.string().min(1),
  publisherName: z.string().min(1),
  score: scoreSchema,
  createdAt: z.string().min(1),
});

/** One row of the Community list. No score — the list would be enormous. */
export const communityItemSchema = publishedSnapshotSchema.omit({ score: true });

export const publishRequestSchema = z.object({
  publisherName: z.string().min(1).max(80),
});

export const snapshotCreateRequestSchema = z.object({
  name: z.string().min(1).max(200),
});

export const projectCreateRequestSchema = z.object({
  name: z.string().min(1),
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
});

export const projectUpdateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  score: scoreSchema.optional(),
  uiPrefs: projectUiPrefsSchema.optional(),
});

export const projectListQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['updatedAt', 'name']).optional(),
});

// ---------------------------------------------------------------------------
// 9. Response envelope + error codes
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  AI_OUTPUT_INVALID: 'AI_OUTPUT_INVALID',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  /**
   * The project is owned by a running generation job and cannot be written.
   * Distinct from a generic failure so a client can tell "busy, try later"
   * from "something broke" — an autosave should quietly stand down, not
   * surface an error.
   */
  PROJECT_GENERATING: 'PROJECT_GENERATING',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: ApiErrorCode;
};

/** Wraps payload data in the standard success envelope. */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/** Wraps an error message (and optional typed code) in the standard error envelope. */
export function errorResponse(message: string, code?: ApiErrorCode): ApiResponse<never> {
  return code ? { success: false, error: message, code } : { success: false, error: message };
}

// ---------------------------------------------------------------------------
// 10. Platform interfaces (implementations live in @sudobility/music_io)
// ---------------------------------------------------------------------------
export * from './platform/index.js';
