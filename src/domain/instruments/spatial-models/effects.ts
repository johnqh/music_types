/**
 * Programs 120–127, the sound effects. None is an instrument, so each is
 * the thing that makes the sound: an electric guitar (fret noise), a
 * breathing figure, a conch shell over waves (seashore), a bird on a
 * perch, a rotary telephone, a hovering helicopter, a row of clapping
 * hands (applause) and a starting pistol.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { figure } from "../spatial-parts";
import { box, ellipse, lathe, line, merge, place, ring, rotateZ, spiral, tube, type Strokes } from "../spatial-geometry";
import { ELECTRIC_GUITAR_CLEAN } from "./guitars";

export const GUITAR_FRET_NOISE: InstrumentSpatialModel = spatialModel("guitar-fret-noise", [...ELECTRIC_GUITAR_CLEAN.strokes]);

export const BREATH_NOISE: InstrumentSpatialModel = spatialModel(
  "breath-noise",
  merge(
    figure([0, 0, 0], {
      hands: [
        [-0.28, 0.85, 0.06],
        [0.06, 1.42, 0.16],
      ],
    }),
    [ellipse([0, 1.5, 0.3], 0.06, 0.03, "y", 10), ellipse([0, 1.5, 0.42], 0.1, 0.05, "y", 12)],
  ),
);

function seashore(): Strokes {
  const shell = merge(
    lathe(
      [
        [0.0, 0],
        [0.03, 0.03],
        [0.055, 0.08],
        [0.065, 0.13],
        [0.05, 0.17],
        [0.02, 0.19],
      ],
      { segments: 12, meridians: 5 },
    ),
    [spiral([0, 0.17, 0.0], 0.005, 0.04, 1.5, "xz", 12)],
  );
  const out = place(shell, { pitch: 70, roll: 30, at: [0.12, 1.35, 0.25] });
  for (let w = 0; w < 3; w++) {
    const pts: Vec3[] = [];
    for (let i = 0; i <= 30; i++) {
      const x = -1.0 + (2.0 * i) / 30;
      pts.push([x, 0.02 + 0.03 * Math.sin(i * 0.9 + w), 0.6 + w * 0.3 + 0.05 * Math.cos(i * 0.6)]);
    }
    out.push(pts);
  }
  return out;
}
export const SEASHORE: InstrumentSpatialModel = spatialModel("seashore", seashore());

function bird(): Strokes {
  const body = rotateZ(
    lathe(
      [
        [0.0, -0.06],
        [0.03, -0.03],
        [0.04, 0.02],
        [0.03, 0.05],
        [0.015, 0.07],
      ],
      { segments: 10, meridians: 4 },
    ),
    -90,
  );
  const out = merge(body, [ring([0.09, 0.03, 0], 0.028, "z", 10), ring([0.09, 0.03, 0], 0.028, "x", 10)]);
  out.push([
    [0.115, 0.03, 0],
    [0.15, 0.025, 0],
    [0.115, 0.02, 0],
  ]);
  out.push([
    [-0.06, 0.0, 0],
    [-0.13, 0.04, -0.02],
    [-0.13, 0.04, 0.02],
    [-0.06, 0.0, 0],
  ]);
  for (const s of [-1, 1]) out.push(ellipse([0.0, 0.02, s * 0.03], 0.05, 0.025, "y", 8));
  out.push(line([0.02, -0.03, 0.01], [0.02, -0.07, 0.01]), line([-0.01, -0.03, -0.01], [-0.01, -0.07, -0.01]));
  return merge(place(out, { at: [0.2, 1.37, 0.4] }), tube([0.2, 0, 0.4], [0.2, 1.3, 0.4], 0.012, { segments: 6, meridians: 2 }), [line([0.05, 1.3, 0.4], [0.35, 1.3, 0.4])]);
}
export const BIRD_TWEET: InstrumentSpatialModel = spatialModel("bird-tweet", bird());

function telephone(): Strokes {
  const tableY = 0.8;
  const base: Vec3 = [0, tableY + 0.05, 0.45];
  const out = merge(box([0, tableY - 0.015, 0.45], [0.5, 0.03, 0.4]), box(base, [0.22, 0.1, 0.25]), [ring([0, tableY + 0.101, 0.42], 0.06, "y", 12), ring([0, tableY + 0.101, 0.42], 0.035, "y", 10)]);
  for (let i = 0; i < 10; i++) {
    const t = (Math.PI * 2 * i) / 10;
    out.push(ring([Math.cos(t) * 0.048, tableY + 0.102, 0.42 + Math.sin(t) * 0.048], 0.006, "y", 6));
  }
  const cradle = tube([-0.09, tableY + 0.14, 0.52], [0.09, tableY + 0.14, 0.52], 0.02, { segments: 8, meridians: 3, rings: 5 });
  out.push(...cradle, ...lathe([[0.03, 0], [0.035, 0.02]], { segments: 8, meridians: 3 }).map((s) => s.map(([x, y, z]): Vec3 => [x - 0.11, y + tableY + 0.12, z + 0.52])));
  out.push(...lathe([[0.03, 0], [0.035, 0.02]], { segments: 8, meridians: 3 }).map((s) => s.map(([x, y, z]): Vec3 => [x + 0.11, y + tableY + 0.12, z + 0.52])));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(line([sx * 0.22, 0, 0.45 + sz * 0.17], [sx * 0.22, tableY - 0.03, 0.45 + sz * 0.17]));
  return out;
}
export const TELEPHONE_RING: InstrumentSpatialModel = spatialModel("telephone-ring", telephone());

function helicopter(): Strokes {
  const c: Vec3 = [0, 1.9, 0.8];
  const body = rotateZ(
    lathe(
      [
        [0.02, -0.3],
        [0.1, -0.15],
        [0.13, 0.0],
        [0.11, 0.15],
        [0.06, 0.25],
      ],
      { segments: 10, meridians: 4 },
    ),
    -90,
  );
  const out = place(body, { at: c });
  out.push(line([c[0] - 0.3, c[1] + 0.02, c[2]], [c[0] - 0.85, c[1] + 0.08, c[2]]));
  out.push(line([c[0] - 0.3, c[1] - 0.04, c[2]], [c[0] - 0.85, c[1] + 0.04, c[2]]));
  out.push(ring([c[0] - 0.85, c[1] + 0.08, c[2] + 0.03], 0.09, "z", 10), line([c[0] - 0.85, c[1] - 0.01, c[2] + 0.03], [c[0] - 0.85, c[1] + 0.17, c[2] + 0.03]));
  out.push(line([c[0], c[1] + 0.13, c[2]], [c[0], c[1] + 0.2, c[2]]), ring([c[0], c[1] + 0.2, c[2]], 0.55, "y", 24));
  out.push(line([c[0] - 0.55, c[1] + 0.2, c[2]], [c[0] + 0.55, c[1] + 0.2, c[2]]), line([c[0], c[1] + 0.2, c[2] - 0.55], [c[0], c[1] + 0.2, c[2] + 0.55]));
  for (const sz of [-1, 1]) out.push(line([c[0] - 0.22, c[1] - 0.22, c[2] + sz * 0.14], [c[0] + 0.22, c[1] - 0.22, c[2] + sz * 0.14]), line([c[0] - 0.1, c[1] - 0.12, c[2] + sz * 0.08], [c[0] - 0.14, c[1] - 0.22, c[2] + sz * 0.14]), line([c[0] + 0.1, c[1] - 0.12, c[2] + sz * 0.08], [c[0] + 0.14, c[1] - 0.22, c[2] + sz * 0.14]));
  return out;
}
export const HELICOPTER: InstrumentSpatialModel = spatialModel("helicopter", helicopter());

function applause(): Strokes {
  const out: Strokes = [];
  for (const x of [-0.9, -0.3, 0.3, 0.9]) {
    // Hands are in the figure's own frame; `figure` carries them to `at`.
    out.push(...figure([x, 0, 0], { hands: [[-0.04, 1.22, 0.24], [0.06, 1.2, 0.24]] }));
    out.push(ellipse([x + 0.01, 1.21, 0.26], 0.035, 0.06, "y", 8));
  }
  return out;
}
export const APPLAUSE: InstrumentSpatialModel = spatialModel("applause", applause());

function pistol(): Strokes {
  const out = merge(
    tube([0, 0, 0], [0, 0.16, 0], 0.011, { segments: 8, meridians: 4, rings: 2 }),
    box([0, -0.05, -0.01], [0.03, 0.1, 0.045]),
    [ring([0, -0.03, 0.02], 0.025, "x", 10, { from: 180, to: 360 }), line([0, -0.01, 0.02], [0, -0.03, 0.03])],
  );
  return place(out, { at: [0.28, 1.55, 0.2] });
}
export const GUNSHOT: InstrumentSpatialModel = spatialModel("gunshot", pistol());
