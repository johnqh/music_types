/**
 * The drawing vocabulary instrument spatial models are authored in: a tiny,
 * renderer-neutral wireframe format, parallel to `icon-art.ts` but in three
 * dimensions and for a different purpose.
 *
 * The 2D icon set draws a small, flat, single-colour glyph for a track
 * gutter. This draws a *played pose* — how the instrument actually sits when
 * held — as floating lines a listener walks through in the "Spatial" 3D
 * view. Authored data only: no `three`, no scene graph, nothing that assumes
 * a renderer. `@sudobility/music_spatial_core` is what turns this into an
 * actual drawable geometry; this module only has to describe the shape.
 */

/** A point in an instrument's own rest frame: x = right, y = up, z = forward
 *  (the direction a bell, bow tip, or scroll points when the instrument is
 *  held to play). Authored units, not meters — `InstrumentPose.scale`
 *  converts to the stage's own scale. */
export type Vec3 = readonly [number, number, number];

/** One wireframe polyline, drawn as connected line segments — not a closed
 *  loop unless the first and last points coincide. At least two points. */
export type SpatialStroke = readonly Vec3[];

/** One instrument's wireframe: a set of strokes and the sphere that bounds
 *  them, for stage spacing and frustum culling. `id` is a stable key, useful
 *  in tests and debugging, never shown. */
export type InstrumentSpatialModel = {
  readonly id: string;
  readonly strokes: readonly SpatialStroke[];
  readonly boundsRadius: number;
};

/** How a model is placed at a track's stage position: offset, rotation, and
 *  scale from the authored rest frame into stage space. This is where
 *  "played as held" lives — e.g. the violin's pose tilts it forward and
 *  down from horizontal, the cello's rotates it upright. */
export type InstrumentPose = {
  readonly position: Vec3;
  /** Euler XYZ, degrees, applied in the model's own local frame before the
   *  stage offset. */
  readonly rotationDeg: Vec3;
  /** Stage units per authored unit. */
  readonly scale: number;
};

export type PlayedInstrumentModel = {
  readonly model: InstrumentSpatialModel;
  readonly pose: InstrumentPose;
};

/** The pose every model starts from unless it needs otherwise: no offset, no
 *  rotation, unit scale. Most wind and brass instruments — held roughly
 *  level, pointing forward — use this untouched. */
export const NEUTRAL_POSE: InstrumentPose = {
  position: [0, 0, 0],
  rotationDeg: [0, 0, 0],
  scale: 1,
};

function strokeBoundsRadius(strokes: readonly SpatialStroke[]): number {
  let max = 0;
  for (const stroke of strokes) {
    for (const [x, y, z] of stroke) {
      const r = Math.sqrt(x * x + y * y + z * z);
      if (r > max) max = r;
    }
  }
  return max;
}

/** Builds a model from strokes, deriving `boundsRadius` rather than asking
 *  an author to compute and keep it in sync by hand. */
export function spatialModel(
  id: string,
  strokes: readonly SpatialStroke[],
): InstrumentSpatialModel {
  return { id, strokes, boundsRadius: strokeBoundsRadius(strokes) };
}

/** `model` at `NEUTRAL_POSE` — the common case, an instrument that needs no
 *  offset/rotation/scale beyond how it was authored. */
export function playedNeutral(
  model: InstrumentSpatialModel,
): PlayedInstrumentModel {
  return { model, pose: NEUTRAL_POSE };
}

/** `model` at an explicit pose, for the instruments that genuinely need one
 *  — a violin's forward-and-down tilt, a cello's upright rotation. */
export function played(
  model: InstrumentSpatialModel,
  pose: Partial<InstrumentPose>,
): PlayedInstrumentModel {
  return { model, pose: { ...NEUTRAL_POSE, ...pose } };
}
