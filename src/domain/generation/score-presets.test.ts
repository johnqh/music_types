import { describe, expect, it } from "vitest";
import {
  SCORE_PRESET_KEYS,
  isScorePresetKey,
  scorePresetsResponseSchema,
} from "./score-presets.js";

describe("the score preset vocabulary", () => {
  it("is a closed list with the type read off it", () => {
    expect(SCORE_PRESET_KEYS.length).toBeGreaterThan(0);
    expect(new Set(SCORE_PRESET_KEYS).size).toBe(SCORE_PRESET_KEYS.length);
  });

  it("names briefs, not genres — the style travels as its own field", () => {
    // A preset that said "reggae" in its own text would say it twice, and
    // would be wrong the moment it were served under another style.
    for (const key of SCORE_PRESET_KEYS) {
      expect(key).toMatch(/^[a-z][A-Za-z]*$/);
    }
  });

  it("recognises its own keys and nothing else", () => {
    expect(isScorePresetKey(SCORE_PRESET_KEYS[0])).toBe(true);
    expect(isScorePresetKey("somethingElse")).toBe(false);
  });
});

describe("the presets response", () => {
  it("accepts a list of known keys", () => {
    const parsed = scorePresetsResponseSchema.safeParse({
      presets: [SCORE_PRESET_KEYS[0], SCORE_PRESET_KEYS[1]],
    });
    expect(parsed.success).toBe(true);
  });

  it("refuses a key outside the vocabulary", () => {
    // The host translates by key, so a key it cannot know is a preset that
    // would render as its own name.
    expect(
      scorePresetsResponseSchema.safeParse({ presets: ["nonsense"] }).success,
    ).toBe(false);
  });

  it("accepts an empty list, which is what an unknown style may yield", () => {
    expect(
      scorePresetsResponseSchema.safeParse({ presets: [] }).success,
    ).toBe(true);
  });
});
