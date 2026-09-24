/**
 * Programs 0–8 and 16–23: pianos, celesta and the organ family, including
 * the accordions and the harmonica that General MIDI files under "organ".
 *
 * Dimensions: a 1.8 m grand (1.5 wide, 88 keys 1.23 m, keybed 0.72 high,
 * rim top 1.0, lid raised 42°); a 1.45 × 1.25 × 0.6 upright; a 1.35 m
 * Yamaha CP-80 electric grand on legs; a Rhodes Stage 73 (1.1 × 0.5 case)
 * and a Wurlitzer 200 (1.0 × 0.45) on chrome legs; a 2.55 m Flemish
 * two-manual harpsichord; a 0.9 m Clavinet D6; a 1 × 1.1 m celesta; a
 * Hammond B-3 (123 × 74 × 97 cm, two 61-note manuals, 25-note pedalboard);
 * a three-manual organ console with a 2.8 m pipe façade; a harmonium; a
 * 120-bass piano accordion (0.45 m treble side); a 10-hole harmonica; a
 * bandoneon (24 × 26 × 40 cm ends, bellows open to ~0.55 m).
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { bench, keyboard, knobRow, pedals } from "../spatial-parts";
import { box, ellipse, extrudeBetween, line, merge, rect, ring, smoothOpen, tube, type P2, type Strokes } from "../spatial-geometry";

const KEY_Y = 0.72;

/** A grand-piano rim outline, [x, z], keys at z = 0.35: spine straight on the bass (left) side, bentside curving on the treble. */
function wingOutline(length: number, width: number, zFront = 0.35): P2[] {
  const hw = width / 2;
  const zEnd = zFront + length;
  const straight: P2[] = [
    [-hw, zFront],
    [hw, zFront],
    [hw, zFront + length * 0.42],
  ];
  const bent = smoothOpen(
    [
      [hw, zFront + length * 0.42],
      [hw * 0.82, zFront + length * 0.62],
      [hw * 0.48, zFront + length * 0.82],
      [0, zFront + length * 0.95],
      [-hw * 0.55, zEnd],
      [-hw * 0.9, zEnd - length * 0.04],
      [-hw, zEnd - length * 0.11],
    ],
    5,
  );
  return [...straight, ...bent.slice(1), [-hw, zFront]];
}

/** The outline as a lid, swung `angle` degrees up about a hinge along z at (hingeX, topY). */
function lidOver(outline: readonly P2[], hingeX: number, topY: number, angle: number): Vec3[] {
  const c = Math.cos((angle * Math.PI) / 180);
  const s = Math.sin((angle * Math.PI) / 180);
  return outline.map(([x, z]): Vec3 => [hingeX + (x - hingeX) * c, topY + (x - hingeX) * s, z]);
}

function turnedLeg(at: Vec3, height: number, radius = 0.04): Strokes {
  return tube([at[0], 0, at[2]], [at[0], height, at[2]], radius, { segments: 8, meridians: 3, rings: 4 });
}

function grandPiano(): Strokes {
  const length = 1.8;
  const width = 1.5;
  const outline = wingOutline(length, width);
  const rim = extrudeBetween(outline, "xz", 0.62, 1.0, 5);
  const lid = lidOver(outline, -width / 2, 1.0, 42);
  const c = Math.cos((42 * Math.PI) / 180);
  const s = Math.sin((42 * Math.PI) / 180);
  const propTop: Vec3 = [-width / 2 + 0.8 * c, 1.0 + 0.8 * s, 0.35 + length * 0.55];
  return merge(
    rim,
    [lid],
    [line([width / 2 - 0.05, 1.0, 0.35 + length * 0.55], propTop)],
    keyboard(52, "A", [0, KEY_Y, 0.22], 0.15),
    box([-0.66, 0.76, 0.295], [0.08, 0.08, 0.15]),
    box([0.66, 0.76, 0.295], [0.08, 0.08, 0.15]),
    [line([-0.62, 0.82, 0.37], [0.62, 0.82, 0.37])],
    [
      [
        [-0.3, 0.92, 0.5],
        [0.3, 0.92, 0.5],
        [0.3, 1.2, 0.42],
        [-0.3, 1.2, 0.42],
        [-0.3, 0.92, 0.5],
      ],
    ],
    turnedLeg([-0.65, 0, 0.5], 0.62),
    turnedLeg([0.65, 0, 0.5], 0.62),
    turnedLeg([-0.45, 0, 0.35 + length - 0.25], 0.62),
    [line([-0.08, 0.62, 0.6], [-0.08, 0.08, 0.6]), line([0.08, 0.62, 0.6], [0.08, 0.08, 0.6])],
    pedals([0, 0.02, 0.55], 3),
    bench([0, 0, -0.05]),
  );
}
export const GRAND_PIANO: InstrumentSpatialModel = spatialModel("grand-piano", grandPiano());

function electricGrand(): Strokes {
  const outline = wingOutline(1.35, 1.35);
  return merge(
    extrudeBetween(outline, "xz", 0.76, 0.92, 5),
    keyboard(52, "A", [0, KEY_Y + 0.04, 0.22], 0.15),
    [line([-0.62, 0.86, 0.37], [0.62, 0.86, 0.37])],
    tube([-0.6, 0, 0.45], [-0.6, 0.76, 0.45], 0.02, { segments: 8, meridians: 2 }),
    tube([0.6, 0, 0.45], [0.6, 0.76, 0.45], 0.02, { segments: 8, meridians: 2 }),
    tube([-0.5, 0, 1.5], [-0.5, 0.76, 1.5], 0.02, { segments: 8, meridians: 2 }),
    tube([0.4, 0, 1.15], [0.4, 0.76, 1.15], 0.02, { segments: 8, meridians: 2 }),
    pedals([0, 0.02, 0.5], 1),
    bench([0, 0, -0.05]),
  );
}
export const ELECTRIC_GRAND: InstrumentSpatialModel = spatialModel("electric-grand", electricGrand());

function uprightPiano(): Strokes {
  return merge(
    box([0, 0.65, 0.65], [1.45, 1.2, 0.6]),
    box([0, 0.69, 0.28], [1.38, 0.06, 0.16]),
    keyboard(52, "A", [0, KEY_Y, 0.2], 0.15),
    [rect([0, 0.86, 0.35], 1.3, 0.12, "xy"), rect([0, 1.08, 0.345], 0.7, 0.2, "xy")],
    [line([-0.725, 1.25, 0.65], [0.725, 1.25, 0.65])],
    pedals([0, 0.02, 0.3], 3),
    bench([0, 0, -0.1]),
  );
}
export const UPRIGHT_PIANO: InstrumentSpatialModel = spatialModel("upright-piano", uprightPiano());

function chromeLegs(x: number, z0: number, z1: number, height: number): Strokes {
  const out: Strokes = [];
  for (const sx of [-1, 1]) {
    for (const z of [z0, z1]) out.push(...tube([sx * x, 0, z], [sx * x, height, z], 0.014, { segments: 6, meridians: 2 }));
    out.push(line([sx * x, 0.05, z0], [sx * x, height - 0.05, z1]), line([sx * x, 0.05, z1], [sx * x, height - 0.05, z0]));
  }
  return out;
}

function rhodes(): Strokes {
  return merge(
    box([0, 0.8, 0.5], [1.15, 0.16, 0.5]),
    [ellipse([-0.575, 0.84, 0.62], 0.04, 0.12, "x", 8, { from: 90, to: 180 }), ellipse([0.575, 0.84, 0.62], 0.04, 0.12, "x", 8, { from: 90, to: 180 })],
    keyboard(43, "E", [0, KEY_Y + 0.02, 0.28], 0.15),
    chromeLegs(0.5, 0.35, 0.65, 0.72),
    [line([0.3, 0.02, 0.3], [0.3, 0.72, 0.4])],
    pedals([0.3, 0.02, 0.22], 1),
    bench([0, 0, -0.05]),
  );
}
export const ELECTRIC_PIANO_RHODES: InstrumentSpatialModel = spatialModel("electric-piano-rhodes", rhodes());

function wurlitzer(): Strokes {
  return merge(
    box([0, 0.83, 0.5], [1.0, 0.22, 0.45]),
    [ring([-0.3, 0.92, 0.275], 0.05, "z", 12), ring([0.3, 0.92, 0.275], 0.05, "z", 12)],
    keyboard(38, "A", [0, KEY_Y + 0.02, 0.29], 0.14),
    chromeLegs(0.42, 0.35, 0.65, 0.72),
    pedals([0.3, 0.02, 0.22], 1),
    bench([0, 0, -0.05]),
  );
}
export const ELECTRIC_PIANO_WURLITZER: InstrumentSpatialModel = spatialModel("electric-piano-wurlitzer", wurlitzer());

function harpsichord(): Strokes {
  const width = 0.9;
  const length = 2.2;
  const hw = width / 2;
  const outline: P2[] = [
    [-hw, 0.35],
    [hw, 0.35],
    [hw, 1.05],
    ...smoothOpen(
      [
        [hw, 1.05],
        [hw * 0.75, 1.6],
        [hw * 0.3, 2.1],
        [-hw * 0.3, 2.45],
        [-hw * 0.8, 2.55],
      ],
      5,
    ).slice(1),
    [-hw, 0.35 + length],
    [-hw, 0.35],
  ];
  return merge(
    extrudeBetween(outline, "xz", 0.78, 0.93, 4),
    [lidOver(outline, -hw, 0.93, 55)],
    [line([hw - 0.04, 0.93, 1.3], [-hw + 0.9 * Math.cos((55 * Math.PI) / 180), 0.93 + 0.9 * Math.sin((55 * Math.PI) / 180), 1.3])],
    keyboard(36, "F", [0, 0.8, 0.3], 0.12),
    keyboard(36, "F", [0, 0.86, 0.42], 0.12),
    turnedLeg([-0.38, 0, 0.5], 0.78, 0.03),
    turnedLeg([0.38, 0, 0.5], 0.78, 0.03),
    turnedLeg([-0.36, 0, 1.9], 0.78, 0.03),
    turnedLeg([0.2, 0, 1.5], 0.78, 0.03),
    bench([0, 0, -0.05], 0.8, 0.32, 0.5),
  );
}
export const HARPSICHORD: InstrumentSpatialModel = spatialModel("harpsichord", harpsichord());

function clavinet(): Strokes {
  return merge(
    box([0, 0.79, 0.45], [0.92, 0.12, 0.38]),
    keyboard(35, "F", [0, 0.85, 0.28], 0.13),
    [rect([-0.36, 0.851, 0.5], 0.06, 0.04, "xz"), rect([-0.36, 0.851, 0.57], 0.06, 0.04, "xz")],
    tube([-0.4, 0, 0.35], [-0.4, 0.73, 0.35], 0.012, { segments: 6, meridians: 2 }),
    tube([0.4, 0, 0.35], [0.4, 0.73, 0.35], 0.012, { segments: 6, meridians: 2 }),
    tube([-0.4, 0, 0.6], [-0.4, 0.73, 0.6], 0.012, { segments: 6, meridians: 2 }),
    tube([0.4, 0, 0.6], [0.4, 0.73, 0.6], 0.012, { segments: 6, meridians: 2 }),
    bench([0, 0, -0.05]),
  );
}
export const CLAVINET: InstrumentSpatialModel = spatialModel("clavinet", clavinet());

function celesta(): Strokes {
  return merge(
    box([0, 0.62, 0.6], [0.98, 1.1, 0.45]),
    keyboard(36, "C", [0, 0.76, 0.32], 0.14),
    box([0, 0.72, 0.36], [0.9, 0.05, 0.1]),
    [line([-0.49, 1.17, 0.375], [0.49, 1.17, 0.375])],
    pedals([0, 0.02, 0.32], 1),
    bench([0, 0, -0.08]),
  );
}
export const CELESTA: InstrumentSpatialModel = spatialModel("celesta", celesta());

function hammond(): Strokes {
  const out = merge(
    box([0, 0.85, 0.73], [1.24, 0.3, 0.62]),
    box([0, 1.08, 0.88], [1.24, 0.16, 0.32]),
    keyboard(36, "C", [0, 0.75, 0.42], 0.14),
    keyboard(36, "C", [0, 0.81, 0.54], 0.14),
    turnedLeg([-0.56, 0, 0.5], 0.7, 0.03),
    turnedLeg([0.56, 0, 0.5], 0.7, 0.03),
    turnedLeg([-0.56, 0, 0.98], 0.7, 0.03),
    turnedLeg([0.56, 0, 0.98], 0.7, 0.03),
    [rect([0, 1.13, 0.75], 0.6, 0.2, "xy")],
    pedals([0, 0.03, 0.02], 25, 0.036, 0.42),
    [rect([0.36, 0.06, 0.28], 0.1, 0.22, "xz")],
    bench([0, 0, -0.18]),
  );
  // Two banks of nine drawbars above the upper manual, and the preset keys.
  for (const bank of [-0.32, 0.12]) for (let i = 0; i < 9; i++) out.push(line([bank + i * 0.022, 0.92, 0.7], [bank + i * 0.022, 0.96, 0.7]));
  return out;
}
export const DRAWBAR_ORGAN: InstrumentSpatialModel = spatialModel("drawbar-organ", hammond());

function pipeOrgan(): Strokes {
  const out = merge(
    box([0, 0.92, 0.75], [1.3, 0.55, 0.7]),
    keyboard(36, "C", [0, 0.76, 0.36], 0.13),
    keyboard(36, "C", [0, 0.83, 0.44], 0.13),
    keyboard(36, "C", [0, 0.9, 0.52], 0.13),
    pedals([0, 0.03, 0.02], 30, 0.033, 0.42),
    bench([0, 0, -0.18]),
    box([0, 1.55, 1.95], [2.8, 3.0, 0.6]),
    [line([-1.4, 1.0, 1.65], [1.4, 1.0, 1.65])],
  );
  const heights = [0.9, 1.1, 1.35, 1.65, 2.0, 2.35, 2.6, 2.8, 2.6, 2.35, 2.0, 1.65, 1.35, 1.1, 0.9];
  heights.forEach((h, i) => {
    const x = -1.1 + i * (2.2 / 14);
    const r = 0.028 + 0.028 * ((h - 0.9) / 1.9);
    out.push(...tube([x, 1.0, 1.72], [x, 1.0 + h, 1.72], r, { segments: 10, meridians: 3, rings: 2 }));
    out.push(line([x - r, 1.25, 1.72 - r], [x + r, 1.25, 1.72 - r]));
  });
  return out;
}
export const CHURCH_ORGAN: InstrumentSpatialModel = spatialModel("church-organ", pipeOrgan());

function harmonium(): Strokes {
  return merge(
    box([0, 0.62, 0.55], [1.05, 0.62, 0.42]),
    keyboard(36, "C", [0, 0.76, 0.36], 0.13),
    box([0, 0.72, 0.4], [1.0, 0.04, 0.09]),
    knobRow([0, 0.9, 0.34], 10, 0.07, 0.012, "z"),
    [line([-0.525, 0.93, 0.34], [0.525, 0.93, 0.34])],
    [rect([-0.14, 0.03, 0.2], 0.12, 0.3, "xz"), rect([0.14, 0.03, 0.2], 0.12, 0.3, "xz")],
    turnedLeg([-0.48, 0, 0.4], 0.31, 0.025),
    turnedLeg([0.48, 0, 0.4], 0.31, 0.025),
    turnedLeg([-0.48, 0, 0.7], 0.31, 0.025),
    turnedLeg([0.48, 0, 0.7], 0.31, 0.025),
    bench([0, 0, -0.1]),
  );
}
export const REED_ORGAN: InstrumentSpatialModel = spatialModel("reed-organ", harmonium());

/** Zig-zag bellows between two boxes along x, from `x0` to `x1`. */
function bellows(x0: number, x1: number, center: Vec3, height: number, depth: number, pleats: number): Strokes {
  const out: Strokes = [];
  for (let i = 0; i <= pleats; i++) {
    const x = x0 + ((x1 - x0) * i) / pleats;
    const shrink = i % 2 === 0 ? 1 : 0.9;
    out.push(rect([x, center[1], center[2]], height * shrink, depth * shrink, "yz"));
  }
  for (const [sy, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const pts: Vec3[] = [];
    for (let i = 0; i <= pleats; i++) {
      const x = x0 + ((x1 - x0) * i) / pleats;
      const shrink = i % 2 === 0 ? 1 : 0.9;
      pts.push([x, center[1] + (sy * height * shrink) / 2, center[2] + (sz * depth * shrink) / 2]);
    }
    out.push(pts);
  }
  return out;
}

function accordion(): Strokes {
  const c: Vec3 = [0, 1.15, 0.28];
  const out = merge(box([0.2, c[1], c[2]], [0.14, 0.45, 0.2]), box([-0.2, c[1], c[2]], [0.14, 0.45, 0.2]), bellows(-0.13, 0.13, c, 0.43, 0.19, 8));
  // Treble keyboard on the right box's outer face: keys run vertically.
  for (let i = 0; i <= 24; i++) out.push(line([0.27, c[1] - 0.21 + i * 0.0175, c[2] + 0.1], [0.27, c[1] - 0.21 + i * 0.0175, c[2] - 0.02]));
  for (let i = 0; i < 24; i++) {
    const letter = (i + 4) % 7; // start on F
    if ([0, 1, 3, 4, 5].includes(letter)) out.push(rect([0.28, c[1] - 0.21 + (i + 1) * 0.0175, c[2] + 0.06], 0.07, 0.01, "yz"));
  }
  // Bass buttons on the left box's outer face.
  for (let row = 0; row < 6; row++) for (let k = 0; k < 8; k++) out.push(ring([-0.27, c[1] - 0.14 + k * 0.04 + (row % 2) * 0.02, c[2] + 0.07 - row * 0.03], 0.006, "x", 6));
  // Shoulder straps.
  out.push(ring([-0.12, 1.42, 0.05], 0.12, "x", 10, { from: 0, to: 180 }), ring([0.12, 1.42, 0.05], 0.12, "x", 10, { from: 0, to: 180 }));
  return out;
}
export const ACCORDION: InstrumentSpatialModel = spatialModel("accordion", accordion());

function harmonica(): Strokes {
  const c: Vec3 = [0, 1.52, 0.1];
  const out = box(c, [0.1, 0.028, 0.02]);
  for (let i = 1; i < 10; i++) out.push(line([-0.05 + i * 0.01, c[1] - 0.008, c[2] - 0.01], [-0.05 + i * 0.01, c[1] + 0.008, c[2] - 0.01]));
  // Two hands cupped around it, standing roughly on edge.
  out.push(ellipse([-0.085, 1.5, 0.13], 0.055, 0.09, "z", 12), ellipse([0.085, 1.5, 0.13], 0.055, 0.09, "z", 12));
  out.push(ellipse([-0.085, 1.5, 0.13], 0.09, 0.05, "x", 12), ellipse([0.085, 1.5, 0.13], 0.09, 0.05, "x", 12));
  return out;
}
export const HARMONICA: InstrumentSpatialModel = spatialModel("harmonica", harmonica());

function bandoneon(): Strokes {
  const c: Vec3 = [0, 0.72, 0.35];
  const out = merge(box([-0.32, c[1], c[2]], [0.12, 0.24, 0.26]), box([0.32, c[1], c[2]], [0.12, 0.24, 0.26]), bellows(-0.26, 0.26, c, 0.23, 0.25, 12));
  for (const sx of [-1, 1]) for (let row = 0; row < 5; row++) for (let k = 0; k < 7; k++) out.push(ring([sx * 0.38, c[1] - 0.08 + row * 0.04, c[2] - 0.09 + k * 0.03], 0.007, "x", 6));
  return out;
}
export const TANGO_ACCORDION: InstrumentSpatialModel = spatialModel("tango-accordion", bandoneon());
