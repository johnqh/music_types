/**
 * Programs 9–15, the chromatic percussion: bar instruments on their frames,
 * chimes, a music box and a hammered dulcimer.
 *
 * Dimensions: 3-octave vibraphone F3–F6 (37 bars over 1.36 m, bars 38→20 cm,
 * resonators to 42 cm, 0.86 high); 4.3-octave marimba A2–C7 (52 bars over
 * 1.8 m, bars 55→25 cm, arched resonators to 1.0 m, 0.9 high); 3.5-octave
 * xylophone F4–C8 (44 bars over 1.17 m); 2.5-octave glockenspiel G5–C8 in a
 * 62 × 32 cm case; tubular bells C4–F5, 18 tubes 155→105 cm on a 2 m frame;
 * a 20 cm music box; a 1.0 m hammered dulcimer on a stand.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { mallet, xStand } from "../spatial-parts";
import { box, line, merge, place, rect, ring, smoothOpen, translate, tube, type Strokes } from "../spatial-geometry";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const SHARP_AFTER = new Set(["C", "D", "F", "G", "A"]);

interface BarSpec {
  readonly naturals: number;
  readonly start: (typeof LETTERS)[number];
  readonly spacing: number;
  readonly bar: readonly [number, number];
  readonly width: number;
  readonly resonator?: readonly [number, number];
  readonly resonatorRadius?: number;
  readonly y: number;
  readonly zFront: number;
}

/** Two rows of graduated bars — naturals in front, accidentals raised and set back — with resonators under them. */
function barPercussion(spec: BarSpec): Strokes {
  const out: Strokes = [];
  const total = spec.naturals * spec.spacing;
  const x0 = -total / 2 + spec.spacing / 2;
  let letter = LETTERS.indexOf(spec.start);
  for (let i = 0; i < spec.naturals; i++) {
    const t = i / (spec.naturals - 1);
    const len = spec.bar[0] + (spec.bar[1] - spec.bar[0]) * t;
    const x = x0 + i * spec.spacing;
    out.push(rect([x, spec.y, spec.zFront], spec.width, len, "xz"));
    if (spec.resonator) {
      const rl = spec.resonator[0] + (spec.resonator[1] - spec.resonator[0]) * t;
      out.push(...tube([x, spec.y - 0.03, spec.zFront], [x, spec.y - 0.03 - rl, spec.zFront], spec.resonatorRadius ?? 0.02, { segments: 8, meridians: 2 }));
    }
    if (SHARP_AFTER.has(LETTERS[letter]) && i < spec.naturals - 1) {
      const bx = x + spec.spacing / 2;
      const bz = spec.zFront + len * 0.6;
      out.push(rect([bx, spec.y + 0.025, bz], spec.width, len * 0.92, "xz"));
      if (spec.resonator) {
        const rl = (spec.resonator[0] + (spec.resonator[1] - spec.resonator[0]) * t) * 0.92;
        out.push(...tube([bx, spec.y - 0.005, bz], [bx, spec.y - 0.005 - rl, bz], spec.resonatorRadius ?? 0.02, { segments: 8, meridians: 2 }));
      }
    }
    letter = (letter + 1) % 7;
  }
  return out;
}

/** A frame under a bar instrument: end panels, two rails, four legs on casters. */
function frame(width: number, y: number, zCenter: number, depth: number): Strokes {
  const out: Strokes = [];
  for (const sx of [-1, 1]) {
    out.push(rect([sx * (width / 2), y - 0.08, zCenter], depth, 0.12, "yz"));
    for (const sz of [-1, 1]) {
      const x = sx * (width / 2 - 0.05);
      const z = zCenter + sz * (depth / 2 - 0.05);
      out.push(line([x, 0.04, z], [x, y - 0.14, z]), ring([x, 0.04, z], 0.04, "x", 8));
    }
  }
  out.push(line([-width / 2, y - 0.14, zCenter - depth / 2], [width / 2, y - 0.14, zCenter - depth / 2]));
  out.push(line([-width / 2, y - 0.14, zCenter + depth / 2], [width / 2, y - 0.14, zCenter + depth / 2]));
  return out;
}

export const VIBRAPHONE: InstrumentSpatialModel = spatialModel(
  "vibraphone",
  merge(
    barPercussion({ naturals: 22, start: "F", spacing: 0.062, bar: [0.38, 0.2], width: 0.055, resonator: [0.42, 0.15], resonatorRadius: 0.024, y: 0.86, zFront: 0.55 }),
    frame(1.5, 0.86, 0.65, 0.55),
    box([-0.72, 0.62, 0.65], [0.1, 0.12, 0.14]),
    [rect([0, 0.03, 0.42], 0.12, 0.2, "xz"), line([0, 0.05, 0.4], [0, 0.72, 0.6])],
    mallet([-0.18, 1.08, 0.2], [-0.3, 0.9, 0.5]),
    mallet([0.18, 1.08, 0.2], [0.32, 0.9, 0.5]),
  ),
);

export const MARIMBA: InstrumentSpatialModel = spatialModel(
  "marimba",
  merge(
    // Resonators to 0.82 m under bars at 0.92: the lowest one clears the floor, as a real 4.3-octave frame's does.
    barPercussion({ naturals: 31, start: "A", spacing: 0.058, bar: [0.55, 0.25], width: 0.058, resonator: [0.82, 0.18], resonatorRadius: 0.03, y: 0.92, zFront: 0.62 }),
    frame(1.95, 0.92, 0.7, 0.62),
    mallet([-0.22, 1.1, 0.25], [-0.42, 0.94, 0.6]),
    mallet([-0.16, 1.1, 0.25], [-0.26, 0.94, 0.62]),
    mallet([0.16, 1.1, 0.25], [0.24, 0.94, 0.62]),
    mallet([0.22, 1.1, 0.25], [0.4, 0.94, 0.6]),
  ),
);

export const XYLOPHONE: InstrumentSpatialModel = spatialModel(
  "xylophone",
  merge(
    barPercussion({ naturals: 26, start: "F", spacing: 0.045, bar: [0.36, 0.14], width: 0.04, resonator: [0.28, 0.08], resonatorRadius: 0.018, y: 0.9, zFront: 0.5 }),
    frame(1.3, 0.9, 0.58, 0.45),
    mallet([-0.16, 1.08, 0.2], [-0.25, 0.94, 0.48], 0.012),
    mallet([0.16, 1.08, 0.2], [0.28, 0.94, 0.48], 0.012),
  ),
);

export const GLOCKENSPIEL: InstrumentSpatialModel = spatialModel(
  "glockenspiel",
  merge(
    barPercussion({ naturals: 18, start: "G", spacing: 0.03, bar: [0.13, 0.06], width: 0.025, y: 0.92, zFront: 0.48 }),
    box([0, 0.9, 0.55], [0.62, 0.06, 0.32]),
    // The case lid, open past vertical.
    [
      [
        [-0.31, 0.93, 0.71],
        [0.31, 0.93, 0.71],
        [0.31, 0.93 + 0.32 * Math.sin((105 * Math.PI) / 180), 0.71 + 0.32 * Math.cos((105 * Math.PI) / 180)],
        [-0.31, 0.93 + 0.32 * Math.sin((105 * Math.PI) / 180), 0.71 + 0.32 * Math.cos((105 * Math.PI) / 180)],
        [-0.31, 0.93, 0.71],
      ],
    ],
    xStand([0, 0, 0.55], 0.45, 0.87, 0.3),
    mallet([-0.1, 1.05, 0.25], [-0.15, 0.96, 0.45], 0.008),
    mallet([0.1, 1.05, 0.25], [0.17, 0.96, 0.45], 0.008),
  ),
);

function tubularBells(): Strokes {
  const out = merge(
    tube([-0.6, 0, 0.6], [-0.6, 2.0, 0.6], 0.02, { segments: 8, meridians: 2 }),
    tube([0.6, 0, 0.6], [0.6, 2.0, 0.6], 0.02, { segments: 8, meridians: 2 }),
    [line([-0.62, 2.0, 0.6], [0.62, 2.0, 0.6]), line([-0.62, 1.95, 0.55], [0.62, 1.95, 0.55]), line([-0.62, 1.95, 0.68], [0.62, 1.95, 0.68])],
    [rect([-0.6, 0.02, 0.6], 0.3, 0.55, "xz"), rect([0.6, 0.02, 0.6], 0.3, 0.55, "xz")],
    [line([-0.55, 0.5, 0.5], [0.55, 0.5, 0.5]), rect([0.35, 0.03, 0.3], 0.1, 0.22, "xz")],
  );
  // Front row: the naturals C4–F5; back row: the sharps, raised.
  const naturals = ["C", "D", "E", "F", "G", "A", "B", "C", "D", "E", "F"];
  for (let i = 0; i < naturals.length; i++) {
    const x = -0.5 + i * 0.1;
    const len = 1.55 - (0.5 * i) / (naturals.length - 1);
    out.push(...tube([x, 1.95, 0.55], [x, 1.95 - len, 0.55], 0.019, { segments: 8, meridians: 2 }));
    if (SHARP_AFTER.has(naturals[i]) && i < naturals.length - 1) {
      out.push(...tube([x + 0.05, 1.95 + 0.06, 0.68], [x + 0.05, 1.95 + 0.06 - len * 0.97, 0.68], 0.019, { segments: 8, meridians: 2 }));
    }
  }
  // Rawhide hammer.
  out.push(line([0.2, 1.2, 0.2], [0.05, 1.45, 0.45]));
  out.push(...tube([0.05, 1.42, 0.45], [0.02, 1.5, 0.45], 0.02, { segments: 8, meridians: 3 }));
  return out;
}
export const TUBULAR_BELLS: InstrumentSpatialModel = spatialModel("tubular-bells", tubularBells());

function musicBox(): Strokes {
  const c: Vec3 = [0, 1.05, 0.3];
  const out = box(c, [0.2, 0.1, 0.13]);
  const yTop = c[1] + 0.05;
  const zBack = c[2] + 0.065;
  const a = (110 * Math.PI) / 180;
  out.push([
    [-0.1, yTop, zBack],
    [0.1, yTop, zBack],
    [0.1, yTop + 0.13 * Math.sin(a), zBack + 0.13 * Math.cos(a)],
    [-0.1, yTop + 0.13 * Math.sin(a), zBack + 0.13 * Math.cos(a)],
    [-0.1, yTop, zBack],
  ]);
  out.push(...tube([-0.06, c[1] + 0.02, c[2] + 0.02], [0.06, c[1] + 0.02, c[2] + 0.02], 0.022, { segments: 10, meridians: 4, rings: 3 }));
  for (let i = 0; i < 18; i++) out.push(line([-0.055 + i * 0.0065, c[1] + 0.045, c[2] - 0.05], [-0.055 + i * 0.0065, c[1] + 0.045, c[2] - 0.005]));
  out.push([
    [0.1, c[1], c[2]],
    [0.13, c[1], c[2]],
    [0.13, c[1] + 0.03, c[2]],
  ]);
  return out;
}
export const MUSIC_BOX: InstrumentSpatialModel = spatialModel("music-box", musicBox());

function dulcimer(): Strokes {
  // Trapezoid: the long (bass) side nearest the player.
  const near = 0.35;
  const far = 0.75;
  const halfNear = 0.5;
  const halfFar = 0.28;
  const top = 0.83;
  const soundboard: Strokes = [
    [
      [-halfNear, top, near],
      [halfNear, top, near],
      [halfFar, top, far],
      [-halfFar, top, far],
      [-halfNear, top, near],
    ],
    [
      [-halfNear, top - 0.07, near],
      [halfNear, top - 0.07, near],
      [halfFar, top - 0.07, far],
      [-halfFar, top - 0.07, far],
      [-halfNear, top - 0.07, near],
    ],
    line([-halfNear, top, near], [-halfNear, top - 0.07, near]),
    line([halfNear, top, near], [halfNear, top - 0.07, near]),
    line([halfFar, top, far], [halfFar, top - 0.07, far]),
    line([-halfFar, top, far], [-halfFar, top - 0.07, far]),
    // Treble and bass bridges.
    line([-0.12, top + 0.02, near + 0.02], [-0.06, top + 0.02, far - 0.02]),
    line([0.2, top + 0.02, near + 0.02], [0.14, top + 0.02, far - 0.02]),
    ring([-0.3, top + 0.001, 0.5], 0.03, "y", 10),
    ring([0.32, top + 0.001, 0.5], 0.03, "y", 10),
  ];
  const courses: Strokes = [];
  for (let i = 0; i < 12; i++) {
    const z = near + 0.03 + i * (0.34 / 11);
    const hw = halfNear - (halfNear - halfFar) * ((z - near) / (far - near)) - 0.04;
    courses.push(line([-hw, top + 0.015, z], [hw, top + 0.015, z]));
  }
  const hammers = [
    smoothOpen(
      [
        [-0.2, 1.0],
        [-0.16, 0.95],
        [-0.1, 0.9],
      ],
      4,
    ).map(([x, y]): Vec3 => [x, y, 0.45]),
    smoothOpen(
      [
        [0.2, 1.0],
        [0.16, 0.95],
        [0.1, 0.9],
      ],
      4,
    ).map(([x, y]): Vec3 => [x, y, 0.5]),
  ];
  // Tilted 12° toward the player about its own center, not about the origin.
  const tilt = (strokes: Strokes) => place(translate(strokes, [0, -top, -0.55]), { pitch: -12, at: [0, top, 0.55] });
  return merge(tilt(soundboard), tilt(courses), hammers, xStand([0, 0, 0.55], 0.6, top - 0.1, 0.35));
}
export const DULCIMER: InstrumentSpatialModel = spatialModel("dulcimer", dulcimer());
