/**
 * Live generation: what a client hears over the WebSocket while a generation
 * job runs, and the one thing it says.
 *
 * The job model (`GenerationJob`) stays as it is — a row the client polls.
 * This is the push channel beside it: `GET /api/v1/jobs/:id/live`, upgraded
 * to a socket. The client's first frame is `auth`; the server sends nothing
 * until it succeeds. Then, in order:
 *
 *   snapshot   — the project's score as the server holds it *now*, with any
 *                partial results already folded in. A late joiner or a
 *                reconnect starts here, which is what makes the stream safe
 *                to drop and pick up again.
 *   fragment*  — one track's measures over a bar range, as a `ScoreFragment`.
 *                The server has already merged it into the stored score with
 *                `replaceFragment`; the client merges the same way.
 *   progress*  — where the job is (which part, which section), for a strip.
 *   heartbeat* — liveness only; no sequence number.
 *   complete | failed | cancelled — exactly one, carrying the final score as
 *                the server stored it, then the socket closes.
 *
 * `seq` is per job and strictly increasing, assigned by the process running
 * the job. A client ignores anything at or below the last `seq` it applied.
 * A snapshot's `seq` is the last one folded into it *or lower*: the same
 * fragment may arrive again after a snapshot that already contains it, which
 * `replaceFragment` makes a no-op — duplicates are allowed, gaps are not.
 *
 * The terminal message's `score` and `updatedAt` are read back from the
 * database after the final write, never taken from memory, so what the client
 * adopts is byte-for-byte what `GET /projects/:id` returns — the equality a
 * test asserts.
 */
import { z } from "zod";
import {
  generationJobSchema,
  generationRecordSchema,
  scoreFragmentSchema,
} from "./generation";
import type { GenerationJob, GenerationRecord } from "./generation";
import type { Score, ScoreFragment } from "./score";
import { scoreSchema } from "./schemas";
import { projectStatusSchema, type ProjectStatus } from "./generation";

// ---------------------------------------------------------------------------
// Vocabularies
// ---------------------------------------------------------------------------

export const LIVE_GENERATION_MESSAGE_TYPES = [
  "snapshot",
  "fragment",
  "progress",
  "heartbeat",
  "complete",
  "failed",
  "cancelled",
  "error",
] as const;
export type LiveGenerationMessageType =
  (typeof LIVE_GENERATION_MESSAGE_TYPES)[number];

/** The unit of work a `progress` message reports on. */
export const LIVE_GENERATION_PROGRESS_STAGES = [
  "plan",
  "part",
  "section",
  "chunk",
] as const;
export type LiveGenerationProgressStage =
  (typeof LIVE_GENERATION_PROGRESS_STAGES)[number];

/**
 * Why the server refused the stream. Closed so a client can decide "retry
 * with a fresh token" against "give up" without matching on prose.
 */
export const LIVE_GENERATION_ERROR_CODES = [
  "unauthorized",
  "forbidden",
  "not-found",
  "bad-message",
] as const;
export type LiveGenerationErrorCode =
  (typeof LIVE_GENERATION_ERROR_CODES)[number];

/**
 * WebSocket close codes. 1000–1011 are the protocol's own; 4000–4999 are the
 * application range, used for refusals so a client can tell "the server said
 * no" (do not reconnect) from "the connection dropped" (do).
 */
export const LIVE_GENERATION_CLOSE_CODES = {
  DONE: 1000,
  GOING_AWAY: 1001,
  INTERNAL: 1011,
  BAD_MESSAGE: 4400,
  UNAUTHORIZED: 4401,
  FORBIDDEN: 4403,
  NOT_FOUND: 4404,
  AUTH_TIMEOUT: 4408,
} as const;

/** How long the server waits for the `auth` frame before closing 4408. */
export const LIVE_GENERATION_AUTH_TIMEOUT_MS = 10_000;
/** The longest the server goes without sending anything on an open stream. */
export const LIVE_GENERATION_HEARTBEAT_MS = 20_000;

// ---------------------------------------------------------------------------
// Client -> server
// ---------------------------------------------------------------------------

/**
 * The client's frames. `auth` is the first, and the only one required: a
 * browser cannot set headers on a WebSocket handshake, so the bearer token
 * travels in-band. `ping` is answered with a `heartbeat`.
 */
export type LiveGenerationClientMessage =
  | { type: "auth"; token: string }
  | { type: "ping" };

export const liveGenerationClientMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("auth"), token: z.string().min(1) }),
  z.object({ type: z.literal("ping") }),
]);

// ---------------------------------------------------------------------------
// Server -> client
// ---------------------------------------------------------------------------

export type LiveGenerationProgress = {
  stage: LiveGenerationProgressStage;
  /** Human-readable: the part's name, the section's name. */
  label: string;
  done: number;
  total: number;
};

/**
 * The stream is the PROJECT's, not a job's. A project is busy (`generating`,
 * `transcribing`) or `ready`; the socket is open for as long as it is busy
 * and closes with one terminal message the moment it is ready again. The
 * job, when there is one, rides along for its kind and its error — a
 * transcription has none, so `job` is nullable throughout.
 */
export type LiveGenerationMessage =
  | {
      type: "snapshot";
      seq: number;
      /** The project's status as of the snapshot — busy, or already ready. */
      status: ProjectStatus;
      job: GenerationJob | null;
      score: Score;
      updatedAt: string;
    }
  | { type: "fragment"; seq: number; fragment: ScoreFragment }
  | ({ type: "progress"; seq: number } & LiveGenerationProgress)
  | { type: "heartbeat" }
  | {
      type: "complete";
      seq: number;
      job: GenerationJob | null;
      score: Score;
      updatedAt: string;
      /** What was asked and chosen, for a "Generate again" panel. */
      lastGeneration?: GenerationRecord;
    }
  | {
      type: "failed";
      seq: number;
      job: GenerationJob | null;
      score: Score;
      updatedAt: string;
      /** Why, when the job's own row cannot say — a transcription has no job. */
      error?: string;
    }
  | {
      type: "cancelled";
      seq: number;
      job: GenerationJob | null;
      score: Score;
      updatedAt: string;
    }
  | { type: "error"; code: LiveGenerationErrorCode; message: string };

const seqSchema = z.number().int().nonnegative();

const finalSchema = {
  seq: seqSchema,
  job: generationJobSchema.nullable(),
  score: scoreSchema,
  updatedAt: z.string(),
};

export const liveGenerationMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("snapshot"),
    status: projectStatusSchema,
    ...finalSchema,
  }),
  z.object({
    type: z.literal("fragment"),
    seq: seqSchema,
    fragment: scoreFragmentSchema,
  }),
  z.object({
    type: z.literal("progress"),
    seq: seqSchema,
    stage: z.enum(LIVE_GENERATION_PROGRESS_STAGES),
    label: z.string(),
    done: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  z.object({ type: z.literal("heartbeat") }),
  z.object({
    type: z.literal("complete"),
    ...finalSchema,
    lastGeneration: generationRecordSchema.optional(),
  }),
  z.object({
    type: z.literal("failed"),
    ...finalSchema,
    error: z.string().optional(),
  }),
  z.object({ type: z.literal("cancelled"), ...finalSchema }),
  z.object({
    type: z.literal("error"),
    code: z.enum(LIVE_GENERATION_ERROR_CODES),
    message: z.string(),
  }),
]);

/**
 * Validates a decoded frame and returns the ORIGINAL object, not zod's copy.
 *
 * `parse` would hand back a value with every unknown key stripped, and the
 * score a client adopts from `complete` has to equal what `GET /projects/:id`
 * returns byte for byte — a stripped copy is one that has quietly diverged
 * the first time the score model gains a field the schema is behind on.
 * Throws the `ZodError` on an invalid frame.
 */
export function parseLiveGenerationMessage(json: unknown): LiveGenerationMessage {
  const result = liveGenerationMessageSchema.safeParse(json);
  if (!result.success) throw result.error;
  return json as LiveGenerationMessage;
}

/** The messages after which the server closes the socket. */
export function isTerminalLiveGenerationMessage(
  message: LiveGenerationMessage,
): boolean {
  return (
    message.type === "complete" ||
    message.type === "failed" ||
    message.type === "cancelled" ||
    message.type === "error"
  );
}
