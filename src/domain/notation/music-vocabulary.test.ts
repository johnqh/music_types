import { describe, expect, it } from "vitest";
import { twinkleScore } from "../../test/fixtures.js";
import { barNumberAt } from "../score/bar-numbers.js";
import type { Score } from "../../model/score.js";
import {
  accidentalCountLabel,
  barBeatForTick,
  formatBarBeat,
  wholeBarBeat,
  durationLabel,
  keySignatureName,
  keySignatureOptions,
  measuresForSeconds,
  panReadout,
  pitchAtStavePosition,
  tickForBarBeat,
} from "./music-vocabulary.js";

describe("durationLabel", () => {
  it("names every duration, dots and triplets included", () => {
    expect(durationLabel("quarter")).toBe("Quarter");
    expect(durationLabel("dotted-eighth")).toBe("Dotted eighth");
    expect(durationLabel("triplet-quarter")).toBe("Quarter triplet");
  });
});

describe("keySignatureName", () => {
  it("names the major keys by their tonic, not their fifths", () => {
    expect(keySignatureName({ fifths: 0, mode: "major" })).toBe("C major");
    expect(keySignatureName({ fifths: 2, mode: "major" })).toBe("D major");
    expect(keySignatureName({ fifths: -3, mode: "major" })).toBe("E♭ major");
  });

  it("names the minor keys from the relative-minor table", () => {
    // Two sharps is D major *or* B minor; the mode picks the table.
    expect(keySignatureName({ fifths: 2, mode: "minor" })).toBe("B minor");
    expect(keySignatureName({ fifths: 0, mode: "minor" })).toBe("A minor");
  });

  it("falls back rather than inventing a name beyond seven accidentals", () => {
    expect(keySignatureName({ fifths: 9, mode: "major" })).toBe("9 fifths");
  });
});

describe("accidentalCountLabel", () => {
  it("counts sharps and flats, and singularises one of them", () => {
    expect(accidentalCountLabel(0)).toBe("no sharps or flats");
    expect(accidentalCountLabel(1)).toBe("1 sharp");
    expect(accidentalCountLabel(3)).toBe("3 sharps");
    expect(accidentalCountLabel(-1)).toBe("1 flat");
    expect(accidentalCountLabel(-4)).toBe("4 flats");
  });
});

describe("keySignatureOptions", () => {
  it("offers fifteen keys, flats through sharps, in that order", () => {
    const options = keySignatureOptions("major");
    expect(options).toHaveLength(15);
    expect(options[0].fifths).toBe(-7);
    expect(options[14].fifths).toBe(7);
    expect(options.find((o) => o.fifths === 2)?.label).toBe(
      "D major — 2 sharps",
    );
  });
});

/*
 * The readout form, which is not the same as the position.
 *
 * `barBeatForTick` keeps a fraction on purpose — the inspector's position
 * field is editable and a note can sit on beat 2.5. A transport readout must
 * floor it, and when that flooring was left to each app to do inline, one of
 * the two forgot: the web transport printed "1.1.3333333333333333" thirty
 * times a second while React Native, which floored it, was fine.
 */
describe("wholeBarBeat / formatBarBeat", () => {
  it("floors a position between beats to the beat a player counts", () => {
    const score = twinkleScore();
    const between = barBeatForTick(score, score.ppq / 3)!;
    expect(between.beat).toBeGreaterThan(1);
    expect(between.beat).toBeLessThan(2);
    expect(wholeBarBeat(between)).toEqual({ bar: 1, beat: 1 });
  });

  it("leaves a position already on a beat alone", () => {
    const score = twinkleScore();
    expect(wholeBarBeat(barBeatForTick(score, score.ppq))).toEqual({
      bar: 1,
      beat: 2,
    });
  });

  it("renders the readout without a fraction, at every offset in a beat", () => {
    const score = twinkleScore();
    // Every one of these used to render a different long string; a readout
    // that changes on a sub-beat is the flicker this exists to stop.
    for (const offset of [0, 1, 60, 120, 160, 239, 320, 479]) {
      expect(formatBarBeat(barBeatForTick(score, offset))).toBe("1.1");
    }
  });

  it("says so plainly when there is no position", () => {
    expect(wholeBarBeat(null)).toBeNull();
    expect(formatBarBeat(null)).toBe("-.-");
  });
});

describe("barBeatForTick / tickForBarBeat", () => {
  it("counts bars and beats from one, the way a player does", () => {
    const score = twinkleScore();
    expect(barBeatForTick(score, 0)).toEqual({ bar: 1, beat: 1 });
  });

  it("reports a position between beats as a fraction", () => {
    const score = twinkleScore();
    // Half a quarter-note beat into the first bar.
    expect(barBeatForTick(score, score.ppq / 2)).toEqual({ bar: 1, beat: 1.5 });
  });

  it("round-trips a tick through bar/beat and back", () => {
    const score = twinkleScore();
    const tick = score.ppq * 5; // somewhere in bar 2
    const bb = barBeatForTick(score, tick)!;
    expect(tickForBarBeat(score, bb.bar, bb.beat)).toBe(tick);
  });

  it("clamps a beat past the end of its bar rather than failing", () => {
    // "Beat 9" in 4/4 is a typo for the end of the bar, not an error.
    const score = twinkleScore();
    const measure = score.tracks[0].measures[0];
    const tick = tickForBarBeat(score, 1, 9)!;
    expect(tick).toBeLessThan(measure.startTick + measure.durationTicks);
    expect(tick).toBeGreaterThan(measure.startTick);
  });

  it("answers null past the end of the score", () => {
    const score = twinkleScore();
    const last = score.tracks[0].measures.at(-1)!;
    expect(
      barBeatForTick(score, last.startTick + last.durationTicks),
    ).toBeNull();
    expect(tickForBarBeat(score, 999, 1)).toBeNull();
  });
});

describe("pitchAtStavePosition", () => {
  it("puts the treble clef’s landmark notes on their lines", () => {
    // Top line F5, then E5 in the space below, D5 on the next line down.
    expect(pitchAtStavePosition("treble", 0)).toEqual({
      step: "F",
      accidental: 0,
      octave: 5,
    });
    expect(pitchAtStavePosition("treble", 1)).toEqual({
      step: "E",
      accidental: 0,
      octave: 5,
    });
    expect(pitchAtStavePosition("treble", 2)).toEqual({
      step: "D",
      accidental: 0,
      octave: 5,
    });
    // Middle C sits one ledger line below the treble stave: ten positions down.
    expect(pitchAtStavePosition("treble", 10)).toEqual({
      step: "C",
      accidental: 0,
      octave: 4,
    });
  });

  it("puts the bass clef’s landmark notes on their lines", () => {
    expect(pitchAtStavePosition("bass", 0)).toEqual({
      step: "A",
      accidental: 0,
      octave: 3,
    });
    // Middle C is one ledger line *above* the bass stave: two positions up.
    expect(pitchAtStavePosition("bass", -2)).toEqual({
      step: "C",
      accidental: 0,
      octave: 4,
    });
  });

  it("reads ledger positions above the stave", () => {
    expect(pitchAtStavePosition("treble", -1)).toEqual({
      step: "G",
      accidental: 0,
      octave: 5,
    });
  });

  it("names a letter, never an accidental — the key signature decides that", () => {
    for (let position = -6; position <= 16; position++) {
      expect(pitchAtStavePosition("alto", position).accidental).toBe(0);
    }
  });
});

describe("panReadout", () => {
  it("names the side and the distance, not a fraction", () => {
    expect(panReadout(-0.4)).toBe("L40");
    expect(panReadout(0.25)).toBe("R25");
  });

  it("says C at the centre, where there is no side to name", () => {
    // "L0" would be a side, and a centred track is on neither.
    expect(panReadout(0)).toBe("C");
  });

  it("reaches L100 and R100 at the extremes", () => {
    expect(panReadout(-1)).toBe("L100");
    expect(panReadout(1)).toBe("R100");
  });

  it("rounds rather than truncating, so a nudge off centre shows", () => {
    // -0.004 is centred to the nearest percent; -0.006 is not, and a readout
    // that truncated would call both C while the sound differed.
    expect(panReadout(-0.004)).toBe("C");
    expect(panReadout(-0.006)).toBe("L1");
  });
});

describe("barBeatForTick with a pickup", () => {
  /*
    The case that made a second implementation visible.

    `measureBeatAt` in music_editing computed the bar as `measure.index + 1`
    and the web transport used it, so on a score with an anacrusis the transport
    said one bar while the inspector, the gutter and "go to bar N" — all of
    which go through `barNumberAt` — said another. A pickup is not counted, so
    every bar after one is a bar lower than its position.

    That function is gone and this is the only implementation. These pin the
    difference between the two, so a reintroduced `index + 1` fails here.
  */
  function withPickup(): Score {
    const score = twinkleScore();
    return {
      ...score,
      tracks: score.tracks.map((track) => ({
        ...track,
        measures: track.measures.map((measure, index) =>
          index === 0 ? { ...measure, pickup: true } : measure,
        ),
      })),
    };
  }

  it("gives the pickup no number of its own", () => {
    // A player calls it "the pickup", not "bar 1"; 0 is what it reports when
    // it has to report something.
    const score = withPickup();
    expect(barBeatForTick(score, 0)?.bar).toBe(0);
  });

  it("numbers the bar after a pickup as bar 1, not bar 2", () => {
    const score = withPickup();
    const second = score.tracks[0].measures[1];
    expect(barBeatForTick(score, second.startTick)?.bar).toBe(1);
    // And `index + 1` — what the deleted duplicate did — would have said 2.
    expect(second.index + 1).toBe(2);
  });

  it("agrees with barNumberAt, which everything else reads", () => {
    const score = withPickup();
    const measures = score.tracks[0].measures;
    for (const [index, measure] of measures.entries()) {
      expect(barBeatForTick(score, measure.startTick)?.bar).toBe(
        barNumberAt(measures, index) ?? 0,
      );
    }
  });
});

/*
 * A bar is not a unit of time, and treating it as one made a "song" 1:31 long.
 *
 * 32 bars of 4 beats at 84bpm is 91 seconds; the same 32 bars of metal at 152
 * is 50. A bar count fixed across styles produces a different piece of music
 * every time the tempo moves, which is why length is declared in seconds and
 * the bars derived from it.
 */
describe("measuresForSeconds", () => {
  it("gives each tempo the bars it needs for the same duration", () => {
    expect(measuresForSeconds(210, 84, 4)).toBe(72);
    expect(measuresForSeconds(210, 152, 4)).toBe(132);
  });

  it("accounts for the meter, not just the tempo", () => {
    expect(measuresForSeconds(60, 180, 3)).toBe(60);
    expect(measuresForSeconds(60, 180, 4)).toBe(44);
  });

  /*
   * Whole four-bar groups, because form is built in fours: a 63-bar song has a
   * bar of nowhere in it, and every section boundary after it lands off the
   * phrase.
   */
  it("rounds to whole four-bar groups", () => {
    for (const seconds of [100, 150, 200, 250]) {
      expect(measuresForSeconds(seconds, 120, 4) % 4).toBe(0);
    }
  });

  it("still gives a very slow piece a phrase to work with", () => {
    expect(measuresForSeconds(10, 40, 4)).toBe(4);
  });

  it("agrees with the arithmetic that exposed the problem", () => {
    // The 32-bar song measured 1:31, so ~91 seconds asks for 32 bars back.
    expect(measuresForSeconds(91, 84, 4)).toBe(32);
  });
});

/*
 * Some genres ARE a length. A blues is twelve bars and a rag sixteen, so a
 * blues rounded to fours comes out at 76 — six choruses and a third of one,
 * which is not a blues.
 */
describe("measuresForSeconds and the genre's own form", () => {
  it("rounds to whole choruses of a twelve-bar form", () => {
    const bars = measuresForSeconds(210, 88, 4, 12);
    expect(bars % 12).toBe(0);
    expect(bars).toBe(72);
  });

  it("rounds to whole sixteens for a rag", () => {
    expect(measuresForSeconds(210, 96, 2, 16) % 16).toBe(0);
  });

  it("still gives a whole form when the duration is short", () => {
    expect(measuresForSeconds(5, 88, 4, 12)).toBe(12);
  });
});
