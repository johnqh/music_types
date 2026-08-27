/**
 * The two display lenses, composed.
 *
 * The composition order is the thing under test: the bracket applies in every
 * mode, the transposition only in written mode, and the bracket goes on first
 * so a transposing instrument's bracket moves with the staff rather than
 * against it. Each is invisible on inspection and wrong by exactly an octave
 * or exactly an instrument's interval.
 */
import { describe, expect, it } from "vitest";
import type { NoteEvent, Score } from "../../index.js";
import { isNoteEvent } from "../../index.js";
import { twinkleScore } from "../../test/fixtures.js";
import { toggleOttavaCommand } from "../commands/note-marks.js";
import { displayScore } from "./display-score.js";
import { ottavaScore } from "./ottava.js";
import { writtenScore } from "./written-pitch.js";

function notes(score: Score): NoteEvent[] {
  return score.tracks[0].measures
    .flatMap((m) => m.voices.flatMap((v) => v.events))
    .filter(isNoteEvent)
    .sort((a, b) => a.startTick - b.startTick);
}

function bracketed(): Score {
  const score = twinkleScore();
  const ids = notes(score)
    .slice(0, 3)
    .map((n) => n.id);
  return toggleOttavaCommand(ids, "8va", "Ottava").execute(score);
}

describe("displayScore", () => {
  it("returns the identical object when neither lens applies", () => {
    // Concert pitch, no bracket: a renderer's layout cache must not be
    // invalidated by a score that neither lens touches, which is almost every
    // score.
    const score = twinkleScore();
    expect(displayScore(score, "concert")).toBe(score);
  });

  it("applies the bracket in concert mode", () => {
    const score = bracketed();
    expect(displayScore(score, "concert")).toEqual(ottavaScore(score));
  });

  it("applies the bracket in written mode too", () => {
    // Unlike an instrument's transposition, a bracket is part of the notation
    // rather than a way of reading it, so it is not conditional on the mode.
    const score = bracketed();
    expect(displayScore(score, "written")).toEqual(
      writtenScore(ottavaScore(score)),
    );
  });

  it("puts the bracket on before the transposition, not after", () => {
    // The inverse composition is the plausible wrong answer, and differs only
    // for a transposing instrument inside a bracket.
    const score = bracketed();
    expect(displayScore(score, "written")).not.toBe(
      ottavaScore(writtenScore(score)),
    );
  });

  it("defaults to concert pitch", () => {
    const score = bracketed();
    expect(displayScore(score)).toEqual(displayScore(score, "concert"));
  });
});
