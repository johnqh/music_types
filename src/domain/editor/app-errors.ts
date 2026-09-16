/**
 * The frontend's failure taxonomy (spec §28), as vocabulary.
 *
 * The `AppError` class and `reportError`, which turns any thrown value into a
 * toast, are music_lib's.
 */

/** Stable, machine-readable failure categories (spec §28's list). */
export type AppErrorCode =
  | "midi-import"
  | "midi-export"
  | "musicxml-import"
  | "musicxml-export"
  | "project-load"
  | "project-save"
  | "project-data"
  | "audio-init"
  | "generation"
  | "storage-quota"
  | "rendering"
  | "unsupported-feature"
  | "unknown";

export type AppErrorOptions = {
  code: AppErrorCode;
  /** Shown to the user, verbatim, in a toast — never a raw stack trace or exception class name. */
  userMessage: string;
  /** Technical detail (the original error, Zod issues, ...), logged via `console.debug` only in development. */
  detail?: unknown;
};
