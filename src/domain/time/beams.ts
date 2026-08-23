/**
 * Which notes are beamed together — derived, like the tuplet beside it.
 *
 * A run of eighths under one beat *is* a beam, so the grouping is a fact about
 * the durations rather than something to store: keeping it on the note would
 * let it fall out of step the moment one of them is retimed, deleted or pasted
 * over. What the model does store (`NoteEvent.beam`) is only where the
 * engraver disagrees with the default, and this is where that disagreement is
 * applied.
 *
 * **This exists so the renderer and the MusicXML exporter cannot disagree.**
 * The renderer could always ask VexFlow to group for it, but the exporter
 * cannot: `music_codecs` must not depend on a rendering engine (music_api
 * decodes MusicXML server-side, where there is no VexFlow), and MusicXML has
 * no "break here" — it wants a complete `begin`/`continue`/`end` run, so
 * writing it at all means knowing every group. Two derivations would be two
 * opinions about how a bar is beamed, and the exported file would drift from
 * the drawn page.
 */
import type { MusicalEvent, NoteEvent, TimeSignature } from "../../index.js";
import { isNoteEvent } from "../../index.js";

/** Indices into the events array that are beamed as one group. */
export type BeamGroup = {
  /** Index of the first member in the events array passed in. */
  start: number;
  /** How many consecutive *beamable* members it covers (always 2 or more). */
  indices: number[];
};

/**
 * A note is beamable when it is shorter than a quarter and is not a rest.
 *
 * A quarter has no flag to join, and a rest interrupts a beam rather than
 * joining it — engravers do beam over short rests, but only inside a group
 * that is already established, which is a refinement rather than the rule.
 */
function isBeamable(event: MusicalEvent, quarterTicks: number): boolean {
  return isNoteEvent(event) && event.durationTicks < quarterTicks;
}

/**
 * The beat a beam may not cross, in ticks.
 *
 * Compound time groups by the dotted beat: 6/8 is two groups of three eighths,
 * not three groups of two, and beaming it in twos is the classic way to make
 * a jig unreadable. Detected as "numerator divisible by three, on an eighth or
 * shorter" — 3/8 is deliberately excluded by the `> 3` test, since a single
 * dotted-quarter beat covering the whole bar is simple time in practice.
 */
export function beamBeatTicks(time: TimeSignature, ppq: number): number {
  const unit = (ppq * 4) / time.denominator;
  const compound =
    time.denominator >= 8 && time.numerator % 3 === 0 && time.numerator > 3;
  return compound ? unit * 3 : unit;
}

/**
 * Groups `events` into beams.
 *
 * `measureStartTick` is subtracted from each note's `startTick`, so the beat
 * boundaries are measured from the start of the bar rather than the start of
 * the piece — a bar 40 quarters in would otherwise land its beats wherever the
 * arithmetic happened to fall.
 *
 * Groups of one are dropped: a lone eighth draws its flag, and a "beam" over
 * one note is not a beam.
 */
export function beamGroups(
  events: readonly MusicalEvent[],
  measureStartTick: number,
  time: TimeSignature,
  ppq: number,
): BeamGroup[] {
  const quarterTicks = ppq;
  const beatTicks = beamBeatTicks(time, ppq);
  const groups: BeamGroup[] = [];

  let current: number[] = [];
  // Which beat the run currently open sits in, so a note starting in the next
  // one closes it even when nothing else does.
  let currentBeat: number | null = null;
  // Set by a `break`, and it survives until the run closes: inside an explicit
  // group the beat boundary no longer applies, which is the whole point of
  // asking for one.
  let explicit = false;

  const flush = (): void => {
    if (current.length > 1)
      groups.push({ start: current[0], indices: current });
    current = [];
    currentBeat = null;
    explicit = false;
  };

  events.forEach((event, index) => {
    if (!isBeamable(event, quarterTicks)) {
      flush();
      return;
    }
    const note = event as NoteEvent;
    if (note.beam === "none") {
      flush();
      return;
    }

    const beat = Math.floor((note.startTick - measureStartTick) / beatTicks);

    if (note.beam === "break") {
      // A break on the first note of a run has nothing to break: there is no
      // group before it to end. Treating it as "group explicitly from here"
      // instead silently rebeams whole bars as one.
      if (current.length > 0) {
        flush();
        explicit = true;
      }
    } else if (currentBeat !== null && beat !== currentBeat && !explicit) {
      flush();
    }

    if (currentBeat === null) currentBeat = beat;
    current.push(index);
  });
  flush();

  return groups;
}
