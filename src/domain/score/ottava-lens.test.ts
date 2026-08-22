/**
 * The octave bracket as a display lens.
 *
 * The mark says "written an octave away to stay on the stave". The model holds
 * sounding pitch, so the lens is what moves the noteheads — and it must move
 * them the *opposite* way from the bracket, or a reader plays two octaves out.
 */
import { describe, expect, it } from "vitest";
import type { NoteEvent, Ottava, Score } from "../../index.js";
import { isNoteEvent } from "../../index.js";
import { twinkleScore } from "../../test/fixtures.js";
import { toggleOttavaCommand } from "../commands/note-marks.js";
import { hasOttava, ottavaScore, ottavaShiftAt } from "./ottava.js";

function notes(score: Score): NoteEvent[] {
  return score.tracks[0].measures
    .flatMap((m) => m.voices.flatMap((v) => v.events))
    .filter(isNoteEvent)
    .sort((a, b) => a.startTick - b.startTick);
}

function bracketed(kind: Ottava, count = 3): Score {
  const score = twinkleScore();
  const ids = notes(score)
    .slice(0, count)
    .map((n) => n.id);
  return toggleOttavaCommand(ids, kind, "Ottava").execute(score);
}

describe("ottavaScore", () => {
  it("returns the identical object when nothing is bracketed", () => {
    // `computeLayout` is cached by score identity, so a fresh object per
    // render would re-format every VexFlow object on every frame.
    const score = twinkleScore();
    expect(ottavaScore(score)).toBe(score);
    expect(hasOttava(score)).toBe(false);
  });

  it("draws an 8va an octave LOWER than it sounds", () => {
    const marked = bracketed("8va");
    const sounding = notes(marked);
    const drawn = notes(ottavaScore(marked));

    for (let i = 0; i < 3; i += 1) {
      expect(drawn[i].pitch.octave).toBe(sounding[i].pitch.octave - 1);
    }
  });

  it("draws an 8vb an octave higher than it sounds", () => {
    const marked = bracketed("8vb");
    const sounding = notes(marked);
    const drawn = notes(ottavaScore(marked));
    expect(drawn[0].pitch.octave).toBe(sounding[0].pitch.octave + 1);
  });

  it("moves two octaves for a 15ma", () => {
    const marked = bracketed("15ma");
    const sounding = notes(marked);
    const drawn = notes(ottavaScore(marked));
    expect(drawn[0].pitch.octave).toBe(sounding[0].pitch.octave - 2);
  });

  it("leaves notes outside the bracket where they are", () => {
    const marked = bracketed("8va", 3);
    const sounding = notes(marked);
    const drawn = notes(ottavaScore(marked));

    for (let i = 3; i < sounding.length; i += 1) {
      expect(drawn[i].pitch.octave).toBe(sounding[i].pitch.octave);
    }
  });

  it("includes the closing note in its own bracket", () => {
    // The note carrying `ottavaStop` is under the bracket, not after it.
    const marked = bracketed("8va", 3);
    const sounding = notes(marked);
    const drawn = notes(ottavaScore(marked));
    expect(drawn[2].pitch.octave).toBe(sounding[2].pitch.octave - 1);
  });

  it("never changes what a note sounds like", () => {
    // The lens is for drawing only; playback reads the stored score.
    const marked = bracketed("8va");
    expect(notes(marked).map((n) => n.pitch.octave)).toEqual(
      notes(bracketed("8va")).map((n) => n.pitch.octave),
    );
  });
});

describe("ottavaShiftAt", () => {
  it("is 0 on an unbracketed score", () => {
    const score = twinkleScore();
    const trackId = score.tracks[0].id;
    expect(ottavaShiftAt(score, trackId, 0)).toBe(0);
    expect(ottavaShiftAt(score, trackId, 960)).toBe(0);
  });

  it("reports the bracket covering a tick, and 0 past its end", () => {
    // The lens and this must agree about reach, or a note written just inside
    // a bracket lands an octave away from the notes drawn beside it.
    const marked = bracketed("8va", 3);
    const trackId = marked.tracks[0].id;
    const inside = notes(marked).slice(0, 3);
    const after = notes(marked)[3];

    for (const note of inside) {
      expect(ottavaShiftAt(marked, trackId, note.startTick)).toBe(1);
    }
    expect(ottavaShiftAt(marked, trackId, after.startTick)).toBe(0);
  });

  it("agrees with the lens: drawn + shift === sounding", () => {
    // The property the whole fix rests on. `ottavaScore` draws at
    // `octave - shift`, so adding the shift back to a drawn pitch is exactly
    // the inverse — which is what note entry applies to a clicked position.
    const marked = bracketed("8vb", 2);
    const trackId = marked.tracks[0].id;
    const drawn = notes(ottavaScore(marked));
    const sounding = notes(marked);

    drawn.forEach((note, index) => {
      const shift = ottavaShiftAt(marked, trackId, note.startTick);
      expect(note.pitch.octave + shift).toBe(sounding[index].pitch.octave);
    });
  });

  it("answers for a tick with no note on it, between bracketed notes", () => {
    // The case that matters: a click lands on empty staff inside a bracket,
    // where there is no note to look the shift up from.
    const marked = bracketed("15ma", 3);
    const trackId = marked.tracks[0].id;
    const first = notes(marked)[0];
    const second = notes(marked)[1];
    const between = Math.floor((first.startTick + second.startTick) / 2);
    expect(between).toBeGreaterThan(first.startTick);
    expect(ottavaShiftAt(marked, trackId, between)).toBe(2);
  });
});
