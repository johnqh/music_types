import { describe, expect, it } from "vitest";
import { commonValue } from "./common-value.js";

describe("commonValue", () => {
  it("answers the shared value when everything agrees", () => {
    expect(commonValue(["staccato", "staccato"])).toBe("staccato");
  });

  it("answers null when they do not, so a panel can say Mixed", () => {
    expect(commonValue(["staccato", "accent"])).toBeNull();
  });

  it("answers null for an empty selection", () => {
    expect(commonValue([])).toBeNull();
  });

  it("compares by structure, not identity", () => {
    /*
      The bug this exists for: pitches, time signatures and key signatures are
      small objects rebuilt on every read, so `===` reports every multi-note
      selection as mixed — and the panel then shows "Mixed" for two notes that
      are plainly the same note.
    */
    const a = { step: "C", accidental: 0, octave: 4 };
    const b = { step: "C", accidental: 0, octave: 4 };
    expect(a).not.toBe(b);
    expect(commonValue([a, b])).toEqual(a);
  });

  it("still separates values that differ inside the object", () => {
    expect(
      commonValue([
        { step: "C", accidental: 0, octave: 4 },
        { step: "C", accidental: 0, octave: 5 },
      ]),
    ).toBeNull();
  });
});
