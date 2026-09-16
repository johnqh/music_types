/**
 * Instrument lookups that take a **track**, not a program number.
 *
 * `Track.midiProgram` means one of two different things depending on the
 * track's clef: a General MIDI instrument on a pitched track, a drum kit on a
 * percussion one. Every table in this folder is keyed by program, so reading
 * one without knowing the clef silently answers for the wrong thing — and the
 * wrong answers were not obviously wrong, which is why they shipped:
 *
 * - Brush is kit 40, and program 40 is Violin, so `gmMaxPolyphony` capped a
 *   drum track at two simultaneous notes and the toolbar refused a three-piece
 *   crash-snare-kick hit.
 * - Electronic and TR-808 are kits 24 and 25, and programs 24-25 are guitars,
 *   which are written an octave above where they sound — so in written mode a
 *   TR-808 part was drawn an octave off the staff position for its own drums.
 * - Every kit is some melodic instrument's range, so the on-screen keyboard
 *   offered keys that could not sound a drum and hid the ones that could.
 *
 * These wrappers are the single place that distinction is encoded. Call them
 * instead of the program-keyed tables anywhere a `Track` is in hand.
 */
import type {
  GenerateScoreRequestTrack,
  Score,
  Track,
} from "../../index.js";
import { gmInstrumentRange, type MidiRange } from "./gm-range.js";
import { gmMaxPolyphony, UNLIMITED_POLYPHONY } from "./gm-polyphony.js";
import { gmWrittenTransposition } from "./gm-transposition.js";
import { gmKit, gmKitAt } from "./gm-kit.js";
import { GM_PERCUSSION_RANGE } from "./gm-percussion.js";
import { gmInstrumentIcon, gmKitIcon } from "./gm-icon.js";
import type { InstrumentIconArt } from "./icon-art.js";
import { gmInstrument } from "./gm.js";

/** Whether `track`'s `midiProgram` addresses a drum kit rather than an instrument. */
export function isPercussionTrack(track: Pick<Track, "clef">): boolean {
  return track.clef === "percussion";
}

/**
 * What pressing a key on `track`'s keyboard should sound: a program, and
 * whether it goes to the drum channel.
 *
 * Both keyboards built this inline — `track?.midiProgram ?? 0` beside
 * `track?.clef === 'percussion'` — and both halves are needed, because on a
 * percussion track `midiProgram` names a kit: program 40 is Brush there and
 * Violin anywhere else, and only the flag tells a player which. Two call sites
 * spelling the same pair agree right up until one of them learns a rule the
 * other has not. A percussion address GM defines no kit at is resolved to the
 * kit whose region contains it (`gmKitAt`), which is what playback does, so a
 * key and the part it belongs to cannot sound like different kits.
 *
 * No track — an empty score, or a keyboard shown before a part is chosen —
 * auditions a piano, program 0, which is what both keyboards fell back to.
 * The instrument's *name* is deliberately not here: the player resolves that
 * from the program itself, and a name read off the track would be the one
 * field free to disagree with it.
 */
export function auditionVoiceFor(
  track: Pick<Track, "clef" | "midiProgram"> | null | undefined,
): { program: number; isPercussion: boolean } {
  if (!track) return { program: 0, isPercussion: false };
  if (isPercussionTrack(track))
    return { program: gmKitAt(track.midiProgram).program, isPercussion: true };
  return { program: track.midiProgram, isPercussion: false };
}

/**
 * The notes worth showing for `track` — General MIDI's drum range on a
 * percussion track, the instrument's compass otherwise.
 */
export function trackKeyboardRange(
  track: Pick<Track, "clef" | "midiProgram">,
): MidiRange {
  if (isPercussionTrack(track)) return { ...GM_PERCUSSION_RANGE };
  return gmInstrumentRange(track.midiProgram);
}

/**
 * How many notes `track` can sound at once.
 *
 * Unlimited on a drum track: the limit exists to stop a part being written that
 * nobody could play, and a kit is played with two hands and two feet across
 * pieces that are all struck separately. Nothing about a kit address says
 * otherwise.
 */
export function trackMaxPolyphony(
  track: Pick<Track, "clef" | "midiProgram">,
): number {
  if (isPercussionTrack(track)) return UNLIMITED_POLYPHONY;
  return gmMaxPolyphony(track.midiProgram);
}

/**
 * Semitones between `track`'s sounding and written pitch.
 *
 * Always zero on a drum track. A percussion staff's positions name drums, so
 * transposing one does not move a part into a reader's key — it renames every
 * drum in it.
 */
export function trackWrittenTransposition(
  track: Pick<Track, "clef" | "midiProgram">,
): number {
  if (isPercussionTrack(track)) return 0;
  return gmWrittenTransposition(track.midiProgram);
}

/**
 * `track`'s program, corrected to something its clef can actually mean.
 *
 * On a percussion track that is the kit whose region the address falls in; a
 * MIDI file is free to set program 45 on channel 10, and the kit that resolves
 * to is Brush. Off a percussion track the program is already an instrument and
 * is returned untouched.
 */
export function trackProgramForClef(
  track: Pick<Track, "clef" | "midiProgram">,
): number {
  return isPercussionTrack(track)
    ? gmKitAt(track.midiProgram).program
    : track.midiProgram;
}

/** The icon for `track` — a kit on a percussion track, its instrument's art otherwise. */
export function trackInstrumentIcon(
  track: Pick<Track, "clef" | "midiProgram">,
): InstrumentIconArt {
  return isPercussionTrack(track)
    ? gmKitIcon()
    : gmInstrumentIcon(track.midiProgram);
}

/** What to call `track`'s sound: its kit's name on a percussion track, its instrument's otherwise. */
export function trackInstrumentLabel(
  track: Pick<Track, "clef" | "midiProgram">,
): string {
  if (isPercussionTrack(track)) return gmKitAt(track.midiProgram).name;
  return gmInstrument(track.midiProgram)?.name ?? "Instrument";
}

/**
 * `score` with every percussion track's program resolved to a real kit.
 *
 * A drum track can arrive holding an address no kit sits at: a MIDI file sets
 * whatever program it likes on channel 10, and nothing before this treated that
 * number as a kit at all. The picker would then have to show something the
 * score does not say, so the score is corrected instead of the display fudged.
 *
 * A track already on a kit address is returned untouched — including its
 * `instrumentName`, which is the user's description of a sound that is not
 * changing. Only a track being corrected has its name rewritten, because the
 * old one described a different kit.
 *
 * Returns the **identical object** when nothing needs correcting, which is the
 * usual case: `computeLayout` is cached by score identity, and a fresh object
 * on every load would also read as a change to the autosaver.
 */
export function scoreWithResolvedKits(score: Score): Score {
  const needsWork = score.tracks.some(
    (track) => isPercussionTrack(track) && gmKit(track.midiProgram) === null,
  );
  if (!needsWork) return score;

  return {
    ...score,
    tracks: score.tracks.map((track) => {
      if (!isPercussionTrack(track) || gmKit(track.midiProgram) !== null)
        return track;
      const kit = gmKitAt(track.midiProgram);
      return { ...track, midiProgram: kit.program, instrumentName: kit.name };
    }),
  };
}

/**
 * How a track is described to the generation model.
 *
 * One function for both paths, because the two used to disagree by omission:
 * whole-score generation named each track's instrument, and regeneration named
 * nothing at all — a `ScoreFragment` carries measures and no identity, so
 * "Replace Track" handed the model anonymous bars and let it infer the
 * instrument from the notes. On a kit there is nothing to infer from, since
 * the pitches are drum numbers rather than notes, and the result was a part
 * that treated the kick as a metronome.
 *
 * Polyphony comes from the track's own program through `trackMaxPolyphony`, so
 * a drum track answers about its kit rather than about whatever melodic
 * instrument shares its program number.
 *
 * The compass is deliberately NOT sent. It is a fact about the program, which
 * the server derives for itself from `gm-catalogue.ts` — so there is one answer
 * rather than one per caller, and a caller that forgets to send it cannot leave
 * the model writing against no compass at all. That is what used to happen on
 * the new-score path, which builds its roster from a picker and never called
 * this function: measured on one generated score, a timpani came back with 482
 * of its 1,067 notes below its lowest drum.
 */
export function describeTrackForGeneration(
  track: Track,
): GenerateScoreRequestTrack {
  const polyphony = trackMaxPolyphony(track);
  return {
    name: track.name,
    // `trackInstrumentLabel`, not the stored `instrumentName`: on a drum
    // track the two disagree, because program 16 names the Power kit there
    // and a Drawbar Organ everywhere else. Telling the model it is writing
    // for an organ while handing it the drum map is worse than saying
    // nothing.
    instrumentName: trackInstrumentLabel(track),
    midiProgram: track.midiProgram,
    clef: track.clef,
    // A keyboard's ceiling is `UNLIMITED_POLYPHONY` (Infinity), which is not a
    // number the wire can carry; omitting it says the same thing.
    ...(Number.isFinite(polyphony) ? { maximumPolyphony: polyphony } : {}),
  };
}
