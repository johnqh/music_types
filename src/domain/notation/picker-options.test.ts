import { describe, expect, it } from "vitest";
import {
  ACCIDENTALS,
  ARTICULATIONS,
  DYNAMICS,
  ORNAMENTS,
} from "../../index.js";
import { BARLINE_STYLES, CLEFS, REPEAT_JUMPS } from "../../index.js";
import {
  THEME_MODES,
  THEME_MODE_LABEL_KEY,
  THEME_MODE_OPTIONS,
} from "../editor/device-prefs.js";
import { DURATIONS } from "../time/ticks.js";
import {
  BARLINE_OPTIONS,
  CLEF_LABEL_KEY,
  CLEF_OPTIONS,
  CUSTOM_DURATION,
  INHERIT_CLEF,
  KEY_MODE_OPTIONS,
  NO_JUMP,
  NO_PICKUP,
  SINGLE_BARLINE,
  ACCIDENTAL_OPTIONS,
  ARTICULATION_OPTIONS,
  DYNAMIC_OPTIONS,
  MIDI_GRID_OPTIONS,
  NO_MARK,
  ORNAMENT_OPTIONS,
} from "./picker-options.js";

/**
 * The point of these lists is that they are *derived*. A hand-written picker
 * list agrees with its vocabulary right up until somebody adds a member, and
 * then goes on quietly offering the old set — which is exactly how the same
 * list came to exist three times across the two apps.
 */
describe("picker options follow their vocabulary", () => {
  it("offers every articulation, plus none", () => {
    expect(ARTICULATION_OPTIONS).toHaveLength(ARTICULATIONS.length + 1);
    for (const value of ARTICULATIONS) {
      expect(ARTICULATION_OPTIONS.some((o) => o.value === value)).toBe(true);
    }
  });

  it("offers every ornament, plus none", () => {
    expect(ORNAMENT_OPTIONS).toHaveLength(ORNAMENTS.length + 1);
  });

  it("offers every accidental, and no none — a note always has one", () => {
    // Natural *is* an accidental; there is no "unset" to offer.
    expect(ACCIDENTAL_OPTIONS).toHaveLength(ACCIDENTALS.length);
    expect(ACCIDENTAL_OPTIONS.some((o) => String(o.value) === NO_MARK)).toBe(
      false,
    );
  });

  it("offers every dynamic, plus none", () => {
    expect(DYNAMIC_OPTIONS).toHaveLength(DYNAMICS.length + 1);
  });

  it("names only the absence of a dynamic; a marking is its own label", () => {
    /*
      `pp` is `pp` in every language, and both apps print the value itself.
      The list used to ask for `dynamic.<member>` keys anyway, which neither
      app defined and neither could usefully fill.
    */
    const [none, ...markings] = DYNAMIC_OPTIONS;
    expect(none).toEqual({ value: NO_MARK, labelKey: "inspector.noDynamic" });
    for (const option of markings) expect(option).not.toHaveProperty("labelKey");
  });

  it("keys the inverted mordent camelCase, not kebab", () => {
    /*
      The vocabulary member is `inverted-mordent` because that is what MusicXML
      and the model use; i18n keys in this family are camelCase. Each app used
      to map that itself, and an app that got it wrong printed the raw key name
      in the picker — which looks like a missing translation rather than a typo.
    */
    const inverted = ORNAMENT_OPTIONS.find(
      (o) => o.value === "inverted-mordent",
    );
    expect(inverted?.labelKey).toBe("ornament.invertedMordent");
  });

  it("puts none first everywhere it exists, so the lists read alike", () => {
    for (const list of [ARTICULATION_OPTIONS, ORNAMENT_OPTIONS, DYNAMIC_OPTIONS, MIDI_GRID_OPTIONS]) {
      expect(list[0]?.value).toBe(NO_MARK);
    }
  });

  it("offers only plain grids for a MIDI import", () => {
    // Dotted and triplet values are note lengths, not grids a performance is
    // quantized to — a shorter list here is the decision, not an omission.
    for (const option of MIDI_GRID_OPTIONS) {
      expect(String(option.value)).not.toMatch(/dotted|triplet/);
    }
  });
});

describe("picker sentinels and measure pickers", () => {
  it("gives each absence a non-empty value a picker can hold", () => {
    for (const sentinel of [
      CUSTOM_DURATION,
      INHERIT_CLEF,
      NO_PICKUP,
      SINGLE_BARLINE,
      NO_JUMP,
    ]) {
      expect(sentinel.length).toBeGreaterThan(0);
    }
  });

  it("keeps a custom length apart from every duration name", () => {
    expect(Object.keys(DURATIONS)).not.toContain(CUSTOM_DURATION);
  });

  it("keeps the inherit and single sentinels apart from the vocabularies", () => {
    expect(CLEFS as readonly string[]).not.toContain(INHERIT_CLEF);
    expect(BARLINE_STYLES as readonly string[]).not.toContain(SINGLE_BARLINE);
    expect(REPEAT_JUMPS as readonly string[]).not.toContain(NO_JUMP);
  });

  it("offers the single barline first, then every style", () => {
    expect(BARLINE_OPTIONS[0]).toEqual({
      value: SINGLE_BARLINE,
      labelKey: "inspector.barlineSingle",
    });
    expect(BARLINE_OPTIONS.slice(1).map((o) => o.value)).toEqual([
      ...BARLINE_STYLES,
    ]);
    expect(BARLINE_OPTIONS.map((o) => o.labelKey)).toEqual([
      "inspector.barlineSingle",
      "inspector.barlineDouble",
      "inspector.barlineFinal",
    ]);
  });

  it("offers both key modes under the shared key.* keys", () => {
    expect(KEY_MODE_OPTIONS).toEqual([
      { value: "major", labelKey: "key.major" },
      { value: "minor", labelKey: "key.minor" },
    ]);
  });
});

describe("the vocabularies both apps' pickers label", () => {
  /*
    Each of these was an identical table in music_app and music_app_rn, in step
    only because nobody had yet added a clef or a theme mode. The keys are the
    ones both apps already carried, so publishing them changed no copy.
  */
  it("names every clef, under clef.<member>", () => {
    expect(Object.keys(CLEF_LABEL_KEY).sort()).toEqual([...CLEFS].sort());
    for (const clef of CLEFS) {
      expect(CLEF_LABEL_KEY[clef]).toBe(`clef.${clef}`);
    }
  });

  it("offers every clef and no none — a stave always has one", () => {
    expect(CLEF_OPTIONS.map((o) => o.value)).toEqual([...CLEFS]);
    expect(CLEF_OPTIONS.map((o) => o.labelKey)).toEqual(
      CLEFS.map((clef) => CLEF_LABEL_KEY[clef]),
    );
    expect(CLEF_OPTIONS.some((o) => String(o.value) === INHERIT_CLEF)).toBe(
      false,
    );
  });

  it("names every theme mode, `system` included", () => {
    // `system` is an option a reader picks rather than the absence of one, so
    // it is labelled like the other two rather than left to a placeholder.
    expect(Object.keys(THEME_MODE_LABEL_KEY).sort()).toEqual(
      [...THEME_MODES].sort(),
    );
    expect(THEME_MODE_OPTIONS.map((o) => o.value)).toEqual([...THEME_MODES]);
    expect(THEME_MODE_OPTIONS.map((o) => o.labelKey)).toEqual([
      "settings.themeLight",
      "settings.themeDark",
      "settings.themeSystem",
    ]);
  });
});
