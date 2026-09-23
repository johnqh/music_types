/**
 * The scan that marks notes an instrument cannot play.
 *
 * Written against a real score rather than a hand-built literal, because what
 * it has to get right is the compass lookup — which track, which program, which
 * gate — and those are exactly what a literal would fake.
 */
import { describe, expect, it } from "vitest";
import {
  createEmptyScore,
  trackRangeIsBinding,
  writtenScore,
} from "../../index";
import type { Score } from "../../index";
import { outOfRangeNoteIds } from "./out-of-range";

/** A one-track score whose first measure holds `pitches`. */
function scoreWith(
  midiProgram: number,
  pitches: Array<{ step: string; octave: number }>,
  clef: "treble" | "bass" | "percussion" = "bass",
): Score {
  const score = createEmptyScore({ title: "S", measures: 2 });
  const track = score.tracks[0];
  const voice = track.measures[0].voices[0];
  return {
    ...score,
    tracks: [
      {
        ...track,
        midiProgram,
        clef,
        name: "Timpani",
        measures: [
          {
            ...track.measures[0],
            voices: [
              {
                ...voice,
                events: pitches.map((pitch, i) => ({
                  id: `n${i}`,
                  pitch: { ...pitch, accidental: 0 },
                  startTick: i * 480,
                  durationTicks: 480,
                  velocity: 80,
                  voiceId: voice.id,
                  trackId: track.id,
                })),
              },
            ],
          },
          ...track.measures.slice(1),
        ],
      },
    ],
  } as Score;
}

describe("outOfRangeNoteIds", () => {
  /*
   * The measured case: a timpani (38-57) written like a bass line. On the
   * project this came from, 482 of 1,067 notes sat below its lowest drum.
   */
  it("names the notes below a timpani's lowest drum", () => {
    const scan = outOfRangeNoteIds(
      scoreWith(47, [
        { step: "G", octave: 1 },
        { step: "D", octave: 2 },
        { step: "A", octave: 1 },
      ]),
    );

    expect(scan.ids).toEqual(["n0", "n2"]);
    expect(scan.byTrack).toHaveLength(1);
    expect(scan.byTrack[0].count).toBe(2);
    expect(scan.byTrack[0].compass).toEqual({ min: 38, max: 57 });
    expect(scan.byTrack[0].midis).toEqual([31, 33]);
  });

  it("says nothing when every note is inside the compass", () => {
    const scan = outOfRangeNoteIds(
      scoreWith(47, [
        { step: "D", octave: 2 },
        { step: "A", octave: 3 },
      ]),
    );
    expect(scan.ids).toEqual([]);
    expect(scan.byTrack).toEqual([]);
  });

  /*
   * The same gate the server applies: refusing a note against a number nobody
   * checked would mark music that is fine.
   */
  it("says nothing about a compass nobody verified", () => {
    // Synth Strings 1 is `basis: "synthetic"` — a placeholder, not a measurement.
    const scan = outOfRangeNoteIds(scoreWith(50, [{ step: "C", octave: 0 }]));
    expect(scan.ids).toEqual([]);
  });

  it("says nothing about a drum track, where a pitch names a drum", () => {
    const scan = outOfRangeNoteIds(
      scoreWith(0, [{ step: "C", octave: 0 }], "percussion"),
    );
    expect(scan.ids).toEqual([]);
  });

  it("has nothing to say about no score", () => {
    expect(outOfRangeNoteIds(null).ids).toEqual([]);
  });

  /*
   * The gate is `trackRangeIsBinding`, which answers TRUE for percussion — a
   * kit has the pieces it has, and for note entry that is the useful answer.
   * The drum skip therefore has to stand on its own, ahead of the gate. This
   * pins that the two really do disagree, so the skip is not quietly deleted
   * as redundant one day.
   */
  it("skips drums even though their range is binding", () => {
    const drums = { clef: "percussion" as const, midiProgram: 0 };
    expect(trackRangeIsBinding(drums)).toBe(true);
    expect(
      outOfRangeNoteIds(scoreWith(0, [{ step: "C", octave: 0 }], "percussion"))
        .ids,
    ).toEqual([]);
  });
});

/*
 * The compass is sounding pitch; the score this package DRAWS may not be.
 *
 * A B-flat clarinet (program 71) sounds 50-94 and is written a tone above what
 * it sounds, so the two readings of the same bar disagree in both directions at
 * once — which is what makes this worth a test rather than a comment.
 */
describe("a transposing instrument", () => {
  /** C3 sounds below the clarinet's lowest note; A6 sits just inside its top. */
  const clarinet = () =>
    scoreWith(
      71,
      [
        { step: "C", octave: 3 }, // sounding 48 — below the compass
        { step: "A", octave: 6 }, // sounding 93 — inside it
      ],
      "treble",
    );

  it("is judged on what it sounds, not on what its player reads", () => {
    const scan = outOfRangeNoteIds(clarinet());
    expect(scan.byTrack[0].compass).toEqual({ min: 50, max: 94 });
    expect(scan.ids).toEqual(["n0"]);
  });

  /*
   * Scanning the drawn score instead would be wrong about BOTH notes: the low
   * one is written up into the compass and would go unmarked, and the high one
   * is written out of the top of it and would be marked though it is fine.
   * Neither mistake looks like a mistake on screen.
   */
  it("would get the opposite answer from the score as drawn", () => {
    const written = writtenScore(clarinet());
    expect(written).not.toBe(clarinet());
    expect(outOfRangeNoteIds(written).ids).toEqual(["n1"]);
  });

  /*
   * Which is survivable only because the answer is a set of ids, and the lens
   * moves pitches without touching them — so the ids from the stored score
   * still name the right noteheads on a staff drawn in written pitch.
   */
  it("names ids the written score still carries", () => {
    const written = writtenScore(clarinet());
    const drawnIds = written.tracks[0].measures[0].voices[0].events.map(
      (event) => event.id,
    );
    for (const id of outOfRangeNoteIds(clarinet()).ids) {
      expect(drawnIds).toContain(id);
    }
  });
});
