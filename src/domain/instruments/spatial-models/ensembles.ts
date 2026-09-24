/**
 * Programs 52–53: the sung parts. A choir of seven on risers, and a solo
 * voice at a microphone. (48–51, 54 and 55 resolve to string sections and
 * synths in bowed.ts / synths.ts.)
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { figure, micStand } from "../spatial-parts";
import { box, merge, rect, type Strokes } from "../spatial-geometry";

/** A singer holding a folder at chest height. */
function chorister(at: Vec3): Strokes {
  const hands: readonly [Vec3, Vec3] = [
    [-0.09, 1.15, 0.2],
    [0.11, 1.12, 0.2],
  ];
  return merge(figure(at, { hands }), [rect([at[0] + 0.01, 1.2, at[2] + 0.2], 0.24, 0.3, "xy")]);
}

function choir(): Strokes {
  const out = box([0, 0.1, 0.8], [2.6, 0.2, 0.5]);
  for (const x of [-0.9, -0.3, 0.3, 0.9]) out.push(...chorister([x, 0.2, 0.8]));
  for (const x of [-0.6, 0, 0.6]) out.push(...chorister([x, 0, 0.15]));
  return out;
}
export const CHOIR_AAHS: InstrumentSpatialModel = spatialModel("choir-aahs", choir());

export const VOICE_OOHS: InstrumentSpatialModel = spatialModel(
  "voice-oohs",
  merge(
    figure([0, 0, 0], {
      hands: [
        [-0.1, 1.2, 0.26],
        [0.12, 1.08, 0.28],
      ],
    }),
    micStand([0.05, 0, 0.42], [0.02, 1.46, 0.28]),
  ),
);
