/**
 * The score as drawn, rather than as stored.
 *
 * The model stores **sounding** pitch. Two display lenses stand between that
 * and the page, and the order they compose in is a rule about music rather
 * than about any one app — so it is declared once, here, beside the two halves
 * it composes, rather than restated by every renderer. A consumer that applies
 * one and forgets the other draws notes that are simply wrong (an octave out
 * inside a bracket, a whole tone out on a B-flat clarinet) while still drawing
 * them exactly where its own hit-testing expects, which is what makes the
 * mistake silent.
 *
 * - `ottavaScore` goes on **first**, and in **every** mode: an `8va` says the
 *   notes were written an octave lower to keep them on the stave, so a bracket
 *   is part of the notation itself rather than a way of reading it.
 * - `writtenScore` goes on **last**, and only in written mode, so a
 *   transposing instrument's bracket moves *with* the staff rather than
 *   against it.
 *
 * Both return their input object untouched when they have nothing to do, so a
 * score with neither comes back by **identity** and a renderer's layout cache
 * is unaffected — which is almost every score.
 *
 * Note entry inverts this, in the reverse order — see `soundingPitchForDrawn`.
 */
import type { Score } from "../../index.js";
import { ottavaScore } from "./ottava.js";
import { writtenScore } from "./written-pitch.js";

/** Which pitch the reader is being shown. Mirrors `ui-slice.pitchDisplay`. */
export type PitchDisplay = "concert" | "written";

export function displayScore(
  score: Score,
  pitchDisplay: PitchDisplay = "concert",
): Score {
  const bracketed = ottavaScore(score);
  return pitchDisplay === "written" ? writtenScore(bracketed) : bracketed;
}
