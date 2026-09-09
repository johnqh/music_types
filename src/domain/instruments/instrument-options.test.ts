import { describe, expect, it } from "vitest";
import { isVocalProgram } from "./arrangement-order.js";
import {
  DEFAULT_VOCAL_INSTRUMENT_VALUE,
  FAMILY_GROUPS,
  INSTRUMENT_OPTIONS,
  VOICE_OPTIONS,
  instrumentChoiceFor,
  isVocalInstrumentValue,
} from "./instrument-options.js";

describe("the voice group", () => {
  it("offers the three programs that are a human voice, solo patch first", () => {
    expect(VOICE_OPTIONS.map((option) => option.value)).toEqual([
      "53",
      "52",
      "54",
    ]);
    expect(VOICE_OPTIONS.map((option) => option.label)).toEqual([
      "Voice Oohs",
      "Choir Aahs",
      "Synth Voice",
    ]);
  });

  it("is built from the same set the arranger reads, not a second list", () => {
    for (const option of VOICE_OPTIONS) {
      expect(isVocalProgram(Number(option.value))).toBe(true);
    }
  });

  it("adds the default vocal, which is the one a song is carried by", () => {
    expect(isVocalInstrumentValue(DEFAULT_VOCAL_INSTRUMENT_VALUE)).toBe(true);
    expect(instrumentChoiceFor(DEFAULT_VOCAL_INSTRUMENT_VALUE).clef).toBe(
      "treble",
    );
  });

  it("does not read a drum kit as a voice, whatever its program number", () => {
    // Kit 52 is not a thing, but `kit:` values are resolved against the kit
    // table, and a bare number check would call this one a singer.
    expect(isVocalInstrumentValue("kit:52")).toBe(false);
    expect(isVocalInstrumentValue("0")).toBe(false);
  });

  it("leaves no program in two groups of the same menu", () => {
    const voices = VOICE_OPTIONS.map((option) => option.value);
    const families = FAMILY_GROUPS.flatMap((group) =>
      group.instruments.map((instrument) => String(instrument.program)),
    );
    expect(families.filter((value) => voices.includes(value))).toEqual([]);
  });

  it("keeps the flat catalogue whole, since it is the catalogue and not a menu", () => {
    expect(INSTRUMENT_OPTIONS).toHaveLength(128);
    for (const value of VOICE_OPTIONS.map((option) => option.value)) {
      expect(
        INSTRUMENT_OPTIONS.some((option) => option.value === value),
      ).toBe(true);
    }
  });
});
