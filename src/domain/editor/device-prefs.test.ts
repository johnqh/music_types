import { describe, expect, it } from "vitest";
import { preferredLanguage } from "./device-prefs.js";

/**
 * Ported from music_app's `languages.test.ts`, which is where this rule was
 * written and tested — the native app had its own untested copy that compared
 * whole tags, and so ignored its own reader's stored `zh-Hans`.
 */
const SUPPORTED = ["en", "zh"] as const;

describe("preferredLanguage", () => {
  it("takes the chosen language over the device", () => {
    expect(preferredLanguage("zh", ["en-US"], SUPPORTED)).toBe("zh");
  });

  it("follows the device when nothing was chosen", () => {
    // `null` is "follow the device", which has to survive the device changing.
    expect(preferredLanguage(null, ["zh-CN", "en"], SUPPORTED)).toBe("zh");
  });

  it("reads a regional or scripted tag by its language", () => {
    // A phone stores a BCP 47 tag, and a browser reports one.
    expect(preferredLanguage("zh-Hans", [], SUPPORTED)).toBe("zh");
    expect(preferredLanguage(null, ["fr-FR", "en-GB"], SUPPORTED)).toBe("en");
  });

  it("resolves a stored zh-Hans, which the native app used to drop", () => {
    /*
      `SUPPORTED_LANGUAGES.includes('zh-Hans')` is false, so the native app's
      own copy fell through to the device tags — a reader who had chosen
      Chinese on an English phone got English back, silently, for as long as
      the choice stayed stored.
    */
    expect(preferredLanguage("zh-Hans", ["en-US"], SUPPORTED)).toBe("zh");
    expect(preferredLanguage("zh-Hant-TW", ["en-US"], SUPPORTED)).toBe("zh");
    expect(preferredLanguage("EN-GB", ["zh-CN"], SUPPORTED)).toBe("en");
  });

  it("skips a choice this build has no bundle for", () => {
    expect(preferredLanguage("de", ["zh-TW"], SUPPORTED)).toBe("zh");
  });

  it("falls back to the first language the build ships", () => {
    expect(preferredLanguage(null, [], SUPPORTED)).toBe("en");
    expect(preferredLanguage("de", ["fr"], SUPPORTED)).toBe("en");
    // Taken from the list rather than written in, so a build that shipped
    // another language first would not be told it was English.
    expect(preferredLanguage("de", ["fr"], ["zh", "en"])).toBe("zh");
  });

  it("treats undefined like null — a pref not yet read", () => {
    expect(preferredLanguage(undefined, ["zh-CN"], SUPPORTED)).toBe("zh");
  });
});
