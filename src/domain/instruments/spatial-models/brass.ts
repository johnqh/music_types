/**
 * Programs 56–61: trumpet, trombone, tuba, muted trumpet, French horn and
 * a brass section. (62–63, the synth brass, are keyboards — see synths.ts.)
 *
 * Dimensions: B♭ trumpet 0.48 m, 12.4 cm bell, three piston valves; tenor
 * trombone with the slide closed ≈ 1.17 m overall, 21 cm bell, the bell
 * section over the left shoulder; a 4-valve tuba ≈ 1.0 m tall in the lap,
 * 42 cm bell; double horn with a 31 cm bell and ~35 cm of coil, bell to the
 * player's right and down with the hand in it.
 *
 * The trumpet and trombone are built with the mouthpiece at the origin and
 * the bell along +z, then carried to the lips (1.5 m) and tipped a few
 * degrees down; the tuba and horn are built in place.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { bentTube, lathe, line, merge, place, ring, rotateX, translate, tube, type Strokes } from "../spatial-geometry";

const LIPS: Vec3 = [0, 1.5, 0.1];
const X: Vec3 = [1, 0, 0];

function mouthpiece(at: Vec3, along: Vec3): Strokes {
  return bentTube(
    [at, [at[0] + along[0] * 0.015, at[1] + along[1] * 0.015, at[2] + along[2] * 0.015], [at[0] + along[0] * 0.035, at[1] + along[1] * 0.035, at[2] + along[2] * 0.035]],
    [0.014, 0.009, 0.006],
    { segments: 8, meridians: 4, up: X },
  );
}

function trumpet(): Strokes {
  const out = merge(
    mouthpiece([0.012, -0.02, 0], [0, 0, 1]),
    // Leadpipe forward to the tuning slide, and back to the valves.
    bentTube(
      [
        [0.012, -0.02, 0.035],
        [0.014, -0.02, 0.26],
        [0.014, -0.035, 0.29],
        [0.014, -0.06, 0.29],
        [0.014, -0.075, 0.26],
        [0.014, -0.075, 0.13],
      ],
      0.0065,
      { segments: 8, meridians: 4, up: X },
    ),
    // Bell pipe from the valves, flaring to the rim.
    bentTube(
      [
        [-0.012, -0.01, 0.13],
        [-0.012, -0.01, 0.3],
        [-0.012, -0.01, 0.38],
        [-0.012, -0.01, 0.41],
        [-0.012, -0.01, 0.44],
        [-0.012, -0.01, 0.46],
        [-0.012, -0.01, 0.475],
      ],
      [0.0075, 0.009, 0.012, 0.02, 0.032, 0.048, 0.062],
      { segments: 16, meridians: 6, up: X },
    ),
    [line([0.014, -0.05, 0.27], [-0.012, -0.03, 0.27]), line([0.014, -0.02, 0.15], [-0.012, -0.01, 0.15])],
  );
  for (const z of [0.11, 0.145, 0.18]) {
    out.push(...tube([0, -0.09, z], [0, 0.0, z], 0.011, { segments: 8, meridians: 3, rings: 2 }));
    out.push(ring([0, 0.012, z], 0.008, "y", 6), line([0, 0, z], [0, 0.012, z]));
    out.push(
      ...bentTube(
        [
          [-0.004, -0.09, z - 0.012],
          [-0.004, -0.125, z - 0.012],
          [-0.004, -0.14, z],
          [-0.004, -0.125, z + 0.012],
          [-0.004, -0.09, z + 0.012],
        ],
        0.0045,
        { segments: 6, meridians: 3, up: X },
      ),
    );
  }
  return out;
}
export const TRUMPET: InstrumentSpatialModel = spatialModel("trumpet", place(trumpet(), { pitch: 8, at: LIPS }));

function straightMute(): Strokes {
  const cone = rotateX(
    lathe(
      [
        [0.022, 0],
        [0.036, 0.06],
        [0.05, 0.12],
      ],
      { segments: 12, meridians: 4 },
    ),
    90,
  );
  const out = translate(cone, [-0.012, -0.01, 0.37]);
  for (let i = 0; i < 3; i++) {
    const t = (Math.PI * 2 * i) / 3;
    out.push(line([-0.012 + Math.cos(t) * 0.032, -0.01 + Math.sin(t) * 0.032, 0.42], [-0.012 + Math.cos(t) * 0.036, -0.01 + Math.sin(t) * 0.036, 0.45]));
  }
  return out;
}
export const MUTED_TRUMPET: InstrumentSpatialModel = spatialModel("muted-trumpet", place(merge(trumpet(), straightMute()), { pitch: 8, at: LIPS }));

function trombone(): Strokes {
  const upperY = 0;
  const lowerY = -0.052;
  const out = merge(
    mouthpiece([0, upperY, 0], [0, 0, 1]),
    tube([0, upperY, 0.035], [0, upperY, 0.72], 0.0075, { segments: 8, meridians: 4, rings: 3 }),
    tube([0, lowerY, 0.05], [0, lowerY, 0.72], 0.0075, { segments: 8, meridians: 4, rings: 3 }),
    // Outer slide over the front half of both tubes.
    tube([0, upperY, 0.36], [0, upperY, 0.72], 0.0095, { segments: 8, meridians: 2, rings: 2 }),
    tube([0, lowerY, 0.36], [0, lowerY, 0.72], 0.0095, { segments: 8, meridians: 2, rings: 2 }),
    bentTube(
      [
        [0, upperY, 0.72],
        [0, upperY - 0.006, 0.755],
        [0, (upperY + lowerY) / 2, 0.77],
        [0, lowerY + 0.006, 0.755],
        [0, lowerY, 0.72],
      ],
      0.0075,
      { segments: 6, meridians: 3, up: X },
    ),
    [line([0, upperY, 0.12], [0, lowerY, 0.12]), line([0, upperY, 0.36], [0, lowerY, 0.36]), line([0, upperY, 0.7], [0, lowerY, 0.7])],
    // Gooseneck and tuning slide behind the shoulder, then the bell pipe forward.
    bentTube(
      [
        [0, lowerY, 0.05],
        [0, lowerY, -0.05],
        [-0.03, -0.03, -0.16],
        [-0.08, 0.02, -0.2],
        [-0.11, 0.07, -0.15],
        [-0.11, 0.08, -0.05],
      ],
      0.009,
      { segments: 8, meridians: 4, up: X },
    ),
    bentTube(
      [
        [-0.11, 0.08, -0.05],
        [-0.11, 0.08, 0.3],
        [-0.11, 0.08, 0.4],
        [-0.11, 0.08, 0.47],
        [-0.11, 0.08, 0.52],
        [-0.11, 0.08, 0.55],
      ],
      [0.009, 0.011, 0.016, 0.028, 0.055, 0.105],
      { segments: 20, meridians: 6, up: X },
    ),
    [line([-0.11, 0.08, 0.1], [0, upperY, 0.1]), line([-0.11, 0.08, 0.3], [0, upperY, 0.3])],
  );
  return out;
}
export const TROMBONE: InstrumentSpatialModel = spatialModel("trombone", place(trombone(), { pitch: 6, at: [LIPS[0], LIPS[1], LIPS[2] - 0.02] }));

function tuba(): Strokes {
  const cz = 0.34;
  const center: Vec3 = [0.02, 0.68, cz];
  const path: Vec3[] = [];
  const radii: number[] = [];
  const turns = 1.7;
  const steps = Math.round(turns * 18);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.PI * 2 * turns * t - Math.PI / 2;
    const rx = 0.12 + 0.11 * t;
    const ry = rx * 1.25;
    path.push([center[0] + Math.cos(a) * rx, center[1] + Math.sin(a) * ry, cz + 0.06 * t]);
    radii.push(0.012 + 0.02 * t);
  }
  const bellStart = path[path.length - 1];
  const out = merge(
    bentTube(path, radii, { segments: 10, meridians: 4, up: [0, 0, 1] }),
    bentTube(
      [bellStart, [bellStart[0], 1.05, bellStart[2]], [bellStart[0], 1.18, bellStart[2]], [bellStart[0], 1.27, bellStart[2]], [bellStart[0], 1.33, bellStart[2]], [bellStart[0], 1.36, bellStart[2]]],
      [0.032, 0.04, 0.06, 0.1, 0.16, 0.21],
      { segments: 24, meridians: 8, up: [0, 0, 1] },
    ),
    bentTube(
      [path[0], [0.16, 0.8, 0.3], [0.1, 1.05, 0.2], [0.03, 1.2, 0.12], [0, 1.25, 0.1]],
      0.007,
      { segments: 6, meridians: 3, up: X },
    ),
    mouthpiece([0.02, 1.235, 0.11], [-0.6, 0.3, -0.1]),
  );
  for (let i = 0; i < 4; i++) {
    const x = 0.06 + i * 0.035;
    out.push(...tube([x, 0.88, 0.2], [x, 0.98, 0.2], 0.012, { segments: 8, meridians: 3 }));
    out.push(ring([x, 0.99, 0.2], 0.009, "y", 6));
  }
  return out;
}
export const TUBA: InstrumentSpatialModel = spatialModel("tuba", tuba());

function frenchHorn(): Strokes {
  const c: Vec3 = [0.12, 1.05, 0.22];
  const out: Strokes = [];
  for (const [r, dz] of [
    [0.11, -0.02],
    [0.145, 0.0],
    [0.18, 0.02],
  ])
    out.push(ring([c[0], c[1], c[2] + dz], r, "z", 28), ring([c[0], c[1], c[2] + dz], r + 0.007, "z", 28));
  out.push(
    ...bentTube(
      [
        [c[0] + 0.16, c[1] - 0.09, c[2]],
        [c[0] + 0.24, c[1] - 0.15, c[2] - 0.06],
        [c[0] + 0.3, c[1] - 0.2, c[2] - 0.14],
        [c[0] + 0.34, c[1] - 0.25, c[2] - 0.22],
        [c[0] + 0.36, c[1] - 0.27, c[2] - 0.28],
      ],
      [0.012, 0.015, 0.025, 0.06, 0.155],
      { segments: 20, meridians: 6, up: [0, 1, 0] },
    ),
    ...bentTube(
      [
        [c[0] - 0.1, c[1] + 0.1, c[2] - 0.02],
        [c[0] - 0.12, c[1] + 0.25, c[2] - 0.08],
        [c[0] - 0.12, c[1] + 0.4, c[2] - 0.12],
        [LIPS[0], LIPS[1], LIPS[2]],
      ],
      0.006,
      { segments: 6, meridians: 3, up: X },
    ),
    ...mouthpiece([LIPS[0], LIPS[1] - 0.01, LIPS[2] + 0.02], [-0.3, -1, 0.3]),
  );
  for (let i = 0; i < 3; i++) {
    const y = c[1] + 0.03 - i * 0.045;
    out.push(ring([c[0] - 0.13, y, c[2] + 0.02], 0.02, "x", 10), line([c[0] - 0.13, y, c[2] + 0.04], [c[0] - 0.16, y + 0.02, c[2] + 0.07]));
  }
  for (let i = 0; i < 3; i++) {
    const y = c[1] - 0.02 - i * 0.05;
    out.push(...bentTube([[c[0] - 0.16, y, c[2] - 0.02], [c[0] - 0.24, y, c[2] - 0.02], [c[0] - 0.26, y - 0.02, c[2] - 0.02], [c[0] - 0.24, y - 0.04, c[2] - 0.02], [c[0] - 0.16, y - 0.04, c[2] - 0.02]], 0.005, { segments: 6, meridians: 2, up: [0, 0, 1] }));
  }
  return out;
}
export const FRENCH_HORN: InstrumentSpatialModel = spatialModel("french-horn", frenchHorn());

export const BRASS_SECTION: InstrumentSpatialModel = spatialModel(
  "brass-section",
  merge(
    place(trumpet(), { pitch: 8, at: [-0.62, LIPS[1], LIPS[2]], yaw: 8 }),
    place(trombone(), { pitch: 6, at: [0, LIPS[1], LIPS[2] - 0.02] }),
    place(trumpet(), { pitch: 8, at: [0.62, LIPS[1], LIPS[2]], yaw: -8 }),
  ),
);
