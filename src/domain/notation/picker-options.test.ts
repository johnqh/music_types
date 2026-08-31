import { describe, expect, it } from "vitest";
import {
  ACCIDENTALS,
  ARTICULATIONS,
  DYNAMICS,
  ORNAMENTS,
} from "../../index.js";
import {
  ACCIDENTAL_OPTIONS,
  ARTICULATION_OPTIONS,
  DYNAMIC_OPTIONS,
  MIDI_GRID_OPTIONS,
  NO_MARK,
  ORNAMENT_OPTIONS,
} from "./picker-options.js";

/**
 * The point of these lists is that they are *derived*. A hand-written picker
 * list agrees with its vocabulary right up until somebody adds a member, and
 * then goes on quietly offering the old set — which is exactly how the same
 * list came to exist three times across the two apps.
 */
describe("picker options follow their vocabulary", () => {
  it("offers every articulation, plus none", () => {
    expect(ARTICULATION_OPTIONS).toHaveLength(ARTICULATIONS.length + 1);
    for (const value of ARTICULATIONS) {
      expect(ARTICULATION_OPTIONS.some((o) => o.value === value)).toBe(true);
    }
  });

  it("offers every ornament, plus none", () => {
    expect(ORNAMENT_OPTIONS).toHaveLength(ORNAMENTS.length + 1);
  });

  it("offers every accidental, and no none — a note always has one", () => {
    // Natural *is* an accidental; there is no "unset" to offer.
    expect(ACCIDENTAL_OPTIONS).toHaveLength(ACCIDENTALS.length);
    expect(ACCIDENTAL_OPTIONS.some((o) => String(o.value) === NO_MARK)).toBe(
      false,
    );
  });

  it("offers every dynamic, plus none", () => {
    expect(DYNAMIC_OPTIONS).toHaveLength(DYNAMICS.length + 1);
  });

  it("keys the inverted mordent camelCase, not kebab", () => {
    /*
      The vocabulary member is `inverted-mordent` because that is what MusicXML
      and the model use; i18n keys in this family are camelCase. Each app used
      to map that itself, and an app that got it wrong printed the raw key name
      in the picker — which looks like a missing translation rather than a typo.
    */
    const inverted = ORNAMENT_OPTIONS.find(
      (o) => o.value === "inverted-mordent",
    );
    expect(inverted?.labelKey).toBe("ornament.invertedMordent");
  });

  it("puts none first everywhere it exists, so the lists read alike", () => {
    for (const list of [ARTICULATION_OPTIONS, ORNAMENT_OPTIONS, DYNAMIC_OPTIONS, MIDI_GRID_OPTIONS]) {
      expect(list[0]?.value).toBe(NO_MARK);
    }
  });

  it("offers only plain grids for a MIDI import", () => {
    // Dotted and triplet values are note lengths, not grids a performance is
    // quantized to — a shorter list here is the decision, not an omission.
    for (const option of MIDI_GRID_OPTIONS) {
      expect(String(option.value)).not.toMatch(/dotted|triplet/);
    }
  });
});
