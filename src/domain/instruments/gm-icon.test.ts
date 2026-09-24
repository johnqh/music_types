import { describe, expect, it } from "vitest";
import { GM_INSTRUMENTS } from "./gm";
import { GM_KITS } from "./gm-kit";
import { gmInstrumentIcon, gmKitIcon } from "./gm-icon";
import { ICON_VIEWBOX, parseIconPath } from "./icon-art";

describe("gmInstrumentIcon", () => {
  it("gives every one of the 128 programs art with at least one shape", () => {
    for (const instrument of GM_INSTRUMENTS) {
      expect(gmInstrumentIcon(instrument.program).shapes.length, instrument.name).toBeGreaterThan(0);
    }
  });

  it("names each icon after the model it was projected from", () => {
    expect(gmInstrumentIcon(0).name).toBe("grand-piano");
    expect(gmInstrumentIcon(24).name).toBe("classical-guitar");
    expect(gmInstrumentIcon(40).name).toBe("violin");
    expect(gmInstrumentIcon(56).name).toBe("trumpet");
    expect(gmInstrumentIcon(65).name).toBe("alto-sax");
  });

  it("draws physically different instruments differently", () => {
    // The old shared-glyph set gave every string a violin and every brass a trumpet.
    const distinct = (programs: number[]) => new Set(programs.map((p) => gmInstrumentIcon(p).name)).size;
    expect(distinct([40, 41, 42, 43])).toBe(4); // violin, viola, cello, bass
    expect(distinct([56, 57, 58, 60])).toBe(4); // trumpet, trombone, tuba, horn
    expect(distinct([24, 25, 26, 27, 28, 29, 30])).toBe(7); // seven guitars
  });

  it("shares an icon where two programs are one physical instrument", () => {
    expect(gmInstrumentIcon(0)).toBe(gmInstrumentIcon(1)); // both a grand piano — same cached object
  });

  it("falls back rather than returning nothing outside the range", () => {
    expect(gmInstrumentIcon(-1).shapes.length).toBeGreaterThan(0);
    expect(gmInstrumentIcon(999).shapes.length).toBeGreaterThan(0);
  });

  it("every path in the set parses, so no icon draws partially", () => {
    for (const instrument of GM_INSTRUMENTS) {
      for (const shape of gmInstrumentIcon(instrument.program).shapes) {
        if (shape.kind === "path") expect(() => parseIconPath(shape.d)).not.toThrow();
      }
    }
  });

  it("every coordinate sits inside the 24x24 viewbox", () => {
    const seen = new Set<string>();
    for (const instrument of GM_INSTRUMENTS) {
      const art = gmInstrumentIcon(instrument.program);
      if (seen.has(art.name)) continue;
      seen.add(art.name);
      for (const shape of art.shapes) {
        if (shape.kind !== "path") continue;
        for (const segment of parseIconPath(shape.d)) {
          if (segment.kind === "close") continue;
          expect(segment.x, `${art.name} path x`).toBeGreaterThanOrEqual(0);
          expect(segment.x, `${art.name} path x`).toBeLessThanOrEqual(ICON_VIEWBOX);
          expect(segment.y, `${art.name} path y`).toBeGreaterThanOrEqual(0);
          expect(segment.y, `${art.name} path y`).toBeLessThanOrEqual(ICON_VIEWBOX);
        }
      }
    }
  });

  it("is a glyph, not a scribble: at most 90 segments, every stroke at least 1.7 units across", () => {
    for (const instrument of GM_INSTRUMENTS) {
      const art = gmInstrumentIcon(instrument.program);
      let segments = 0;
      for (const shape of art.shapes) {
        if (shape.kind !== "path") continue;
        const pts = parseIconPath(shape.d).filter((s) => s.kind !== "close") as { x: number; y: number }[];
        segments += pts.length - 1;
        const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
        const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
        expect(Math.max(w, h), art.name).toBeGreaterThanOrEqual(1.7);
      }
      expect(segments, art.name).toBeLessThanOrEqual(90);
    }
  });
});

describe("gmKitIcon", () => {
  it("gives every kit its own icon", () => {
    expect(new Set(GM_KITS.map((kit) => gmKitIcon(kit.program).name)).size).toBe(GM_KITS.length);
  });

  it("draws the TR-808 as the machine and the standard kit as drums", () => {
    expect(gmKitIcon(25).name).toBe("tr-808");
    expect(gmKitIcon().name).toBe("standard-kit");
  });
});
