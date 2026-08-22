/**
 * The octave brackets, as a display lens.
 *
 * `8va` means "these notes were written an octave lower to keep them on the
 * stave — play them where the bracket says". The model stores **sounding**
 * pitch, so the bracket is what moves the noteheads, not the sound: this walks
 * a score and shifts every note inside a span to where it should be *drawn*.
 *
 * A lens over the whole score rather than a shift inside the renderer, for the
 * reason `writtenScore` is one: the layout and everything measured from it see
 * the same score, so the drawn note and its staff position agree by
 * construction rather than by two matched calculations.
 *
 * Returns the **identical object** when no bracket exists, so `computeLayout`'s
 * identity cache is untouched by a score that has none — which is almost every
 * score.
 *
 * Note entry inverts this — see `ottavaShiftAt` below, and
 * `soundingPitchForDrawn` in music_app, which undoes both display lenses
 * before storing a clicked position. It used to not: a click inside a bracket
 * stored the drawn pitch as the sounding one, so the note sounded an octave
 * from where it was placed while drawing exactly where it was clicked, which
 * is why it went unnoticed.
 */
import type { NoteEvent, Ottava, Score } from "../../index.js";
import { isNoteEvent } from "../../index.js";

/** How many octaves, and which way, a bracket displaces what is written. */
const OTTAVA_OCTAVES: Record<Ottava, number> = {
  "8va": 1,
  "8vb": -1,
  "15ma": 2,
  "15mb": -2,
};

/** The octave displacement `ottava` asks for, in octaves. */
export function ottavaOctaves(ottava: Ottava): number {
  return OTTAVA_OCTAVES[ottava];
}

/** Whether any note in `score` opens a bracket. */
export function hasOttava(score: Score): boolean {
  return score.tracks.some((track) =>
    track.measures.some((measure) =>
      measure.voices.some((voice) =>
        voice.events.some((e) => isNoteEvent(e) && e.ottavaStart),
      ),
    ),
  );
}

/**
 * `score` with every note inside a bracket moved to where it is written.
 *
 * The shift is the *opposite* of the bracket's displacement: `8va` says the
 * player sounds an octave above the page, so the page shows an octave below
 * the stored sound.
 *
 * Spans are read per voice and in tick order — a bracket opens on one note and
 * closes on a later one in the same line, exactly like a slur — and an
 * unclosed opening runs to the end of its voice rather than being dropped,
 * which is what a reader does with a bracket whose end is missing.
 */
export function ottavaScore(score: Score): Score {
  if (!hasOttava(score)) return score;

  const shifts = octaveShifts(score);
  if (shifts.size === 0) return score;

  return {
    ...score,
    tracks: score.tracks.map((track) => ({
      ...track,
      measures: track.measures.map((measure) => ({
        ...measure,
        voices: measure.voices.map((voice) => ({
          ...voice,
          events: voice.events.map((event) => {
            const octaves = isNoteEvent(event)
              ? shifts.get(event.id)
              : undefined;
            if (octaves === undefined) return event;
            const note = event as NoteEvent;
            return {
              ...note,
              pitch: { ...note.pitch, octave: note.pitch.octave - octaves },
            };
          }),
        })),
      })),
    })),
  };
}

/**
 * The bracket in force at `tick`, in octaves — the inverse note entry needs.
 *
 * `octaveShifts` answers for notes that already exist, keyed by id, which is
 * all the *lens* needs. Writing a new note needs the other question: a click
 * lands on a staff position that was drawn through the lens, so turning it
 * back into a sounding pitch means knowing which bracket covers the tick being
 * written at, before any note is there to look up.
 *
 * Walked per voice ordinal like `octaveShifts`, so the two cannot disagree
 * about where a bracket reaches. A bracket stays open through the note
 * carrying `ottavaStop` and is closed for anything after it — the same
 * "closed *after* shifting" rule, so a note written at the closing note's own
 * tick is inside the bracket and one written later is not.
 *
 * Returns 0 when no bracket covers the point, which is almost every call.
 */
export function ottavaShiftAt(
  score: Score,
  trackId: string,
  tick: number,
  voiceIndex = 0,
): number {
  const track = score.tracks.find((t) => t.id === trackId);
  if (!track) return 0;

  const line: NoteEvent[] = [];
  for (const measure of track.measures) {
    const voice = measure.voices[voiceIndex];
    if (!voice) continue;
    for (const event of voice.events) {
      if (isNoteEvent(event)) line.push(event);
    }
  }
  line.sort((a, b) => a.startTick - b.startTick);

  let open: Ottava | null = null;
  for (const note of line) {
    // Strictly after the point: a note written *at* an existing note's tick
    // takes the bracket state that note is under, not the one after it.
    if (note.startTick > tick) break;
    if (!open && note.ottavaStart) open = note.ottavaStart;
    if (open && note.ottavaStop && note.startTick < tick) open = null;
  }
  return open ? OTTAVA_OCTAVES[open] : 0;
}

/**
 * Every note inside a bracket, and how many octaves it is displaced by.
 *
 * Walked per **voice ordinal across measures**, not per measure: a bracket
 * opens on one note and closes on a later one, and the later one is usually in
 * a different bar. The ordinal stands in for "the same line" from bar to bar,
 * which is the convention `trackVoiceChannels` and `joinTiedNotes` already use.
 */
function octaveShifts(score: Score): Map<string, number> {
  const shifts = new Map<string, number>();

  for (const track of score.tracks) {
    const voiceCount = track.measures.reduce(
      (max, m) => Math.max(max, m.voices.length),
      0,
    );

    for (let ordinal = 0; ordinal < voiceCount; ordinal += 1) {
      const line: NoteEvent[] = [];
      for (const measure of track.measures) {
        const voice = measure.voices[ordinal];
        if (!voice) continue;
        for (const event of voice.events) {
          if (isNoteEvent(event)) line.push(event);
        }
      }
      line.sort((a, b) => a.startTick - b.startTick);

      let open: Ottava | null = null;
      for (const note of line) {
        if (!open && note.ottavaStart) open = note.ottavaStart;
        if (open) shifts.set(note.id, OTTAVA_OCTAVES[open]);
        // Closed *after* shifting: the closing note is inside its own bracket.
        if (open && note.ottavaStop) open = null;
      }
    }
  }

  return shifts;
}
