/**
 * An instrument's compass.
 *
 * The numbers themselves live in `gm-catalogue.ts`, one row per program. They
 * used to live here as a family default plus 38 overrides, which meant 90
 * programs inherited a compass nobody had chosen for them — see that module's
 * doc for what that hid.
 */
import { FULL_KEYBOARD, gmSpec, type MidiRange } from "./gm-catalogue.js";

/**
 * `MidiRange` and `FULL_KEYBOARD` are declared in `gm-catalogue.ts` and
 * re-exported here, so `./gm-range.js` stays the module they are imported from.
 * They were declared here, and the rows over there read `FULL_KEYBOARD` while
 * building — a cycle that threw a TDZ `ReferenceError` on whichever of the two
 * a runtime happened to enter first. Declaring them beside the table they
 * describe is what points the arrows one way.
 */
export { FULL_KEYBOARD, type MidiRange };

/**
 * The practical range for `program`, or the full keyboard for an unknown one —
 * benefit of the doubt rather than edits blocked against a guess.
 */
export function gmInstrumentRange(program: number): MidiRange {
  return gmSpec(program)?.range ?? FULL_KEYBOARD;
}
