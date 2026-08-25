/**
 * How far a General MIDI program's written pitch sits from its sounding pitch.
 *
 * A transposing instrument is written in a key other than the one it sounds: a
 * B♭ trumpet reads a tone above what comes out, so concert C is written D.
 * This is a property of the instrument, not a preference — hand a clarinettist
 * a part at concert pitch and every note is wrong.
 *
 * Curated like `gm-range.ts` and `gm-polyphony.ts`: a default with overrides
 * for the programs that actually transpose. Most do not, so the table below is
 * only the exceptions.
 */

/** Semitones to ADD to sounding pitch to get written pitch. */
import { gmSpec } from "./gm-catalogue.js";

/**
 * Semitones to add to `program`'s sounding pitch to get its written pitch.
 *
 * `0` for anything written where it sounds, and for any program outside
 * 0-127: an unknown instrument is left alone rather than moved by a guess,
 * which would be a silently wrong part.
 */
export function gmWrittenTransposition(program: number): number {
  return gmSpec(program)?.writtenTransposition ?? 0;
}

/** Whether `program` is written anywhere other than where it sounds. */
export function gmIsTransposing(program: number): boolean {
  return gmWrittenTransposition(program) !== 0;
}
