/**
 * Deciding whether a note fits an instrument.
 *
 * The compass itself comes from `trackKeyboardRange` — this module is the
 * shared vocabulary everything else uses to act on it, so that "is this note
 * playable" is answered the same way by generation, validation, the score
 * sheet, note entry and the keyboard. Before this existed the answer was
 * computed five times: the keyboard drew one range, the prompt described a
 * second (or none at all), the validator warned against a third, and the
 * renderer knew about none of them, which is how a timpani part came back with
 * notes the on-screen keyboard had no keys for.
 *
 * All of these numbers are SOUNDING pitch, matching `gm-catalogue.ts`. Convert
 * written pitch to sounding before asking (see `soundingPitchForTrack`).
 *
 * There is deliberately no "fold it into range" here. Moving a note by octaves
 * to make it fit was tried and rejected: it rewrites music somebody may have
 * chosen, and an octave displacement in a bass line is audible. What every
 * consumer does instead is say so — the prompt states the compass before a note
 * is written, the validator warns, the notation marks the note, and note entry
 * refuses it outright.
 */
import type { Track } from "../../index";
import { gmRangeIsBinding } from "./gm-catalogue";
import type { MidiRange } from "./gm-range";
import { isPercussionTrack } from "./track-instrument";

/** Whether `midi` is inside `range`, which is inclusive at both ends. */
export function midiIsInRange(midi: number, range: MidiRange): boolean {
  return midi >= range.min && midi <= range.max;
}

/**
 * Whether `track`'s range is firm enough to refuse a note against.
 *
 * A catalogue row marked `assumed`, `tunable`, `synthetic` or `unpitched` is a
 * plausible span rather than a measured one, and refusing music against a guess
 * is worse than letting it through — `gm-catalogue.ts` says so in its own doc.
 * Percussion is always binding: a kit has the pieces it has.
 */
export function trackRangeIsBinding(
  track: Pick<Track, "clef" | "midiProgram">,
): boolean {
  if (isPercussionTrack(track)) return true;
  return gmRangeIsBinding(track.midiProgram);
}
