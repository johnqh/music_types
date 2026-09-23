/**
 * How a score is looked at, as vocabulary: its layout, and the grids a
 * quantize offers.
 */
import type { DurationName } from "../../model/score";

/**
 * How the notation is laid out: `page` wraps systems to fit the width,
 * `continuous` lays every measure out in one long system.
 *
 * An array with the type read off it, so a toolbar offering the choice reads
 * this rather than writing the list out again — which is how one of them comes
 * to offer a mode the renderer no longer has.
 */
export const LAYOUT_MODES = ["page", "continuous"] as const;

export type LayoutMode = (typeof LAYOUT_MODES)[number];

/**
 * The grids a quantize is offered on.
 *
 * Stops at a thirty-second: below that a grid is finer than the deviations a
 * human performance actually has, so snapping to it changes nothing while
 * looking like it did something.
 */
export const QUANTIZE_GRIDS = [
  "quarter",
  "eighth",
  "sixteenth",
  "thirtysecond",
] as const satisfies readonly DurationName[];

export type QuantizeGrid = (typeof QUANTIZE_GRIDS)[number];

/** The short label a grid is written as on a bar: `1/16`. */
export const QUANTIZE_GRID_SHORT: Record<QuantizeGrid, string> = {
  quarter: "1/4",
  eighth: "1/8",
  sixteenth: "1/16",
  thirtysecond: "1/32",
};
