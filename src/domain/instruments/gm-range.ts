/**
 * An instrument's compass.
 *
 * The numbers themselves live in `gm-catalogue.ts`, one row per program. They
 * used to live here as a family default plus 38 overrides, which meant 90
 * programs inherited a compass nobody had chosen for them — see that module's
 * doc for what that hid.
 */
export type MidiRange = { min: number; max: number };

/** A0 to C8 — the 88-key piano, and the widest range anything here returns. */
export const FULL_KEYBOARD: MidiRange = { min: 21, max: 108 };

import { gmSpec } from "./gm-catalogue.js";

/**
 * The practical range for `program`, or the full keyboard for an unknown one —
 * benefit of the doubt rather than edits blocked against a guess.
 */
export function gmInstrumentRange(program: number): MidiRange {
  return gmSpec(program)?.range ?? FULL_KEYBOARD;
}
