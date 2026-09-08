import { describe, expect, it } from "vitest";
import {
  GENERATE_SCORE_STYLE_OPTIONS,
  GENERATE_SCORE_STYLE_PRESETS,
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
