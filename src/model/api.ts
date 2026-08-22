/**
 * The project API payloads, the response envelope, and the error codes.
 *
 * `music_api` answers in these shapes and `music_client` parses them, so the
 * two cannot drift as long as both import from here.
 */
import { z } from "zod";
import type { ProjectStatus } from "./generation.js";
import type { Score, UUID } from "./score.js";
import { scoreSchema } from "./schemas.js";
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
 * What a *write* to a project returns: everything but the score.
 *
 * A create or an autosave sends the score and gets the identical bytes back,
 * which no caller has ever read — the writer already holds the score it just
 * sent. On a debounced autosave that echo doubled the cost of every edit, so
 * reads return the score and writes return metadata about it.
 */
export type ProjectSaveResult = Omit<ProjectRecord, "score">;

/**
 * What a status poll returns. Deliberately small: an open editor asks for this
 * every few seconds for the whole session.
 *
 * `parentSnapshotId` rides along because it is the one other field an editor
 * needs while a project is open, and fetching the whole project to read it was
 * the alternative.
 */
/**
 * Who the caller is, from `GET /me`.
 *
 * Exists for `siteAdmin`. The server grants administrators free generation —
 * no quota, no balance check, no charge — and the client has to know, because
 * it does its own courtesy gating on the balance. Without it an administrator
 * is refused by their own UI on a request the server would have accepted.
 */
export type CurrentUser = {
  userId: string;
  email: string | null;
  siteAdmin: boolean;
};

export type ProjectStatusResult = {
  status: ProjectStatus;
  /**
   * A freshness signal, not a timestamp to display. A client compares it with
   * the one its own last write returned; a difference means the server's copy
   * moved under it and must be re-read.
   */
  updatedAt: string;
  lastGenerationError: string | null;
  parentSnapshotId: UUID | null;
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
export type CommunityItem = Omit<PublishedSnapshot, "score">;

/** A snapshot without its score — what the picker lists, so it stays cheap. */
export type SnapshotSummary = Omit<Snapshot, "score" | "uiPrefs">;

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

/**
 * Duplicating is a server-side copy: the score is read and written inside the
 * database and never crosses the wire in either direction.
 */
export type ProjectDuplicateRequest = {
  /** Defaults to "<original name> (copy)". */
  name?: string;
};

export type ProjectListQuery = {
  search?: string;
  sort?: "updatedAt" | "name";
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

export const projectSaveResultSchema = projectSummarySchema.extend({
  uiPrefs: projectUiPrefsSchema.optional(),
  /** Which snapshot the live work descends from, so a new one attaches there. */
  parentSnapshotId: z.string().min(1).nullable().optional(),
});

export const projectRecordSchema = projectSaveResultSchema.extend({
  score: scoreSchema,
});

export const snapshotSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  parentId: z.string().min(1).nullable(),
  name: z.string().min(1),
  createdAt: z.string().min(1),
  // On the summary, not only the full snapshot: publishing state is what the
  // picker badges from, and it is also all a publish response needs to return.
  publicId: z.string().min(1).optional(),
  publisherName: z.string().min(1).optional(),
});

export const snapshotSchema = snapshotSummarySchema.extend({
  score: scoreSchema,
  uiPrefs: projectUiPrefsSchema.optional(),
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
export const communityItemSchema = publishedSnapshotSchema.omit({
  score: true,
});

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

/**
 * Duplicating is a server-side copy. The score never leaves the database, so
 * the request carries only the new name (absent = "<name> (copy)").
 */
export const projectDuplicateRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export const projectListQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.enum(["updatedAt", "name"]).optional(),
});

// ---------------------------------------------------------------------------
// 9. Response envelope + error codes
// ---------------------------------------------------------------------------

export const API_ERROR_CODES = {
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  AI_OUTPUT_INVALID: "AI_OUTPUT_INVALID",
  PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  /**
   * The project is owned by a running generation job and cannot be written.
   * Distinct from a generic failure so a client can tell "busy, try later"
   * from "something broke" — an autosave should quietly stand down, not
   * surface an error.
   */
  PROJECT_GENERATING: "PROJECT_GENERATING",
  /**
   * No transcription service is configured on this deployment.
   *
   * Distinct from a failure so the client can say "this server cannot
   * transcribe audio" and hide the option, rather than reporting a breakage.
   */
  TRANSCRIPTION_UNAVAILABLE: "TRANSCRIPTION_UNAVAILABLE",
  /**
   * The user has no credits left. Distinct from a quota refusal: a quota is a
   * rate limit that lifts on its own, and this does not — it lifts when the
   * user buys more, which is a different thing to tell them.
   */
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

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
export function errorResponse(
  message: string,
  code?: ApiErrorCode,
): ApiResponse<never> {
  return code
    ? { success: false, error: message, code }
    : { success: false, error: message };
}
