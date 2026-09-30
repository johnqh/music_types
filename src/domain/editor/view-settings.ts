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
 * How much of the track-info column beside the staves is drawn, widest first.
 *
 * - `full`: the track's name, its instrument's icon and name, and whether it
 *   is muted or soloed.
 * - `icon`: the instrument's icon and nothing else, in a column just wide
 *   enough to hold it. The full column is a fifth of a tablet's width; the
 *   icon still says which staff is which.
 * - `hidden`: no column at all.
 *
 * An array with the type read off it: the choice is a device pref, so what is
 * read back from storage has to be validated against the list, and both apps
 * offer it from a control that must not write the list out again.
 */
export const TRACK_INFO_MODES = ["full", "icon", "hidden"] as const;

export type TrackInfoMode = (typeof TRACK_INFO_MODES)[number];

export function isTrackInfoMode(value: unknown): value is TrackInfoMode {
  return (TRACK_INFO_MODES as readonly unknown[]).includes(value);
}

/**
 * The name of each mode — what a control that switches to it is called. A
 * `Record`, so a fourth mode fails to compile rather than printing a key.
 * `hidden` keeps a name for a stored preference that says so; no control
 * offers it any more, the toolbar switching between the other two.
 */
export const TRACK_INFO_MODE_LABEL_KEY: Record<TrackInfoMode, string> = {
  full: "editor.trackInfoFull",
  icon: "editor.trackInfoIcon",
  hidden: "editor.trackInfoHidden",
};

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
