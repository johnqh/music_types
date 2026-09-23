import { describe, expect, it } from "vitest";
import { ACCIDENTALS } from "../../index";
import { BASE_DURATIONS } from "../time/duration-modifiers";
import { NOTATION_ICON_NAMES } from "./notation-icon-art";
import { ACCIDENTAL_ICON, DURATION_ICON } from "./toolbar-icons";

const known = new Set<string>(NOTATION_ICON_NAMES);

describe("toolbar glyph tables", () => {
  it("draws every base duration with a glyph that exists", () => {
    for (const base of BASE_DURATIONS) {
      expect(known.has(DURATION_ICON[base])).toBe(true);
    }
    expect(DURATION_ICON.quarter).toBe("QuarterNoteIcon");
    expect(DURATION_ICON.thirtysecond).toBe("ThirtySecondNoteIcon");
  });

  it("draws every accidental with a glyph that exists", () => {
    for (const accidental of ACCIDENTALS) {
      expect(known.has(ACCIDENTAL_ICON[accidental])).toBe(true);
    }
    expect(ACCIDENTAL_ICON[-2]).toBe("DoubleFlatIcon");
    expect(ACCIDENTAL_ICON[1]).toBe("SharpIcon");
  });
});
