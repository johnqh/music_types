/**
 * A neutral model of an Amiga tracker module, shaped by exactly what the
 * `.MOD` importer in music_lib reads — so that music_lib carries no byte
 * handling of its own, the same split `MidiFile` uses.
 *
 * Decoding stops at this shape deliberately. Turning periods into pitches and
 * speed/tempo into a `TempoMap` is musical work, so it lives in music_lib;
 * only the byte reading is platform-shaped, and even that is shared by all
 * three `MusicIo` implementations rather than reimplemented per platform.
 */

/** A sampled instrument slot. Names are free text and often decorative or empty. */
export type ModSample = { index: number; name: string };

/**
 * One channel's cell in one row.
 *
 * `period` is the Amiga period value, not a pitch: 0 means "no note here",
 * which is why this is not an optional field. `sample` is 0 for "keep
 * whatever this channel was already playing".
 */
export type ModCell = { sample: number; period: number; effect: number; param: number };

export type ModFile = {
  title: string;
  channels: number;
  samples: ModSample[];
  /** Pattern indices in playback order; a pattern played three times appears three times. */
  order: number[];
  /** `patterns[pattern][row][channel]`. */
  patterns: ModCell[][][];
};

/**
 * Reading a `.MOD` file.
 *
 * A capability for surface consistency — the app reaches every file format
 * through `getAppServices().io` — even though nothing about parsing is
 * platform-bound. All three implementations delegate to one shared module.
 */
export interface ModCodec {
  /** Decode a ProTracker module. Throws on anything that is not one, rather than returning a garbage file that looks imported. */
  decode(bytes: ArrayBuffer): ModFile;
}
