import { describe, expect, it } from "vitest";
import {
  TRACK_INFO_MODES,
  TRACK_INFO_MODE_LABEL_KEY,
  isTrackInfoMode,
  TRACK_INFO_MODE_HINT_KEY,
} from "./view-settings";

describe("track info modes", () => {
  it("runs from the widest column to none", () => {
    expect(TRACK_INFO_MODES).toEqual(["full", "icon", "hidden"]);
  });

  it("names every mode with a key of its own", () => {
    const keys = TRACK_INFO_MODES.map(
      (mode) => TRACK_INFO_MODE_LABEL_KEY[mode],
    );
    expect(new Set(keys).size).toBe(TRACK_INFO_MODES.length);
    const hints = TRACK_INFO_MODES.map(
      (mode) => TRACK_INFO_MODE_HINT_KEY[mode],
    );
    expect(new Set([...keys, ...hints]).size).toBe(2 * TRACK_INFO_MODES.length);
  });

  it("knows a mode from anything else", () => {
    expect(isTrackInfoMode("icon")).toBe(true);
    expect(isTrackInfoMode("compact")).toBe(false);
    expect(isTrackInfoMode(null)).toBe(false);
  });
});
