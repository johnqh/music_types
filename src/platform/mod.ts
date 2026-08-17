/**
 * A format-neutral model of a tracker module.
 *
 * Was `ModFile`, shaped by exactly what ProTracker stores. That shape does not
 * survive contact with the rest of the family: only MOD uses Amiga periods,
 * only MOD has fixed 64-row patterns, and only MOD lets a sample stand in for
 * an instrument. So the model states what every format agrees on and each
 * decoder normalises its own quirks behind it — which is what keeps
 * `trackerToScore` free of format branches.
 *
 * Decoding stops here deliberately. Turning this into a score is musical work
 * and lives in music_lib; only the byte reading is platform-shaped, and even
 * that is shared by all three `MusicIo` implementations rather than
 * reimplemented per platform.
 */

export type TrackerFormat = 'mod' | 's3m' | 'xm' | 'it' | 'dsm' | 'mptm';

/** One instrument slot. In MOD/S3M/DSM a sample *is* the instrument; XM, IT and MPTM put a layer above. */
export type TrackerInstrument = { index: number; name: string };

/**
 * One channel's cell in one row.
 *
 * `note` is a MIDI note number rather than a period: MOD is the only format
 * that stores periods, so converting in its decoder keeps the approximation
 * that conversion involves in one place instead of leaking into shared code.
 *
 * `effect`/`param` are deliberately absent. Notation import reads exactly one
 * thing from the effect column — speed and tempo — and *which* effect carries
 * it is format knowledge (XM splits `F` at 0x20; S3M and IT use `A` and `T`).
 * Each decoder normalises to `speed`/`bpm`, so nothing downstream branches on
 * format.
 */
export type TrackerCell = {
  /** 0 means "keep whatever this channel was already playing". */
  instrument: number;
  /** MIDI note number, `'off'` for an explicit release or cut, `null` for an empty cell. */
  note: number | 'off' | null;
  /** Ticks per row, where this cell changes it. */
  speed?: number;
  /** Beats per minute, where this cell changes it. */
  bpm?: number;
  /** `Dxx` — this row ends the pattern early. */
  patternBreak?: boolean;
};

export type TrackerModule = {
  format: TrackerFormat;
  title: string;
  channels: number;
  instruments: TrackerInstrument[];
  /** Pattern indices in playback order; a pattern played three times appears three times. */
  order: number[];
  /** `patterns[p][row][channel]`. Row count varies per pattern — MOD is always 64, IT allows 200. */
  patterns: TrackerCell[][][];
};

/**
 * Reading a tracker module.
 *
 * A capability for surface consistency — the app reaches every file format
 * through `getAppServices().io` — even though nothing about parsing is
 * platform-bound. All three implementations delegate to one shared module.
 */
export interface TrackerCodec {
  /** Sniffs the format from the bytes and decodes it. Throws on anything that is not one, rather than returning a garbage module that looks imported. */
  decode(bytes: ArrayBuffer): TrackerModule;
}
