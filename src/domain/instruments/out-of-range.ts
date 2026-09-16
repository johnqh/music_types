/**
 * Notes an instrument cannot play, found in a score that already holds them.
 *
 * Here, beside `trackRangeIsBinding`, because two apps draw this score and its
 * inspector, and "which notes are out of range, and why" having two answers is
 * how the native app came to light nothing at all during playback. It is a pure
 * question about the model — no geometry and no colour — so it belongs with the
 * compass it reads rather than with the renderer that colours the answer.
 *
 * The compass lives in one place — `gm-catalogue.ts`, reached through
 * `trackKeyboardRange` — and three of the four surfaces that care already read
 * it: the keyboard shows exactly that span, generation now states it in the
 * prompt, and `inspect.ts` judges a generated part against it. The notation is
 * the exception, by design: it draws what the score holds, because a score is
 * not only ever a generated one.
 *
 * That is the disagreement a reader actually meets. A timpani part written a
 * fifth below its lowest drum draws perfectly well on the stave and cannot
 * light a single key on the keyboard — measured on one project, 482 of 1,067
 * notes. Nothing here rewrites those notes: they are marked, and moving them
 * by an octave is a musical decision that belongs to the person reading, not
 * to a scan.
 *
 * Gated on `trackRangeIsBinding`, the same condition the server applies, so the
 * page and the server cannot disagree about what counts as out of range. A
 * compass nobody verified marks nothing.
 *
 * ## Sounding pitch, and so the STORED score
 *
 * Every number in `gm-catalogue.ts` is sounding pitch, and `midiIsInRange` is
 * documented as taking one. The score this package *draws* is not: the app
 * hands `render` a `displayScore(score, pitchDisplay)`, which in written mode
 * has moved a B-flat clarinet up a tone and, in every mode, has moved an
 * `8va`'s noteheads down an octave. Scanning that would place a clarinet's
 * whole part a tone above where it sounds and mark the top of it wrongly.
 *
 * So this takes the **stored** score — the one the app holds, before the
 * lenses — and the result stays correct in either display mode because it is
 * expressed as event **ids**, which both lenses preserve: `transposeEvents`
 * and `ottavaScore` spread `...event` and replace only `pitch`. The renderer
 * colours by id, so "which notes" survives a transposition that changes what
 * those notes look like. `out-of-range.test.ts` pins that with a clarinet.
 */
import { isNoteEvent, type Score } from "../../model/score.js";
import { pitchToMidi } from "../pitch/pitch.js";
import type { MidiRange } from "./gm-range.js";
import { midiIsInRange, trackRangeIsBinding } from "./range-fit.js";
import { isPercussionTrack, trackKeyboardRange } from "./track-instrument.js";

export type OutOfRangeTrack = {
  trackId: string;
  name: string;
  /** What the instrument can play. */
  compass: MidiRange;
  /** How many notes fall outside it. */
  count: number;
  /** The distinct pitches that do, lowest first. */
  midis: number[];
};

export type OutOfRangeScan = {
  /** Every offending note id, for the notation's colours. */
  ids: string[];
  /** One entry per track that has any, for the inspector's sentence. */
  byTrack: OutOfRangeTrack[];
};

const EMPTY: OutOfRangeScan = { ids: [], byTrack: [] };

/**
 * Every note `score` holds that its own instrument cannot play.
 *
 * `score` is the **stored** score — sounding pitch, before `displayScore`. Do
 * not pass the score handed to `render`; see this module's doc for why, and
 * why the ids come back usable in either display mode anyway.
 */
export function outOfRangeNoteIds(score: Score | null): OutOfRangeScan {
  if (!score) return EMPTY;
  const ids: string[] = [];
  const byTrack: OutOfRangeTrack[] = [];

  for (const track of score.tracks) {
    /*
     * A drum pitch names a drum rather than a place in a compass, so this test
     * comes FIRST and is not folded into the gate below it.
     *
     * `trackRangeIsBinding` answers **true** for percussion on purpose — a kit
     * has the pieces it has, which is the right answer for note entry and for
     * generation, where refusing an address no drum sits at is a service. It is
     * the wrong answer here: `percussion.ts` already handles a drum outside
     * `GM_PERCUSSION_RANGE` by parking it on the middle line as `UNMAPPED`, and
     * colouring it as well would be two marks for one fact.
     */
    if (isPercussionTrack(track)) continue;
    if (!trackRangeIsBinding(track)) continue;

    const compass = trackKeyboardRange(track);
    const midis = new Set<number>();
    let count = 0;

    for (const measure of track.measures) {
      for (const voice of measure.voices) {
        for (const event of voice.events) {
          if (!isNoteEvent(event)) continue;
          const midi = pitchToMidi(event.pitch);
          if (midiIsInRange(midi, compass)) continue;
          ids.push(event.id);
          midis.add(midi);
          count += 1;
        }
      }
    }

    if (count > 0) {
      byTrack.push({
        trackId: track.id,
        name: track.name,
        compass,
        count,
        midis: [...midis].sort((a, b) => a - b),
      });
    }
  }

  return ids.length > 0 ? { ids, byTrack } : EMPTY;
}
