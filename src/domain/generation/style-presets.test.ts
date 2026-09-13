import { describe, expect, it } from "vitest";
import {
  GENERATE_SCORE_STYLE_OPTIONS,
  GENERATE_SCORE_STYLE_PRESETS,
  styleTempoRange,
} from "./style-presets.js";

describe("generation style presets", () => {
  it("has a preset for every offered style", () => {
    for (const style of GENERATE_SCORE_STYLE_OPTIONS) {
      expect(GENERATE_SCORE_STYLE_PRESETS[style], style).toBeDefined();
    }
  });

  it("does not carry unreachable presets", () => {
    for (const style of Object.keys(GENERATE_SCORE_STYLE_PRESETS)) {
      expect(GENERATE_SCORE_STYLE_OPTIONS).toContain(style);
    }
  });

  it("uses model-facing phrases instead of picker tokens", () => {
    for (const [style, preset] of Object.entries(
      GENERATE_SCORE_STYLE_PRESETS,
    )) {
      expect(preset.prompt.length, style).toBeGreaterThan(20);
      expect(preset.prompt, style).not.toBe(style);
      expect(preset.prompt, style).toContain("—");
    }
  });

  it("derives usable song-length measure counts", () => {
    for (const [style, preset] of Object.entries(
      GENERATE_SCORE_STYLE_PRESETS,
    )) {
      expect(preset.measures, style).toBeGreaterThan(0);
      expect(Number.isInteger(preset.measures), style).toBe(true);
    }
  });

  it("keeps fixed-form styles on whole forms", () => {
    expect(GENERATE_SCORE_STYLE_PRESETS.blues?.measures % 12).toBe(0);
    expect(GENERATE_SCORE_STYLE_PRESETS.ragtime?.measures % 16).toBe(0);
  });
});

/*
 * The tempo a generation actually runs at.
 *
 * Every score this app generated ran at its genre's one nominal tempo, so two
 * goes at salsa were both at exactly 190 — one more dimension on which two
 * pieces of a genre were the same piece. The spread is a rule rather than a
 * per-genre pair, because `tempo` already calls itself the middle of a range.
 */
describe("styleTempoRange", () => {
  it("brackets the nominal tempo", () => {
    for (const style of GENERATE_SCORE_STYLE_OPTIONS) {
      const range = styleTempoRange(style);
      const { tempo } = GENERATE_SCORE_STYLE_PRESETS[style];
      expect(range, style).not.toBeNull();
      expect(range![0]).toBeLessThan(tempo);
      expect(range![1]).toBeGreaterThan(tempo);
    }
  });

  it("stays inside the genre, rather than reinventing it", () => {
    // A shuffle blues at 88 may drift a few bpm; it may not become a 60bpm
    // slow blues or a 120bpm jump blues, which are different music.
    for (const style of GENERATE_SCORE_STYLE_OPTIONS) {
      const [min, max] = styleTempoRange(style)!;
      const { tempo } = GENERATE_SCORE_STYLE_PRESETS[style];
      expect(max - min, style).toBeLessThanOrEqual(Math.round(tempo * 0.15));
      expect(Number.isInteger(min) && Number.isInteger(max), style).toBe(true);
    }
  });

  it("says nothing about a style it does not know", () => {
    expect(styleTempoRange("sea shanty")).toBeNull();
  });
});
