/**
 * The bowed strings (programs 40–47) and the fiddle (110): one parametric
 * violin-family body at four sizes, a concert harp and a set of timpani.
 *
 * Dimensions (body length / rib height / neck, in meters), from standard
 * luthier measurements: violin 0.355 / 0.030 / 0.130; viola 0.410 / 0.038 /
 * 0.150; cello 0.755 / 0.110 / 0.280 with a 0.45 endpin; double bass 1.10 /
 * 0.20 / 0.42 with a 0.30 endpin. Bows: violin 0.745, viola 0.74, cello
 * 0.72, bass (French) 0.72. Outline proportions are the violin's — lower
 * bout 208 mm, C-bout 110, upper bout 166 on a 355 body, bridge 195 from
 * the top — scaled with the body, which is close enough to the real
 * viola/cello/bass families for a wireframe.
 *
 * Canonical body frame: tail (bottom block) at the origin, the body runs
 * along +z to the scroll, the top plate faces +y. `place` then holds it:
 * a violin under the chin, scroll forward-left and tipped down 12°; a cello
 * upright between the knees, leaning back 35°; a bass standing, 15° back.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { bow, mallet } from "../spatial-parts";
import {
  curve,
  extrude,
  lathe,
  line,
  merge,
  place,
  rect,
  ring,
  smoothClosed,
  smoothOpen,
  spiral,
  spread,
  strings,
  symmetric,
  translate,
  tube,
  type P2,
  type Strokes,
} from "../spatial-geometry";

interface ViolinSpec {
  readonly body: number;
  readonly rib: number;
  readonly neck: number;
  /** 0 for no bow (pizzicato). */
  readonly bowLength: number;
  /** +1: frog on the canonical +x side; −1 for a body that is rolled over when held. */
  readonly frogSide: 1 | -1;
  readonly endpin?: number;
  readonly chinrest?: boolean;
}

function violinFamily(spec: ViolinSpec): Strokes {
  const L = spec.body;
  const rib = spec.rib;
  const top = rib / 2;
  // Half outline, [x, z], tail to top block; corners doubled to keep them sharp.
  const half: P2[] = [
    [0.06 * L, 0],
    [0.24 * L, 0.06 * L],
    [0.293 * L, 0.21 * L],
    [0.25 * L, 0.34 * L],
    [0.215 * L, 0.405 * L],
    [0.215 * L, 0.405 * L],
    [0.155 * L, 0.5 * L],
    [0.18 * L, 0.6 * L],
    [0.18 * L, 0.6 * L],
    [0.234 * L, 0.76 * L],
    [0.19 * L, 0.9 * L],
    [0.07 * L, L],
  ];
  const outline = smoothClosed(symmetric(half, 0), 4);
  const body = extrude(outline, rib, "xz", 6);

  // f-holes, either side of the bridge.
  const fHole = (side: 1 | -1): Strokes => {
    const s = side;
    return [
      curve(
        [
          [s * 0.105 * L, 0.36 * L],
          [s * 0.085 * L, 0.45 * L],
          [s * 0.09 * L, 0.55 * L],
          [s * 0.115 * L, 0.63 * L],
        ],
        "xz",
        top + 0.001,
        4,
      ),
      ring([s * 0.105 * L, top + 0.001, 0.36 * L], 0.013 * L, "y", 8),
      ring([s * 0.115 * L, top + 0.001, 0.63 * L], 0.011 * L, "y", 8),
    ];
  };

  // Bridge, standing at 0.45 L from the tail.
  const bridgeZ = 0.45 * L;
  const bridgeTop = top + 0.095 * L;
  const bridge: Strokes = [
    [
      [-0.06 * L, top, bridgeZ],
      [0.06 * L, top, bridgeZ],
      [0.05 * L, bridgeTop, bridgeZ],
      [-0.05 * L, bridgeTop, bridgeZ],
      [-0.06 * L, top, bridgeZ],
    ],
  ];

  // Tailpiece from the saddle to 0.32 L, and the tailgut.
  const tailpiece: Strokes = [
    [
      [-0.03 * L, top + 0.02 * L, 0.02 * L],
      [0.03 * L, top + 0.02 * L, 0.02 * L],
      [0.065 * L, top + 0.03 * L, 0.33 * L],
      [-0.065 * L, top + 0.03 * L, 0.33 * L],
      [-0.03 * L, top + 0.02 * L, 0.02 * L],
    ],
    line([0, top, 0], [0, top + 0.02 * L, 0.02 * L]),
  ];

  // Fingerboard: over the body from 0.72 L to the nut, rising toward it.
  const nutZ = L + spec.neck;
  const nutY = top + 0.06 * L;
  const fingerboard: Strokes = [
    [
      [-0.075 * L, top + 0.05 * L, 0.72 * L],
      [0.075 * L, top + 0.05 * L, 0.72 * L],
      [0.062 * L, nutY, nutZ],
      [-0.062 * L, nutY, nutZ],
      [-0.075 * L, top + 0.05 * L, 0.72 * L],
    ],
    // Neck underneath.
    line([-0.045 * L, 0, L], [-0.04 * L, nutY - 0.045 * L, nutZ]),
    line([0.045 * L, 0, L], [0.04 * L, nutY - 0.045 * L, nutZ]),
    line([-0.04 * L, nutY - 0.045 * L, nutZ], [0.04 * L, nutY - 0.045 * L, nutZ]),
  ];

  // Pegbox, four pegs, scroll.
  const pegboxLen = 0.25 * L;
  const pegbox: Strokes = [
    [
      [-0.04 * L, nutY, nutZ],
      [-0.04 * L, nutY, nutZ + pegboxLen],
      [0.04 * L, nutY, nutZ + pegboxLen],
      [0.04 * L, nutY, nutZ],
    ],
    [
      [-0.04 * L, nutY - 0.06 * L, nutZ],
      [-0.04 * L, nutY - 0.06 * L, nutZ + pegboxLen],
      [0.04 * L, nutY - 0.06 * L, nutZ + pegboxLen],
      [0.04 * L, nutY - 0.06 * L, nutZ],
    ],
    line([-0.04 * L, nutY, nutZ], [-0.04 * L, nutY - 0.06 * L, nutZ]),
    line([0.04 * L, nutY, nutZ], [0.04 * L, nutY - 0.06 * L, nutZ]),
  ];
  for (const zOff of [0.07 * L, 0.17 * L]) {
    pegbox.push(line([-0.1 * L, nutY - 0.03 * L, nutZ + zOff], [0.1 * L, nutY - 0.03 * L, nutZ + zOff]));
    pegbox.push(ring([-0.1 * L, nutY - 0.03 * L, nutZ + zOff], 0.018 * L, "x", 8));
    pegbox.push(ring([0.1 * L, nutY - 0.03 * L, nutZ + zOff], 0.018 * L, "x", 8));
  }
  const scrollCenter: Vec3 = [0, nutY + 0.02 * L, nutZ + pegboxLen + 0.04 * L];
  const scroll: Strokes = [-0.035 * L, 0, 0.035 * L].map((x) =>
    spiral([x, scrollCenter[1], scrollCenter[2]], 0.012 * L, 0.06 * L, 1.75, "yz", 14),
  );

  // Four strings: nut → bridge → tailpiece.
  const across: Vec3 = [1, 0, 0];
  const nutPts = spread([0, nutY + 0.005, nutZ], across, 4, 0.016 * L);
  const bridgePts = spread([0, bridgeTop, bridgeZ], across, 4, 0.03 * L);
  const tailPts = spread([0, top + 0.03 * L, 0.3 * L], across, 4, 0.02 * L);
  const stringLines = merge(strings(nutPts, bridgePts), strings(bridgePts, tailPts));

  const extras: Strokes = [];
  if (spec.chinrest) extras.push(ring([-0.15 * L, top + 0.015, 0.09 * L], 0.085 * L, "y", 14));
  if (spec.endpin) extras.push(line([0, 0, 0], [0, 0, -spec.endpin]), ring([0, 0, -0.02 * L], 0.012, "z", 6));
  if (spec.bowLength > 0) {
    const y = bridgeTop - 0.01 * L;
    const z = 0.56 * L;
    const frog: Vec3 = [spec.frogSide * 0.2, y, z];
    const tip: Vec3 = [-spec.frogSide * (spec.bowLength - 0.2), y + 0.02, z];
    extras.push(...bow(frog, tip));
  }

  return merge(body, fHole(1), fHole(-1), bridge, tailpiece, fingerboard, pegbox, scroll, stringLines, extras);
}

const VIOLIN_SPEC: ViolinSpec = { body: 0.355, rib: 0.03, neck: 0.13, bowLength: 0.745, frogSide: 1, chinrest: true };
const VIOLA_SPEC: ViolinSpec = { body: 0.41, rib: 0.038, neck: 0.15, bowLength: 0.74, frogSide: 1, chinrest: true };
const CELLO_SPEC: ViolinSpec = { body: 0.755, rib: 0.11, neck: 0.28, bowLength: 0.72, frogSide: -1, endpin: 0.45 };
const BASS_SPEC: ViolinSpec = { body: 1.1, rib: 0.2, neck: 0.42, bowLength: 0.72, frogSide: -1, endpin: 0.3 };

/** A violin or viola under the chin: scroll forward-left, tipped 12° down, face rolled 25° toward the player's right. */
export function heldViolin(spec: ViolinSpec, at: Vec3 = [-0.08, 1.4, 0.15]): Strokes {
  return place(violinFamily(spec), { at, roll: -25, pitch: 12, yaw: -38 });
}

/** A cello seated: upright between the knees, leaning back 35°, endpin to the floor. */
export function seatedCello(spec: ViolinSpec = CELLO_SPEC, at: Vec3 = [0.05, 0.42, 0.5]): Strokes {
  return place(violinFamily(spec), { at, roll: 180, pitch: -125 });
}

/** A double bass standing, 15° back, endpin to the floor. */
export function standingBass(spec: ViolinSpec = BASS_SPEC, at: Vec3 = [0.1, 0.32, 0.4]): Strokes {
  return place(violinFamily(spec), { at, roll: 180, pitch: -105 });
}

export const VIOLIN: InstrumentSpatialModel = spatialModel("violin", heldViolin(VIOLIN_SPEC));
export const VIOLA: InstrumentSpatialModel = spatialModel("viola", heldViolin(VIOLA_SPEC));
export const CELLO: InstrumentSpatialModel = spatialModel("cello", seatedCello());
export const CONTRABASS: InstrumentSpatialModel = spatialModel("contrabass", standingBass());
/** Program 32, Acoustic Bass: the same upright, plucked — no bow. */
export const ACOUSTIC_BASS: InstrumentSpatialModel = spatialModel("acoustic-bass", standingBass({ ...BASS_SPEC, bowLength: 0 }));
/** Program 110: a fiddle held folk-style, lower, against the chest. */
export const FIDDLE: InstrumentSpatialModel = spatialModel("fiddle", place(violinFamily(VIOLIN_SPEC), { at: [-0.05, 1.22, 0.2], roll: -10, pitch: 22, yaw: -32 }));

/** Several players' instruments side by side, `spacing` apart, for a section patch. */
export function stringSection(bows: boolean): Strokes {
  const v = bows ? VIOLIN_SPEC : { ...VIOLIN_SPEC, bowLength: 0 };
  return merge(
    place(heldViolin(v), { at: [-0.6, 0, 0], yaw: 8 }),
    heldViolin(v),
    place(heldViolin(v), { at: [0.6, 0, 0], yaw: -8 }),
  );
}
/** Programs 44/45: three violins, bowed (tremolo) or not (pizzicato). */
export const TREMOLO_STRINGS: InstrumentSpatialModel = spatialModel("tremolo-strings", stringSection(true));
export const PIZZICATO_STRINGS: InstrumentSpatialModel = spatialModel("pizzicato-strings", stringSection(false));
/** Programs 48/49: a fuller section — two violins, a viola, a cello (and a bass for the second). */
export const STRING_ENSEMBLE_1: InstrumentSpatialModel = spatialModel(
  "string-ensemble-1",
  merge(
    place(heldViolin(VIOLIN_SPEC), { at: [-0.9, 0, 0.1], yaw: 10 }),
    place(heldViolin(VIOLIN_SPEC), { at: [-0.3, 0, 0], yaw: 4 }),
    place(heldViolin(VIOLA_SPEC), { at: [0.3, 0, 0], yaw: -4 }),
    place(seatedCello(), { at: [0.95, 0, 0.05], yaw: -12 }),
  ),
);
export const STRING_ENSEMBLE_2: InstrumentSpatialModel = spatialModel(
  "string-ensemble-2",
  merge(
    place(heldViolin(VIOLIN_SPEC), { at: [-0.95, 0, 0.1], yaw: 12 }),
    place(heldViolin(VIOLIN_SPEC), { at: [-0.45, 0, 0.05], yaw: 6 }),
    place(heldViolin(VIOLA_SPEC), { at: [0.05, 0, 0] }),
    place(seatedCello(), { at: [0.6, 0, 0.05], yaw: -8 }),
    place(standingBass(), { at: [1.1, 0, 0.15], yaw: -14 }),
  ),
);

// ---------------------------------------------------------------------------
// Concert harp (46): 1.88 m tall, 0.98 m wide, 47 strings, seven pedals.
// The column stands forward of the player; the soundbox leans back onto the
// right shoulder; the harmonic curve joins them at the top.
// ---------------------------------------------------------------------------

function harp(): Strokes {
  const baseFront: Vec3 = [0.02, 0.06, 0.78];
  const columnTop: Vec3 = [0.02, 1.8, 0.78];
  const boxTop: Vec3 = [0.12, 1.5, 0.12];
  const boxBottom: Vec3 = [0.05, 0.1, 0.72];
  const out: Strokes = [];
  // Pedestal and column.
  out.push(rect([0, 0.06, 0.7], 0.5, 0.42, "xz"));
  out.push(...tube(baseFront, columnTop, 0.045, { segments: 10, meridians: 4, rings: 5 }));
  out.push(ring([columnTop[0], columnTop[1] + 0.06, columnTop[2]], 0.07, "y", 12));
  // Soundbox: tapered, four longitudinal edges and cross-sections along it.
  const sections = 6;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections;
    const c: Vec3 = [boxBottom[0] + (boxTop[0] - boxBottom[0]) * t, boxBottom[1] + (boxTop[1] - boxBottom[1]) * t, boxBottom[2] + (boxTop[2] - boxBottom[2]) * t];
    const w = 0.44 - 0.3 * t;
    const d = 0.3 - 0.2 * t;
    out.push([
      [c[0] - w / 2, c[1], c[2] - d / 2],
      [c[0] + w / 2, c[1], c[2] - d / 2],
      [c[0] + w / 2, c[1], c[2] + d / 2],
      [c[0] - w / 2, c[1], c[2] + d / 2],
      [c[0] - w / 2, c[1], c[2] - d / 2],
    ]);
  }
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    out.push(line([boxBottom[0] + sx * 0.22, boxBottom[1], boxBottom[2] + sz * 0.15], [boxTop[0] + sx * 0.07, boxTop[1], boxTop[2] + sz * 0.05]));
  }
  // Harmonic curve: column top back to the soundbox top, in an S.
  const neck = smoothOpen(
    [
      [1.8, 0.78],
      [1.92, 0.6],
      [1.88, 0.4],
      [1.7, 0.24],
      [1.5, 0.12],
    ],
    5,
  ).map(([y, z]): Vec3 => [0.06, y, z]);
  out.push(neck, neck.map(([x, y, z]): Vec3 => [x, y - 0.06, z]));
  // Strings: every other one of 47, from the neck down to the soundboard.
  const count = 24;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const n = neck[Math.round(t * (neck.length - 1))];
    const soundboard: Vec3 = [boxBottom[0] + (boxTop[0] - boxBottom[0]) * (1 - t) * 0.95 + 0.02, boxBottom[1] + (boxTop[1] - boxBottom[1]) * (1 - t) * 0.95 + 0.05, boxBottom[2] + (boxTop[2] - boxBottom[2]) * (1 - t) * 0.95 + 0.02];
    out.push(line([n[0], n[1] - 0.03, n[2]], soundboard));
  }
  // Seven pedals around the base.
  for (let i = 0; i < 7; i++) {
    const x = -0.15 + i * 0.05;
    out.push(line([x, 0.02, 0.55], [x, 0.02, 0.66]));
  }
  return out;
}
export const ORCHESTRAL_HARP: InstrumentSpatialModel = spatialModel("orchestral-harp", harp());

// ---------------------------------------------------------------------------
// Timpani (47): four kettles, 81/74/66/58 cm, in an arc in front of the
// player, rims at 0.85 m, largest on the player's left.
// ---------------------------------------------------------------------------

function kettle(center: Vec3, diameter: number): Strokes {
  const r = diameter / 2;
  const bowl = lathe(
    [
      [r, 0],
      [0.97 * r, -0.08],
      [0.86 * r, -0.2],
      [0.62 * r, -0.34],
      [0.28 * r, -0.44],
      [0, -0.47],
    ],
    { segments: 28, meridians: 8 },
  );
  const rods: Strokes = [];
  for (let i = 0; i < 8; i++) {
    const t = (Math.PI * 2 * i) / 8;
    rods.push(line([Math.cos(t) * (r + 0.02), 0.01, Math.sin(t) * (r + 0.02)], [Math.cos(t) * (r + 0.02), -0.12, Math.sin(t) * (r + 0.02)]));
  }
  const legs: Strokes = [];
  for (let i = 0; i < 3; i++) {
    const t = (Math.PI * 2 * i) / 3 + Math.PI / 6;
    legs.push(line([Math.cos(t) * 0.25 * r, -0.4, Math.sin(t) * 0.25 * r], [Math.cos(t) * (r + 0.05), -center[1], Math.sin(t) * (r + 0.05)]));
  }
  const pedal = rect([0, -center[1] + 0.02, -(r + 0.12)], 0.1, 0.22, "xz");
  return translate(merge(bowl, [ring([0, 0.005, 0], r + 0.02, "y", 28)], rods, legs, [pedal]), center);
}

function timpani(): Strokes {
  const out: Strokes = [];
  const sizes = [0.81, 0.74, 0.66, 0.58];
  const angles = [-52, -18, 16, 50];
  for (let i = 0; i < 4; i++) {
    const a = (angles[i] * Math.PI) / 180;
    const d = 0.95;
    out.push(...kettle([Math.sin(a) * d, 0.85, Math.cos(a) * d], sizes[i]));
  }
  out.push(...mallet([-0.2, 1.1, 0.3], [-0.32, 0.95, 0.65], 0.03));
  out.push(...mallet([0.2, 1.1, 0.3], [0.3, 0.95, 0.68], 0.03));
  return out;
}
export const TIMPANI: InstrumentSpatialModel = spatialModel("timpani", timpani());
