/**
 * The instrument reference table, as rows ready to print.
 *
 * Read from `GM_CATALOGUE` rather than written out, so it cannot go stale —
 * and it puts `basis` in front of a reader, which is the thing worth knowing:
 * a compass somebody checked and one nobody checked look identical everywhere
 * else. The web documentation built these cells inline; the native docs need
 * the same table, and a second transcription of the formatting would be a
 * second place for a range to be spelled differently.
 */
import type { Pitch } from "../../index.js";
import { midiToPitch } from "../pitch/pitch.js";
import { GM_FAMILY_LABELS } from "./gm.js";
import type { GmFamily } from "./gm.js";
import { GM_CATALOGUE, UNLIMITED_POLYPHONY } from "./gm-catalogue.js";
import type { InstrumentBasis } from "./gm-catalogue.js";

export type GmInstrumentRow = {
  program: number;
  name: string;
  family: GmFamily;
  /** The family's fixed GM name. */
  familyLabel: string;
  /** Sounding compass, `E3–D6`, accidentals as `♯`/`♭`. */
  range: string;
  /** Notes at once; `null` for unlimited, which the app words. */
  polyphony: number | null;
  /** Semitones sounding-to-written, signed (`+2`), or `—` for none. */
  transposition: string;
  basis: InstrumentBasis;
  /** `docs.instruments.basis.<basis>`. */
  basisKey: string;
};

const SIGN: Record<Pitch["accidental"], string> = {
  [-2]: "𝄫",
  [-1]: "♭",
  [0]: "",
  [1]: "♯",
  [2]: "𝄪",
};

function noteName(midi: number): string {
  const pitch = midiToPitch(midi);
  return `${pitch.step}${SIGN[pitch.accidental]}${pitch.octave}`;
}

/**
 * The catalogue filtered by what was typed, formatted.
 *
 * Matches a name case-insensitively and by substring, a program number
 * exactly, or a family key by substring — the web table's rule.
 */
export function gmInstrumentRows(query: string): GmInstrumentRow[] {
  const needle = query.trim().toLowerCase();
  return GM_CATALOGUE.filter(
    (spec) =>
      needle.length === 0 ||
      spec.name.toLowerCase().includes(needle) ||
      String(spec.program) === needle ||
      spec.family.includes(needle),
  ).map((spec) => ({
    program: spec.program,
    name: spec.name,
    family: spec.family,
    familyLabel: GM_FAMILY_LABELS[spec.family],
    range: `${noteName(spec.range.min)}–${noteName(spec.range.max)}`,
    polyphony:
      spec.maxPolyphony === UNLIMITED_POLYPHONY ? null : spec.maxPolyphony,
    transposition:
      spec.writtenTransposition === 0
        ? "—"
        : `${spec.writtenTransposition > 0 ? "+" : ""}${spec.writtenTransposition}`,
    basis: spec.basis,
    basisKey: `docs.instruments.basis.${spec.basis}`,
  }));
}
