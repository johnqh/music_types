import { describe, expect, it } from "vitest";
import { createEmptyScore } from "../score/factory";
import {
  MAX_BPM,
  MAX_MIDI,
  MAX_OCTAVE,
  MAX_TIME_SIG_NUMERATOR,
  MIN_BPM,
  MIN_MIDI,
  MIN_OCTAVE,
  TIME_SIG_DENOMINATOR_OPTIONS,
  VALID_TIME_SIG_DENOMINATORS,
} from "../validation/limits";
import { midiToPitch } from "../pitch/pitch";
import { NO_PICKUP } from "./picker-options";
import {
  MIX_STEP,
  clampBpm,
  clampPan,
  clampVolume,
  durationFieldState,
  formatBeatForField,
  formatEndingNumbers,
  parseEndingNumbers,
  parseNumericDraft,
  pickupBeatOptions,
  quantizeMix,
  tempoAtBar,
} from "./field-values";
import type { Measure, Score } from "../../index";

describe("clampBpm", () => {
  it("rounds to a whole tempo", () => {
    expect(clampBpm(104.5)).toBe(105);
    expect(clampBpm(119.4)).toBe(119);
  });

  it("clamps into the validator's bounds", () => {
    expect(clampBpm(0)).toBe(MIN_BPM);
    expect(clampBpm(10_000)).toBe(MAX_BPM);
  });

  it("falls back to the default tempo for a non-number", () => {
    expect(clampBpm(Number.NaN)).toBe(120);
  });
});

describe("parseNumericDraft", () => {
  it("treats an empty or blank draft as no value", () => {
    expect(parseNumericDraft("")).toBeNull();
    expect(parseNumericDraft("   ")).toBeNull();
  });

  it("refuses text that is not a number", () => {
    expect(parseNumericDraft("abc")).toBeNull();
    expect(parseNumericDraft("Infinity")).toBeNull();
  });

  it("reads decimals, and rounds only when asked for an integer", () => {
    expect(parseNumericDraft(" 2.5 ")).toBe(2.5);
    expect(parseNumericDraft("2.5", { integer: true })).toBe(3);
  });

  it("clamps into the bounds it is given", () => {
    expect(parseNumericDraft("200", { min: 0, max: 127 })).toBe(127);
    expect(parseNumericDraft("-4", { min: 0, max: 127 })).toBe(0);
  });
});

describe("octave bounds", () => {
  it("are the octaves MIDI 0 and 127 fall in", () => {
    expect(MIN_OCTAVE).toBe(midiToPitch(MIN_MIDI).octave);
    expect(MAX_OCTAVE).toBe(midiToPitch(MAX_MIDI).octave);
    expect([MIN_OCTAVE, MAX_OCTAVE]).toEqual([-1, 9]);
  });
});

describe("time signature bounds", () => {
  it("offers exactly the denominators the validator accepts, in order", () => {
    expect(TIME_SIG_DENOMINATOR_OPTIONS).toEqual([1, 2, 4, 8, 16, 32]);
    expect([...VALID_TIME_SIG_DENOMINATORS].sort((a, b) => a - b)).toEqual([
      ...TIME_SIG_DENOMINATOR_OPTIONS,
    ]);
  });

  it("caps the numerator", () => {
    expect(MAX_TIME_SIG_NUMERATOR).toBe(32);
  });
});

function firstMeasure(score: Score): Measure {
  return score.tracks[0]!.measures[0]!;
}

describe("pickupBeatOptions", () => {
  it("offers every pickup shorter than a full bar", () => {
    const score = createEmptyScore({ title: "S" });
    const options = pickupBeatOptions(firstMeasure(score), score.ppq);
    expect(options.current).toBe(NO_PICKUP);
    expect(options.beats).toEqual([1, 2, 3]);
  });

  it("names the current pickup by its length in beats", () => {
    const score = createEmptyScore({ title: "S" });
    const measure: Measure = {
      ...firstMeasure(score),
      pickup: true,
      durationTicks: 960,
    };
    expect(pickupBeatOptions(measure, score.ppq).current).toBe("2");
  });

  it("still offers one beat in a one-beat bar", () => {
    const score = createEmptyScore({
      title: "S",
      timeSignature: { numerator: 1, denominator: 4 },
    });
    expect(pickupBeatOptions(firstMeasure(score), score.ppq).beats).toEqual([1]);
  });

  it("counts compound time in dotted beats", () => {
    const score = createEmptyScore({
      title: "S",
      timeSignature: { numerator: 6, denominator: 8 },
    });
    expect(pickupBeatOptions(firstMeasure(score), score.ppq).beats).toEqual([1]);
  });
});

describe("ending numbers", () => {
  it("parses a comma list, dropping anything that is not a positive whole number", () => {
    expect(parseEndingNumbers("1, 2")).toEqual([1, 2]);
    expect(parseEndingNumbers("1, x, 0, -2, 2.5, 3")).toEqual([1, 3]);
    expect(parseEndingNumbers("")).toEqual([]);
  });

  it("formats them the way they are typed", () => {
    expect(formatEndingNumbers([1, 2])).toBe("1, 2");
    expect(formatEndingNumbers(undefined)).toBe("");
  });

  it("round-trips", () => {
    expect(parseEndingNumbers(formatEndingNumbers([1, 2, 3]))).toEqual([1, 2, 3]);
  });
});

describe("durationFieldState", () => {
  it("names a single note value", () => {
    expect(durationFieldState([{ durationTicks: 480 }], 480)).toEqual({
      kind: "name",
      name: "quarter",
      ticks: 480,
    });
  });

  it("calls a length no notehead spells custom, with its ticks", () => {
    expect(
      durationFieldState([{ durationTicks: 700 }, { durationTicks: 700 }], 480),
    ).toEqual({ kind: "custom", ticks: 700 });
  });

  it("is mixed when the selection disagrees", () => {
    expect(
      durationFieldState([{ durationTicks: 480 }, { durationTicks: 240 }], 480),
    ).toEqual({ kind: "mixed" });
  });

  it("is null with nothing selected", () => {
    expect(durationFieldState([], 480)).toBeNull();
  });
});

describe("mixing", () => {
  it("clamps volume to 0-1 and pan to -1..1", () => {
    expect(clampVolume(1.4)).toBe(1);
    expect(clampVolume(-0.2)).toBe(0);
    expect(clampPan(-3)).toBe(-1);
    expect(clampPan(0.25)).toBe(0.25);
  });

  it("treats a non-number as silence and centre", () => {
    expect(clampVolume(Number.NaN)).toBe(0);
    expect(clampPan(Number.NaN)).toBe(0);
  });

  it("quantizes onto the slider step without float noise", () => {
    expect(MIX_STEP).toBe(0.01);
    expect(quantizeMix(0.07000000001)).toBe(0.07);
    expect(quantizeMix(0.456)).toBe(0.46);
    expect(quantizeMix(-0.333)).toBe(-0.33);
  });
});

describe("formatBeatForField", () => {
  it("keeps two decimals at most, and none on a whole beat", () => {
    expect(formatBeatForField(2)).toBe("2");
    expect(formatBeatForField(2.5)).toBe("2.5");
    expect(formatBeatForField(1 + 1 / 3)).toBe("1.33");
  });
});

describe("tempoAtBar", () => {
  const score = createEmptyScore({ title: "S", measures: 4, tempo: 90 });
  const bars = score.tracks[0]!.measures;
  const opening = score.tempoMap[0]!;
  const withChange: Score = {
    ...score,
    tempoMap: [opening, { id: "t2", tick: bars[2]!.startTick, bpm: 132.4 }],
  };

  it("reports the starting tempo on bar 1 as its own, and as the start", () => {
    expect(tempoAtBar(withChange, bars[0]!)).toEqual({
      bpm: 90,
      ownEventId: opening.id,
      isStarting: true,
    });
  });

  it("inherits the tempo in force on a bar that sets none", () => {
    expect(tempoAtBar(withChange, bars[1]!)).toEqual({
      bpm: 90,
      ownEventId: null,
      isStarting: false,
    });
    expect(tempoAtBar(withChange, bars[3]!).bpm).toBe(132.4);
  });

  it("names the change a bar sets, which is not the start", () => {
    expect(tempoAtBar(withChange, bars[2]!)).toEqual({
      bpm: 132.4,
      ownEventId: "t2",
      isStarting: false,
    });
  });

  it("reads an unsorted tempo map in tick order", () => {
    const unsorted: Score = {
      ...withChange,
      tempoMap: [...withChange.tempoMap].reverse(),
    };
    expect(tempoAtBar(unsorted, bars[3]!).bpm).toBe(132.4);
    expect(tempoAtBar(unsorted, bars[0]!).isStarting).toBe(true);
  });

  it("falls back to the default tempo on a score with none", () => {
    expect(tempoAtBar({ ...score, tempoMap: [] }, bars[0]!)).toEqual({
      bpm: 120,
      ownEventId: null,
      isStarting: false,
    });
  });
});
