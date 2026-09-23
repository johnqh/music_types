import { describe, expect, it } from "vitest";
import { GM_CATALOGUE } from "./gm-catalogue";
import { gmInstrumentRows } from "./instrument-reference";

describe("gmInstrumentRows", () => {
  it("lists the whole catalogue for an empty query", () => {
    expect(gmInstrumentRows("")).toHaveLength(GM_CATALOGUE.length);
    expect(gmInstrumentRows("   ")).toHaveLength(GM_CATALOGUE.length);
  });

  it("formats a row's cells the way the reference table prints them", () => {
    const trumpet = gmInstrumentRows("trumpet").find((r) => r.program === 56);
    expect(trumpet).toEqual({
      program: 56,
      name: "Trumpet",
      family: "brass",
      familyLabel: "Brass",
      range: "E3–D6",
      polyphony: 1,
      transposition: "+2",
      basis: "measured",
      basisKey: "docs.instruments.basis.measured",
    });
  });

  it("writes accidentals as musical signs, unlimited polyphony as null, and no transposition as a dash", () => {
    const banjo = gmInstrumentRows("banjo")[0]!;
    expect(banjo.range).toBe("C3–C6");
    const glock = gmInstrumentRows("glockenspiel")[0]!;
    expect(glock.polyphony).toBeNull();
    expect(glock.transposition).toBe("-24");
    expect(gmInstrumentRows("0").find((r) => r.program === 0)?.transposition).toBe("—");
    // C♯1-style names, never "#": the table is read, not typed.
    expect(gmInstrumentRows("").some((r) => r.range.includes("#"))).toBe(false);
  });

  it("matches a name case-insensitively, a program number exactly, or a family", () => {
    expect(gmInstrumentRows("TRUMPET").map((r) => r.program)).toContain(56);
    expect(gmInstrumentRows("56").map((r) => r.program)).toEqual([56]);
    expect(gmInstrumentRows("brass").every((r) => r.family === "brass" || r.name.toLowerCase().includes("brass"))).toBe(true);
    expect(gmInstrumentRows("brass").length).toBeGreaterThanOrEqual(8);
  });
});
