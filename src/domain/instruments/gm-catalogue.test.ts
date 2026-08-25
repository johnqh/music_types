/**
 * The catalogue's own integrity.
 *
 * One row per program is only better than family defaults if the rows are
 * complete and internally consistent — otherwise it is the same gap with more
 * typing. These check the things a hand-maintained table of 128 rows actually
 * gets wrong.
 */
import { describe, expect, it } from "vitest";
import {
  GM_CATALOGUE,
  gmFamilyForProgram,
  gmRangeIsBinding,
  gmSpec,
  INSTRUMENT_BASES,
  UNLIMITED_POLYPHONY,
} from "./gm-catalogue.js";
import { GM_INSTRUMENTS, gmFamilyOf } from "./gm.js";
import { MAX_MIDI, MIN_MIDI } from "../validation/limits.js";

describe("the GM catalogue", () => {
  it("has exactly one row per program, in program order", () => {
    expect(GM_CATALOGUE).toHaveLength(128);
    GM_CATALOGUE.forEach((spec, i) => expect(spec.program).toBe(i));
  });

  it("agrees with the name catalogue, so an instrument cannot be two things", () => {
    // The names were already single-source; this keeps them that way now that
    // a second table mentions them.
    for (const spec of GM_CATALOGUE) {
      expect(spec.name, `program ${spec.program}`).toBe(
        GM_INSTRUMENTS[spec.program].name,
      );
    }
  });

  it("puts every program in the family its number says", () => {
    // Families are runs of eight, so a row claiming another one is a typo.
    for (const spec of GM_CATALOGUE) {
      expect(spec.family, spec.name).toBe(gmFamilyForProgram(spec.program));
      expect(spec.family, spec.name).toBe(gmFamilyOf(spec.program));
    }
  });

  it("states a usable compass on every row", () => {
    for (const spec of GM_CATALOGUE) {
      expect(spec.range.min, spec.name).toBeGreaterThanOrEqual(MIN_MIDI);
      expect(spec.range.max, spec.name).toBeLessThanOrEqual(MAX_MIDI);
      // An octave is the least that could be called a compass; anything
      // narrower is a typo, not an instrument.
      expect(spec.range.max - spec.range.min, spec.name).toBeGreaterThanOrEqual(
        12,
      );
    }
  });

  it("states a polyphony that is a count or unlimited", () => {
    for (const spec of GM_CATALOGUE) {
      if (spec.maxPolyphony === UNLIMITED_POLYPHONY) continue;
      expect(Number.isInteger(spec.maxPolyphony), spec.name).toBe(true);
      expect(spec.maxPolyphony, spec.name).toBeGreaterThan(0);
    }
  });

  it("keeps transposition inside two octaves either way", () => {
    // The widest real one is the baritone saxophone at an octave and a sixth.
    for (const spec of GM_CATALOGUE) {
      expect(Math.abs(spec.writtenTransposition), spec.name).toBeLessThanOrEqual(
        24,
      );
    }
  });

  it("says where every row's numbers came from", () => {
    for (const spec of GM_CATALOGUE) {
      expect(INSTRUMENT_BASES, spec.name).toContain(spec.basis);
      expect(spec.note.length, spec.name).toBeGreaterThan(10);
    }
  });

  it("binds a range only where somebody checked it", () => {
    /*
      The point of `basis`. Refusing a note against a compass nobody verified
      rejects music that was fine — and with the generation retry loop reading
      these numbers, that costs real money as well as good music.
    */
    expect(gmRangeIsBinding(40)).toBe(true); // Violin — measured
    expect(gmRangeIsBinding(104)).toBe(false); // Sitar — assumed
    expect(gmRangeIsBinding(88)).toBe(false); // Pad 1 — synthetic
    expect(gmRangeIsBinding(127)).toBe(false); // Gunshot — unpitched
  });

  it("gives a synthetic patch and a sound effect the whole keyboard", () => {
    /*
      Narrowing an electronic patch would be inventing a limit, and a gunshot
      has no register to sit in.

      Untuned PERCUSSION is `unpitched` too but deliberately not included: a
      woodblock or an agogo has a characteristic sound with a natural register,
      and the range is what the on-screen keyboard offers. Nothing refuses a
      note against it either way — `gmRangeIsBinding` is false for both.
    */
    for (const spec of GM_CATALOGUE) {
      const isEffect = spec.family === "sound-effects";
      if (spec.basis !== "synthetic" && !isEffect) continue;
      expect(spec.range.min, spec.name).toBeLessThanOrEqual(24);
      expect(spec.range.max, spec.name).toBeGreaterThanOrEqual(96);
    }
  });

  it("answers null outside 0-127 rather than guessing", () => {
    expect(gmSpec(-1)).toBeNull();
    expect(gmSpec(128)).toBeNull();
  });

  it.each([
    // Instrument, program, sounding range, and where the numbers came from.
    ["Clavinet", 7, 29, 88, "60 keys, F1-E6"],
    ["Celesta", 8, 60, 108, "C4-C8"],
    ["Glockenspiel", 9, 79, 108, "G5-C8"],
    ["Vibraphone", 11, 53, 89, "F3-F6"],
    ["Marimba", 12, 36, 96, "C2-C7, the five-octave concert instrument"],
    ["Xylophone", 13, 65, 108, "F4-C8"],
    ["Tubular Bells", 14, 60, 79, "C4-F5 written, to G5 on professional models"],
    ["Timpani", 47, 38, 57, "D2-A3 across a set"],
    ["Violin", 40, 55, 100, "G3-E7"],
    ["Viola", 41, 48, 88, "C3-E6"],
    ["Cello", 42, 36, 84, "C2-C6"],
    ["Trombone", 57, 40, 77, "E2-F5"],
    ["Tuba", 58, 26, 65, "D1-F4"],
    ["French Horn", 60, 35, 77, "B1-F5 sounding"],
    ["Alto Sax", 65, 49, 81, "D-flat3-A-flat5 sounding"],
    ["Bassoon", 70, 34, 75, "B-flat1-E-flat5"],
    ["Piccolo", 72, 74, 108, "D5-C8 sounding"],
    ["Flute", 73, 60, 98, "C4-D7"],
    ["Shakuhachi", 77, 62, 91, "D4 fundamental, two octaves and a partial third"],
    ["Steel Drums", 114, 33, 91, "steelpan family A1-G6"],
    ["Whistle", 78, 74, 98, "a D tin whistle, D5-D7"],
    ["Shanai", 111, 57, 81, "A3-A5"],
    ["Ocarina", 79, 69, 89, "a 12-hole alto C, A4-F6"],
    ["Bagpipe", 109, 62, 86, "Highland and uilleann chanters together"],
    ["Fiddle", 110, 55, 100, "a fiddle is a violin"],
  ])(
    "keeps %s at the compass its source gives it",
    (name, program, min, max) => {
      /*
        Each of these was looked up rather than inherited. Pinning them means a
        future edit has to disagree with a source rather than with nothing —
        and it catches the mistake actually made while writing this table, when
        the steelpan's range was typed onto Woodblock (115) instead of Steel
        Drums (114), where it read as researched and was simply in the wrong
        row.
      */
      const spec = gmSpec(program)!;
      expect(spec.name).toBe(name);
      expect(spec.basis).toBe("measured");
      expect(spec.range).toEqual({ min, max });
    },
  );

  it("matches the recorded table, so no row moves without somebody looking", () => {
    /*
      A snapshot rather than a second copy of the data: it is generated, so it
      is a recording and not a declaration to keep in step — and any edit to
      any of the 128 rows shows up as a diff naming the instrument.

      This is the guard that actually catches the mistake made while writing
      this table. The steelpan's range was typed onto Woodblock instead of
      Steel Drums, where it read as researched and was simply in the wrong row;
      pinning Steel Drums did not catch it, because Steel Drums was still
      right. Only pinning the whole table does.
    */
    expect(
      GM_CATALOGUE.map(
        (s) =>
          `${s.program} ${s.name}: ${s.range.min}-${s.range.max} poly=${s.maxPolyphony} tr=${s.writtenTransposition} ${s.basis}`,
      ),
    ).toMatchSnapshot();
  });

  it("has no rows left that nobody checked", () => {
    /*
      `assumed` meant "carried over from the old family default and never
      verified". Every one of the 31 has since been settled — most by looking
      the instrument up, and ten by finding that the honest answer is
      `tunable`: a shamisen is tuned to the singer, a koto to the piece, an
      mbira to notes that are not on the tempered scale at all. That is a
      different answer from "unverified", and it is the true one.

      A new row may be added as `assumed` while it is being worked out. It may
      not be left that way.
    */
    const unchecked = GM_CATALOGUE.filter((s) => s.basis === "assumed");
    expect(unchecked.map((s) => s.name)).toEqual([]);
  });

  it("gives a section the union of the instruments in it", () => {
    // Derived rather than looked up, so a string section cannot end up
    // narrower than the cello sitting inside it.
    const contrabass = gmSpec(43)!;
    const violin = gmSpec(40)!;
    for (const program of [44, 45, 48, 49]) {
      const section = gmSpec(program)!;
      expect(section.range.min, section.name).toBe(contrabass.range.min);
      expect(section.range.max, section.name).toBe(violin.range.max);
      // A section plays chords, whatever one player of it could manage.
      expect(section.maxPolyphony, section.name).toBe(UNLIMITED_POLYPHONY);
    }
    const brass = gmSpec(61)!;
    expect(brass.range.min).toBe(gmSpec(58)!.range.min); // Tuba
    expect(brass.range.max).toBe(gmSpec(56)!.range.max); // Trumpet
  });

  it("never binds a range that is not measured", () => {
    // The whole point of the field: refusing a note against a compass nobody
    // checked, or against an instrument with no fixed pitch, rejects music
    // that was fine.
    for (const spec of GM_CATALOGUE) {
      expect(gmRangeIsBinding(spec.program), spec.name).toBe(
        spec.basis === "measured",
      );
    }
  });

  it("fixes the muted trumpet, which the old family defaults missed", () => {
    /*
      The bug that justified the rewrite: program 59 had no transposition
      override, so a B-flat trumpet with a mute in its bell was treated as
      non-transposing and its part displayed a whole tone wrong. It transposes
      exactly as the open trumpet does.
    */
    expect(gmSpec(59)!.writtenTransposition).toBe(2);
    expect(gmSpec(59)!.writtenTransposition).toBe(
      gmSpec(56)!.writtenTransposition,
    );
    expect(gmSpec(59)!.range).toEqual(gmSpec(56)!.range);
  });
});
