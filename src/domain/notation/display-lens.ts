/**
 * Undoing the display lenses, so what is stored is what will sound.
 *
 * Pure model work despite being reached from a pointer: it takes a pitch and
 * answers a pitch, and knows nothing about coordinates. It lived beside the
 * hit-testing in the app for that reason alone, which made it a rule a second
 * app would have had to rediscover — and getting it wrong is invisible, since
 * the note then draws exactly where it was clicked and only sounds wrong.
 */
import type { Pitch, Score, UUID } from "../../index.js";
import { soundingPitchForTrack } from "../../index.js";
import { ottavaShiftAt } from "../../index.js";

/**
 * Turns a pitch read off the *drawn* staff into the pitch to store.
 *
 * `pitchAtStavePoint` answers in the coordinate space the notation is drawn
 * in, and that space has been through up to two display lenses:
 * `ottavaScore` moves bracketed noteheads to where they are written, and
 * `writtenScore` transposes a transposing instrument into its written key.
 * The model stores **sounding** pitch, so writing a clicked position straight
 * back in stores whatever was on screen as though it were the sound.
 *
 * That was silently wrong in two ways. A click inside an `8va` stored the note
 * an octave from where it will sound — in *every* mode, since a bracket is
 * part of the notation rather than a way of reading it — and a click on a
 * transposing part in written mode stored it by that instrument's interval
 * (a whole tone on a B-flat clarinet).
 *
 * The lenses are undone in the reverse of the order they were applied:
 * `displayScore` is `writtenScore(ottavaScore(score))`, so the transposition
 * comes off first and the bracket second.
 */
export function soundingPitchForDrawn(
  score: Score,
  trackId: UUID,
  tick: number,
  drawn: Pitch,
  pitchDisplay: "concert" | "written",
): Pitch {
  const track = score.tracks.find((t) => t.id === trackId);
  if (!track) return drawn;

  // The **sounding** key, which is what is stored — `soundingPitchForTrack`
  // reads the key the note will sound in, not the one it is drawn in.
  const measure = track.measures.find(
    (m) => tick >= m.startTick && tick < m.startTick + m.durationTicks,
  );
  // Same fallback the inspector uses: a measure carries the key in force.
  const key = measure?.keySignature ?? { fifths: 0, mode: "major" };

  const untransposed =
    pitchDisplay === "written"
      ? soundingPitchForTrack(drawn, track, key)
      : drawn;

  // `ottavaScore` draws at `octave - shift`, so the inverse adds it back.
  const shift = ottavaShiftAt(score, trackId, tick);
  return shift === 0
    ? untransposed
    : { ...untransposed, octave: untransposed.octave + shift };
}
