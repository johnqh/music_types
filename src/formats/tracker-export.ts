/**
 * The shapes a tracker export is described in: which formats can be written,
 * what each can hold, and what an export lost.
 *
 * Types and vocabulary only. `TRACKER_LIMITS` (the numbers, anchored to our own
 * decoder) and the exporter itself live in `@sudobility/music_codecs`.
 */
import type { TrackerModule } from "./mod";

/** The formats export can write. A subset of `TrackerFormat`, which import also covers. */
export type WritableTrackerFormat = "mod" | "s3m" | "xm" | "it";

export type TrackerLimits = {
  channels: number;
  instruments: number;
  /** Inclusive MIDI note range this format can express. */
  lowestMidi: number;
  highestMidi: number;
};

export type TrackerExportOptions = {
  format: WritableTrackerFormat;
  /** Rows per quarter note. 4 gives sixteenths and cannot express triplets. */
  rowsPerBeat?: number;
};

/**
 * What an export lost. **Everything lossy is counted, never hidden**: a
 * tracker row grid, a channel count and a three-octave range are all narrower
 * than a score, and the app shows these counts before writing.
 */
export type TrackerFitReport = {
  /** Notes moved into range. */
  clampedNotes: number;
  /** Voices that did not fit the format's channel count. */
  droppedVoices: number;
  /** Notes shorter than one row, lost to the grid. */
  droppedShortNotes: number;
  /** Notes whose start moved to land on a row. */
  quantisedNotes: number;
};

export type TrackerExportResult = {
  module: TrackerModule;
  report: TrackerFitReport;
};

/**
 * What this export actually lost, as a list something can be said about.
 *
 * Each entry names a *kind* of loss. Which kinds exist, and the order a reader
 * should meet them in, is a fact about the format rather than about a dialog —
 * so every app that shows a fit report shows the same four in the same order
 * (`trackerFitLosses` in music_codecs omits the zero counts).
 *
 * The strings are keys, not prose: the count has to pluralise in the reader's
 * own language, which appending an "s" does not do.
 */
export const TRACKER_FIT_LOSSES = [
  "clampedNotes",
  "droppedVoices",
  "droppedShortNotes",
  "quantisedNotes",
] as const satisfies readonly (keyof TrackerFitReport)[];

export type TrackerFitLoss = (typeof TRACKER_FIT_LOSSES)[number];
