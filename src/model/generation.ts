/**
 * The AI generation contracts, and the schemas that validate them.
 *
 * The request and result shapes `music_api` and the app agree on. Both sides
 * import these, which is the whole reason this package exists.
 */
import { z } from "zod";
import {
  clefSchema,
  keySignatureSchema,
  measureSchema,
  scoreSchema,
  timeSignatureSchema,
} from "./schemas.js";
import type {
  Score,
  ScoreFragment,
  KeySignature,
  ScoreRange,
  TimeSignature,
  Track,
  UUID,
} from "./score.js";
// ---------------------------------------------------------------------------
// 5. AI generation contracts
// ---------------------------------------------------------------------------

export type GenerateScoreRequestTrack = {
  name: string;
  instrumentName: string;
  midiProgram: number;
  clef: Track["clef"];
  range?: { lowestMidi: number; highestMidi: number };
  maximumPolyphony?: number;
};

/**
 * The generation backends a client may choose between.
 *
 * A closed vocabulary declared as an array with the type read off it, because a
 * TypeScript union has no runtime form and the picker needs to enumerate these.
 * The *names* are shared; which model each one resolves to is the server's
 * business, and deliberately not stated here — that mapping changes with
 * configuration, and a copy of it in the client would be wrong the first time
 * it did.
 *
 * `default` is what every ordinary request uses. The others exist so the same
 * brief can be run through two backends and compared by ear, which became worth
 * doing once the provider was a configuration change rather than a code change.
 */
export const GENERATION_VARIANTS = ["default", "deepseek", "weak"] as const;
export type GenerationVariant = (typeof GENERATION_VARIANTS)[number];

/**
 * What to call each one in a picker.
 *
 * A `Record` keyed by the vocabulary, never a parallel array: a record fails to
 * compile when a variant is added, where an array would silently go on offering
 * the old set.
 */
export const GENERATION_VARIANT_LABELS: Record<GenerationVariant, string> = {
  default: "Default",
  deepseek: "DeepSeek",
  weak: "Cheap model",
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
  complexity?: "simple" | "moderate" | "complex";
  /**
   * Which generation backend to use, for comparing one against another.
   *
   * A *name*, not an address: the server maps it through its own allow-list to
   * a model and endpoint, so a client can pick from what is offered and cannot
   * point generation at anything else. An unknown or absent value means the
   * default backend, which is what every ordinary request sends.
   *
   * This exists because the provider is now a configuration change rather than
   * a code change, and the only honest way to choose between two of them is to
   * run the same brief through both and listen.
   */
  variant?: string;
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
  allowedPitchRangeByTrack?: Record<
    string,
    { lowestMidi: number; highestMidi: number }
  >;
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
  /**
   * Who is playing each track of `selectedFragment`, in the same order.
   *
   * A fragment carries measures and nothing else — no name, no clef, no
   * program — so without this the model regenerates blind and has to guess the
   * instrument from the notes in front of it. On a drum track there is nothing
   * to guess from: the pitches are drum numbers, and a model that does not
   * know that writes a melody on a kit. (Measured on a real "Replace Track"
   * over a Power Kit: the kick landed on every eighth of all 118 bars at one
   * velocity, because the model was never told it was writing for a kit.)
   *
   * Optional because a client that predates it still gets a valid request;
   * the prompt simply omits what it was not given.
   */
  tracks?: GenerateScoreRequestTrack[];
  /**
   * The tracks that are NOT being regenerated, over the same span.
   *
   * "Write a part that works with the piano" cannot be obeyed by a model that
   * has never been shown the piano. `selectedFragment` holds only the tracks
   * being rewritten, and the preceding/following contexts are *earlier and
   * later bars*, not *other parts of the same bars* — so regenerating one
   * track of an arrangement showed the model an empty stave and asked it to
   * harmonise with nothing. It answered with something plausible in C major
   * that had no relationship to the music it was joining.
   *
   * `tracks` and `fragment` are matched by position, like the roster above.
   * The model must not write these; they are there to be listened to.
   */
  accompaniment?: {
    tracks: GenerateScoreRequestTrack[];
    fragment: ScoreFragment;
  };
  /** Same three dials whole-score generation has; the prompt builder emits them identically. */
  style?: string;
  mood?: string;
  complexity?: "simple" | "moderate" | "complex";
};

export type RegenerationCandidate = {
  id: string;
  label: string;
  fragment: ScoreFragment;
};

export type RegenerateRegionResult = {
  candidates: RegenerationCandidate[];
  warnings: string[];
};

export interface MusicGenerationProvider {
  id: string;
  name: string;
  generateScore(
    request: GenerateScoreRequest,
    signal?: AbortSignal,
  ): Promise<GenerateScoreResult>;
  regenerateRegion(
    request: RegenerateRegionRequest,
    signal?: AbortSignal,
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
  tracks: z.array(
    z.object({ trackId: z.string().min(1), measures: z.array(measureSchema) }),
  ),
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
  complexity: z.enum(["simple", "moderate", "complex"]).optional(),
  // A free string on the wire, resolved against the server's allow-list rather
  // than trusted: see `GenerateScoreRequest.variant`.
  variant: z.string().optional(),
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
  tracks: z.array(generateScoreRequestTrackSchema).optional(),
  accompaniment: z
    .object({
      tracks: z.array(generateScoreRequestTrackSchema),
      fragment: scoreFragmentSchema,
    })
    .optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  complexity: z.enum(["simple", "moderate", "complex"]).optional(),
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
/**
 * What currently owns a project.
 *
 * `generating` and `transcribing` both mean "a job is producing this project's
 * music, and writes must be refused until it lands" — they are distinct so the
 * editor can say which is happening, since one takes seconds of model time and
 * the other minutes of audio.
 */
export type ProjectStatus = "ready" | "generating" | "transcribing";

export const projectStatusSchema = z.enum([
  "ready",
  "generating",
  "transcribing",
]);

/** Which of the five generation entry points produced a job. */
export type GenerationJobKind =
  | "generate-score"
  | "generate-track"
  | "replace-notes"
  | "replace-measures"
  | "replace-track";

export const generationJobKindSchema = z.enum([
  "generate-score",
  "generate-track",
  "replace-notes",
  "replace-measures",
  "replace-track",
]);

/**
 * A job's own lifecycle, which is richer than its project's: `cancelled`
 * records that a result was produced and thrown away, which `ready` on the
 * project cannot express.
 */
/**
 * `queued` is a job waiting its turn: a user's generations run one at a time, so
 * a job accepted while another is running waits rather than being refused. Its
 * project is already `generating` — the request is built against the stored
 * score, so that score must not move underneath it while it waits.
 */
export type GenerationJobStatus =
  "queued" | "running" | "done" | "failed" | "cancelled";

export const generationJobStatusSchema = z.enum([
  "queued",
  "running",
  "done",
  "failed",
  "cancelled",
]);

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
  /** Absent when the job never reached the model, or the stream reported no usage. */
  usage?: TokenUsage;
};

/**
 * What one generation job cost the provider.
 *
 * Lives here rather than in music_api because the client sees it: `GET /jobs/:id`
 * carries it, and the app has no other way to report what a generation used.
 *
 * There is deliberately no `totalTokens` — it is the sum of the other two, and a
 * stored derivable value is a chance for them to disagree. `model` is present
 * because tokens only become money per-model and the model is env-configurable,
 * so a total without it cannot be priced afterwards.
 */
export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  model: string;
};

export const tokenUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative(),
  model: z.string().min(1),
});

export const generationJobSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  kind: generationJobKindSchema,
  status: generationJobStatusSchema,
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
  error: z.string().nullable(),
  usage: tokenUsageSchema.optional(),
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
export function parseRegenerateRegionRequest(
  json: unknown,
): RegenerateRegionRequest {
  return regenerateRegionRequestSchema.parse(json) as RegenerateRegionRequest;
}

/** Parses and validates untrusted JSON as a `RegenerateRegionResult`. Throws `ZodError` on invalid input. */
export function parseRegenerateRegionResult(
  json: unknown,
): RegenerateRegionResult {
  return regenerateRegionResultSchema.parse(json) as RegenerateRegionResult;
}

/** Parses and validates untrusted JSON as a `RegenerationCandidate`. Throws `ZodError` on invalid input. */
export function parseRegenerationCandidate(
  json: unknown,
): RegenerationCandidate {
  return regenerationCandidateSchema.parse(json) as RegenerationCandidate;
}
