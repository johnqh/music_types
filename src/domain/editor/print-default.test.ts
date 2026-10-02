import { describe, expect, it } from "vitest";
import { defaultPaperSizeFor } from "./print";

describe("defaultPaperSizeFor", () => {
  it("offers Letter where the region prints on it", () => {
    expect(defaultPaperSizeFor(["en-US"])).toBe("letter");
    expect(defaultPaperSizeFor(["fr-CA"])).toBe("letter");
    expect(defaultPaperSizeFor(["es_MX"])).toBe("letter");
  });

  it("goes by the region, not the language", () => {
    expect(defaultPaperSizeFor(["en-GB"])).toBe("a4");
    expect(defaultPaperSizeFor(["zh-Hans-CN"])).toBe("a4");
    expect(defaultPaperSizeFor(["zh-Hans-US"])).toBe("letter");
  });

  it("takes the first tag that names a region", () => {
    expect(defaultPaperSizeFor(["en", "en-US"])).toBe("letter");
    expect(defaultPaperSizeFor(["de-DE", "en-US"])).toBe("a4");
  });

  it("falls back to A4 with no region to go on", () => {
    expect(defaultPaperSizeFor([])).toBe("a4");
    expect(defaultPaperSizeFor(["en"])).toBe("a4");
  });
});
