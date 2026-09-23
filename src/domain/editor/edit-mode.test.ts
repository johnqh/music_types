import { describe, expect, it } from "vitest";
import { NOTATION_ICON_NAMES } from "../notation/notation-icon-art";
import { EDIT_MODES, EDIT_MODE_OPTIONS } from "./edit-mode";
import type { EditMode } from "./edit-mode";

describe("EDIT_MODE_OPTIONS", () => {
  it("offers every edit mode once, in toolbar order", () => {
    expect(EDIT_MODE_OPTIONS.map((option) => option.value)).toEqual([
      ...EDIT_MODES,
    ]);
    expect(EDIT_MODES).toEqual(["insert", "replace", "stack"]);
  });

  it("carries a label key, a hint key and a glyph for each", () => {
    for (const option of EDIT_MODE_OPTIONS) {
      expect(option.labelKey).toBe(`editor.${option.value}Mode`);
      expect(option.hintKey).toBe(`editor.${option.value}ModeHint`);
      expect(option.icon).toMatch(/Icon$/);
    }
  });

  it("gives each the glyph and keys both toolbars draw", () => {
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
    const known = new Set<string>(NOTATION_ICON_NAMES);
    for (const option of EDIT_MODE_OPTIONS) {
      expect(known.has(option.icon)).toBe(true);
    }
  });

  it("is typed as the edit modes it lists", () => {
    const values: readonly EditMode[] = EDIT_MODE_OPTIONS.map((o) => o.value);
    expect(values).toEqual([...EDIT_MODES]);
  });
});
