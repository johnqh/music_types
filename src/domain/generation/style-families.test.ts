import { describe, expect, it } from "vitest";
import {
  STYLE_FAMILIES,
  STYLE_FAMILY_OF,
  styleFamilyOf,
  stylesInFamily,
} from "./style-families";
import { GENERATE_SCORE_STYLE_OPTIONS } from "./style-presets";

describe("style families", () => {
  it("files every offered style, and nothing else", () => {
    expect(Object.keys(STYLE_FAMILY_OF).sort()).toEqual(
      [...GENERATE_SCORE_STYLE_OPTIONS].sort(),
    );
  });

  it("uses only declared families", () => {
    for (const [style, family] of Object.entries(STYLE_FAMILY_OF)) {
      expect(STYLE_FAMILIES, style).toContain(family);
    }
  });

  // A heading over one entry is a longer way to show that entry.
  it("gives every family at least two styles", () => {
    for (const family of STYLE_FAMILIES) {
      expect(stylesInFamily(family).length, family).toBeGreaterThan(1);
    }
  });

  it("answers null for a style this build does not know", () => {
    expect(styleFamilyOf("bossaNova")).toBe("latinCaribbean");
    expect(styleFamilyOf("not a style")).toBeNull();
    expect(styleFamilyOf("toString")).toBeNull();
  });
});
