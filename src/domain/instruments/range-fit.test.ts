import { describe, expect, it } from "vitest";
import {
  midiIsInRange,
  trackRangeIsBinding,
} from "./range-fit.js";

/** Timpani: D2-A3, the narrowest measured compass in the catalogue. */
const TIMPANI = { min: 38, max: 57 };

describe("midiIsInRange", () => {
  it("is inclusive at both ends", () => {
    expect(midiIsInRange(38, TIMPANI)).toBe(true);
    expect(midiIsInRange(57, TIMPANI)).toBe(true);
    expect(midiIsInRange(37, TIMPANI)).toBe(false);
    expect(midiIsInRange(58, TIMPANI)).toBe(false);
  });
});

describe("trackRangeIsBinding", () => {
  it("binds on a measured instrument", () => {
    // Timpani is measured: refusing a note against it is defensible.
    expect(trackRangeIsBinding({ clef: "treble", midiProgram: 47 })).toBe(true);
  });

  it("does not bind on a guessed compass", () => {
    // Program 55 (Orchestra Hit) is "unpitched" — a sampled stab, not a compass.
    expect(trackRangeIsBinding({ clef: "treble", midiProgram: 55 })).toBe(false);
  });

  it("binds on percussion, whatever the kit number means elsewhere", () => {
    // The drum range is physical: a kit has the pieces it has. Kit 40 is also
    // program 40 (Violin), which is exactly the confusion this guards.
    expect(trackRangeIsBinding({ clef: "percussion", midiProgram: 40 })).toBe(true);
  });
});
