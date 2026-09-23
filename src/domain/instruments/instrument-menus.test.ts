import { describe, expect, it } from "vitest";
import { createEmptyScore } from "../score/factory";
import {
  FAMILY_GROUPS,
  INSTRUMENT_OPTIONS,
  KIT_OPTIONS,
  VOICE_OPTIONS,
} from "./instrument-options";
import {
  GENERATION_INSTRUMENT_GROUPS,
  generationInstrumentOptionsFlat,
  instrumentPickerFor,
} from "./instrument-menus";

describe("GENERATION_INSTRUMENT_GROUPS", () => {
  it("is voices, then kits, then the GM families in catalogue order", () => {
    expect(GENERATION_INSTRUMENT_GROUPS.map((g) => g.key)).toEqual([
      "voices",
      "kits",
      ...FAMILY_GROUPS.map((g) => g.key),
    ]);
  });

  it("names the two groups this family invented by key, and the GM families by their fixed name", () => {
    const [voices, kits, piano] = GENERATION_INSTRUMENT_GROUPS;
    expect(voices).toMatchObject({ labelKey: "generate.voices", label: null });
    expect(kits).toMatchObject({ labelKey: "generate.drumKits", label: null });
    expect(piano).toMatchObject({ labelKey: null, label: "Piano" });
  });

  it("offers each voice once, ahead of everything", () => {
    const values = GENERATION_INSTRUMENT_GROUPS.flatMap((g) =>
      g.options.map((o) => o.value),
    );
    expect(new Set(values).size).toBe(values.length);
    expect(GENERATION_INSTRUMENT_GROUPS[0]!.options).toEqual(VOICE_OPTIONS);
    expect(GENERATION_INSTRUMENT_GROUPS[1]!.options).toEqual(KIT_OPTIONS);
  });
});

describe("generationInstrumentOptionsFlat", () => {
  it("flattens the groups, writing the family into a melodic label", () => {
    const flat = generationInstrumentOptionsFlat({ voices: true });
    expect(flat.slice(0, VOICE_OPTIONS.length)).toEqual(
      VOICE_OPTIONS.map(({ value, label }) => ({ value, label })),
    );
    expect(flat.find((o) => o.value === "0")?.label).toBe(
      "Piano · Acoustic Grand Piano",
    );
    expect(flat.find((o) => o.value === KIT_OPTIONS[0]!.value)?.label).toBe(
      KIT_OPTIONS[0]!.label,
    );
  });

  it("leaves the voices out when asked, kits first", () => {
    const flat = generationInstrumentOptionsFlat({ voices: false });
    expect(flat[0]).toEqual({
      value: KIT_OPTIONS[0]!.value,
      label: KIT_OPTIONS[0]!.label,
    });
    expect(flat.some((o) => o.value === VOICE_OPTIONS[0]!.value)).toBe(false);
  });
});

describe("instrumentPickerFor", () => {
  const score = createEmptyScore({
    title: "S",
    tracks: [
      { name: "Violin", midiProgram: 40, clef: "treble" },
      { name: "Drums", midiProgram: 40, clef: "percussion" },
    ],
  });

  it("offers the melodic catalogue for a pitched track", () => {
    expect(instrumentPickerFor(score.tracks[0]!)).toEqual({
      options: INSTRUMENT_OPTIONS,
      value: "40",
      titleKey: "generate.instrument",
    });
  });

  it("offers kits for a percussion track, where program 40 is Brush", () => {
    const picker = instrumentPickerFor(score.tracks[1]!);
    expect(picker.options).toBe(KIT_OPTIONS);
    expect(picker.value).toBe("kit:40");
    expect(picker.titleKey).toBe("inspector.drumKit");
  });
});
