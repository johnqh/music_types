/**
 * Which drawn glyph each toolbar choice uses.
 *
 * The shapes are `NOTATION_ICONS` (generated, next door); this is the part
 * both toolbars had each written out as a list — note value to glyph,
 * accidental to glyph — and that agreed only because
 * nobody had redrawn one. Records keyed by the vocabulary, never parallel
 * arrays, so a sixth accidental or a seventh base duration fails to compile
 * here instead of drawing nothing in one app.
 *
 * The component that replays a glyph stays in each app; a name is the one
 * thing about a drawing a platform-free package can hold.
 */
import type { Accidental } from "../../index.js";
import type { BaseDuration } from "../time/duration-modifiers.js";
import type { NotationIconName } from "./notation-icon-art.js";

/** The note glyph for each base duration. */
export const DURATION_ICON: Record<BaseDuration, NotationIconName> = {
  whole: "WholeNoteIcon",
  half: "HalfNoteIcon",
  quarter: "QuarterNoteIcon",
  eighth: "EighthNoteIcon",
  sixteenth: "SixteenthNoteIcon",
  thirtysecond: "ThirtySecondNoteIcon",
};

/** The glyph for each accidental. */
export const ACCIDENTAL_ICON: Record<Accidental, NotationIconName> = {
  [-2]: "DoubleFlatIcon",
  [-1]: "FlatIcon",
  [0]: "NaturalIcon",
  [1]: "SharpIcon",
  [2]: "DoubleSharpIcon",
};
