import { describe, expect, it } from "vitest";
import { ACCIDENTALS } from "../../index.js";
import { BASE_DURATIONS } from "../time/duration-modifiers.js";
import { NOTATION_ICON_NAMES } from "./notation-icon-art.js";
import {
  ACCIDENTAL_ICON,
  DURATION_ICON,
  EDIT_MODE_OPTIONS,
} from "./toolbar-icons.js";

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

  it("offers insert, replace and stack in that order, with glyph, label and hint", () => {
    expect(EDIT_MODE_OPTIONS).toEqual([
      {
        value: "insert",
        icon: "InsertModeIcon",
        labelKey: "editor.insertMode",
        hintKey: "editor.insertModeHint",
      },
      {
        value: "replace",
        icon: "ReplaceModeIcon",
        labelKey: "editor.replaceMode",
        hintKey: "editor.replaceModeHint",
      },
      {
        value: "stack",
        icon: "ChordIcon",
        labelKey: "editor.stackMode",
        hintKey: "editor.stackModeHint",
      },
    ]);
    for (const option of EDIT_MODE_OPTIONS) {
      expect(known.has(option.icon)).toBe(true);
    }
  });
});
