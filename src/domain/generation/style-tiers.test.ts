/**
 * Every style's roster in three tiers: essential (always there, not
 * removable), preferred (added, removable) and optional (a couple picked at
 * random). A bad value in any tier is a track the dialog cannot build.
 */
import { describe, expect, it } from "vitest";
import { GENERATE_SCORE_STYLE_PRESETS } from "./style-presets";
import { instrumentChoiceFor, isVocalInstrumentValue } from "../instruments/instrument-options";

describe("style instrument tiers", () => {
  const styles = Object.entries(GENERATE_SCORE_STYLE_PRESETS);

  it("gives every style at least one essential instrument, and never the singer", () => {
    for (const [, preset] of styles) {
      expect(preset.essential.length).toBeGreaterThan(0);
      expect(preset.essential.some(isVocalInstrumentValue)).toBe(false);
    }
  });

  it("names only instruments the picker knows, each in one tier", () => {
    for (const [style, preset] of styles) {
      const all = [...preset.essential, ...preset.preferred, ...preset.optional];
      for (const value of all) {
        expect(value, style).toMatch(/^(kit:\d+|\d+)$/);
        const program = instrumentChoiceFor(value).midiProgram;
        expect(program >= 0 && program <= 127, `${style} ${value}`).toBe(true);
      }
      expect(new Set(all).size, style).toBe(all.length);
    }
  });

  it("keeps the kit essential where the style's rhythm is the kit", () => {
    for (const style of ["rock", "reggae", "funk", "heavyMetal", "punk", "house", "hipHop", "salsa", "march"]) {
      expect(GENERATE_SCORE_STYLE_PRESETS[style].essential).toContain("kit:0");
    }
  });

  it("derives the core instruments from essential and preferred, without the singer", () => {
    const reggae = GENERATE_SCORE_STYLE_PRESETS.reggae;
    expect(reggae.instruments).toEqual(
      [...reggae.essential, ...reggae.preferred].filter((v) => !isVocalInstrumentValue(v)),
    );
  });
});
