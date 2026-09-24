/**
 * Line art per General MIDI program — every one of the 128 programs and 8
 * kits its own icon, projected from its 3D spatial model
 * (`icon-from-model.ts`), so the track gutter's glyph and the instrument
 * on the Spatial stage are two views of one authored shape.
 *
 * This replaced a hand-drawn set of eighteen glyphs shared across
 * families (every string instrument was one violin outline, every brass
 * one trumpet), which had two problems the moment the stage view existed:
 * a viola and a cello were indistinguishable in the gutter, and a glyph
 * drawn by hand could not keep up with a model built from real
 * dimensions. Deriving the icon from the model keeps one source of truth
 * and makes "128 distinct icons" a property of the data rather than a
 * drawing task.
 *
 * Single-colour strokes on the same 24×24 grid as before (`icon-art.ts`),
 * drawn with no fill, so every consumer — the canvas gutter, the app's
 * `<svg>`, the native app — is unchanged.
 */
import { gmKitSpatialModel, gmSpatialModelFor } from "./gm-spatial-model";
import type { InstrumentIconArt } from "./icon-art";
import { iconFromModel } from "./icon-from-model";

/**
 * The art for a drum kit at `kitProgram` (see `GM_KITS`). Not reachable
 * through `gmInstrumentIcon`: a kit is addressed by a program number that
 * means something else entirely in the melodic table — Brush is 40, where
 * the instrument art is a violin.
 */
export function gmKitIcon(kitProgram = 0): InstrumentIconArt {
  return iconFromModel(gmKitSpatialModel(kitProgram).model);
}

/** The art for `program` — its own model's projection; an out-of-range program draws its family's representative rather than nothing. */
export function gmInstrumentIcon(program: number): InstrumentIconArt {
  return iconFromModel(gmSpatialModelFor(program).model);
}
