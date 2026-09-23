/**
 * The shapes a MIDI import is described in: the read-only summary the import
 * wizard opens with, the options it writes, and what an import returns.
 *
 * Types only. The analysis and the importer that produce and consume them live
 * in `@sudobility/music_codecs`, which decodes MIDI on both sides of the
 * network; the form rules that edit the options live in music_lib. Both apps
 * name these shapes, so they are declared once here.
 */
import type {
  Clef,
  DurationName,
  Score,
  TimeSignature,
} from "../model/score";

// ---- The summary (spec §15) -------------------------------------------------

export type MidiTrackSummary = {
  index: number;
  name: string;
  channel: number;
  program: number;
  instrumentName: string;
  noteCount: number;
  durationSeconds: number;
  /** True when the track's channel is 9 (GM channel 10), the standard percussion channel. */
  isPercussion: boolean;
  /** Mean MIDI note number of the track's notes, or `null` if it has none — used to default a target clef. */
  averageMidi: number | null;
};

export type MidiTempoEventSummary = { tick: number; bpm: number };

export type MidiTimeSignatureSummary = {
  tick: number;
  numerator: number;
  denominator: number;
};

/**
 * The grid a MIDI file's onsets already sit on.
 *
 * Detected rather than assumed: import used to snap every file to a fixed
 * sixteenth grid, which turns an even eighth-note triplet into a limping
 * dotted-sixteenth figure. See `grid-detection.ts` in music_codecs.
 */
export type DetectedGrid = {
  grid: DurationName | null;
  /** Triplet subdivision of `grid` — 2/3 of it, matching `quantize`'s `tripletGrid`. */
  triplet: boolean;
};

/**
 * Read-only summary of a raw MIDI file, for the import wizard (spec §15):
 * per-track name/channel/program/note-count/duration, tempo events, and
 * time signatures, without importing anything into the score model yet.
 */
export type MidiSummary = {
  ppq: number;
  durationSeconds: number;
  tracks: MidiTrackSummary[];
  tempoEvents: MidiTempoEventSummary[];
  timeSignatures: MidiTimeSignatureSummary[];
  /**
   * The grid the file's onsets already sit on, which the wizard opens
   * pre-filled with. Detected rather than assumed so that importing a file
   * written in triplets or swing does not snap it onto a straight grid — see
   * `grid-detection.ts`.
   */
  detectedGrid: DetectedGrid;
};

// ---- The options (spec §15) -------------------------------------------------

export type MidiTrackSelection = {
  sourceIndex: number;
  include: boolean;
  clef: Clef;
  name: string;
};

/**
 * MIDI import wizard options (spec §15): what to include, how to clean up
 * performance timing, and how to lay tracks out on staves.
 * `defaultMidiImportOptions` in music_codecs derives starting values from a
 * `MidiSummary` so the wizard can open pre-filled.
 */
export type MidiImportOptions = {
  trackSelections: MidiTrackSelection[];
  /** Quantization grid value (spec §15's "whole" .. "sixteenth triplet" list); `null` skips start/duration quantization entirely. */
  quantizeGrid: DurationName | null;
  /** Use a triplet subdivision of `quantizeGrid` when quantizing. */
  tripletDetection: boolean;
  /** Notes shorter than this (at 480 ppq) are dropped as accidental/ornamental noise; `1` preserves every representable note. */
  minDurationTicks: number;
  /** Cluster near-simultaneous onsets within a small tolerance onto a shared start tick. */
  mergeNearDuplicates: boolean;
  /** `"extend"` lengthens notes to the sustain-pedal release point; `"ignore"` uses raw note-off timing. */
  sustainPedal: "extend" | "ignore";
  /** Split a single MIDI track into two linked grand-staff tracks ("Piano RH"/"Piano LH") instead of one track on `defaultClefFor`'s guessed clef. */
  pianoStaffSplit: boolean;
  /** MIDI note number at/above which a note is placed on the upper (RH/treble) staff when `pianoStaffSplit` is set. */
  splitPointMidi: number;
  /** Estimate a key signature from the included tracks' notes (Krumhansl-style) instead of defaulting to C major. */
  detectKey: boolean;
};

/**
 * A change to the options: any plain field, and optionally one track's row,
 * addressed by its `sourceIndex` — the track's index in the file, which is
 * what the wizard's rows are keyed by. Position in `trackSelections` is not
 * the same thing once a file has empty tracks.
 */
export type MidiImportPatch = Partial<
  Omit<
    MidiImportOptions,
    "trackSelections" | "splitPointMidi" | "minDurationTicks"
  >
> & {
  /**
   * The two number fields take `null` for a **cleared** field, which is what
   * `parseNumericDraft(text)` answers for empty text.
   *
   * Not `Number(text)`: that reads an emptied field as 0, so clearing the split
   * point to type a new one moved the split to the lowest note there is — the
   * same class of bug as the `|| 60` this replaces, from the other direction.
   */
  splitPointMidi?: number | null;
  minDurationTicks?: number | null;
  track?: Pick<MidiTrackSelection, "sourceIndex"> &
    Partial<Pick<MidiTrackSelection, "include" | "clef">>;
};

// ---- The result -------------------------------------------------------------

export type MidiImportResult = { score: Score; warnings: string[] };

// ---- The measure timeline an import assembles --------------------------------

export type TimeSignatureChange = {
  tick: number;
  timeSignature: TimeSignature;
};

export type MeasureSpan = {
  index: number;
  startTick: number;
  durationTicks: number;
  timeSignature: TimeSignature;
};
