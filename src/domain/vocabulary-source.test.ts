/**
 * One declaration per vocabulary, and the type read off it.
 *
 * A TypeScript union has no runtime form, so anything that has to *validate* a
 * value must write the list out again — and then two declarations of one fact
 * drift. That is not hypothetical: `Dynamic` was a union here, a parallel
 * `DYNAMICS` array a few lines below kept in step by hand, and a third copy in
 * music_api's decoder. The decoder's copy is what a generated score was
 * checked against.
 *
 * Declaring the array and deriving the type removes the possibility: a value
 * added to the type IS a value added to the list, because they are one thing.
 * These tests exist so the shape cannot quietly revert.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import {
  ACCIDENTALS,
  ARTICULATIONS,
  BARLINE_STYLES,
  BEAM_OVERRIDES,
  CLEFS,
  DYNAMICS,
  GM_FAMILIES,
  HAIRPINS,
  ORNAMENTS,
  OTTAVAS,
  PITCH_STEPS,
  REPEAT_JUMPS,
  SYLLABICS,
  TRANSPORT_STATES,
} from "./../index.js";

/** Every closed vocabulary that both the model and a validator need. */
const VOCABULARIES: Record<string, readonly (string | number)[]> = {
  ACCIDENTALS,
  ARTICULATIONS,
  BARLINE_STYLES,
  BEAM_OVERRIDES,
  CLEFS,
  DYNAMICS,
  GM_FAMILIES,
  HAIRPINS,
  ORNAMENTS,
  OTTAVAS,
  PITCH_STEPS,
  REPEAT_JUMPS,
  SYLLABICS,
  TRANSPORT_STATES,
};

describe("closed vocabularies have one declaration", () => {
  it("exports a runtime list for each, so nothing has to retype it", () => {
    for (const [name, values] of Object.entries(VOCABULARIES)) {
      expect(values.length, `${name} is empty`).toBeGreaterThan(1);
      expect(new Set(values).size, `${name} repeats a value`).toBe(
        values.length,
      );
    }
  });

  it("declares each list exactly once in this package", () => {
    // The collision that started this: `DYNAMICS` existed twice in one file.
    const files = globSync("src/**/*.ts", { cwd: process.cwd() }).filter(
      (f) => !f.includes(".test."),
    );
    for (const name of Object.keys(VOCABULARIES)) {
      const declaring = files.filter((f) =>
        new RegExp(`^export const ${name}\\s*[:=]`, "m").test(
          readFileSync(f, "utf8"),
        ),
      );
      expect(
        declaring,
        `${name} is declared in ${declaring.length} files`,
      ).toHaveLength(1);
    }
  });

  it("derives the type from the list rather than restating it", () => {
    // A union written beside the array is a second declaration by another
    // name, and the two only agree until someone edits one of them.
    // Two files hold vocabularies now: the model's own, and the GM catalogue.
    const source = [
      readFileSync("src/model/score.ts", "utf8"),
      readFileSync("src/domain/instruments/gm.ts", "utf8"),
      readFileSync("src/domain/score/transport-state.ts", "utf8"),
    ].join("\n");
    for (const type of [
      "Accidental",
      "Articulation",
      "BarlineStyle",
      "BeamOverride",
      "Clef",
      "Dynamic",
      "GmFamily",
      "Hairpin",
      "Ornament",
      "Ottava",
      "PitchStep",
      "RepeatJump",
      "Syllabic",
      "TransportState",
    ]) {
      expect(source, `${type} should be derived from its list`).toMatch(
        new RegExp(`export type ${type} = \\(typeof [A-Z_]+\\)\\[number\\];`),
      );
    }
  });
});
