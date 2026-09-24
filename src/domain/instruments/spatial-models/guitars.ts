/**
 * Programs 24–37: guitars and basses, each a real model — classical,
 * dreadnought, archtop, Stratocaster, Telecaster, Les Paul, SG; Precision,
 * Jazz (with and without frets) and StingRay basses.
 *
 * Dimensions: classical body 48 cm (36.5 lower bout, 10 deep), scale 65 cm,
 * 12-fret join; dreadnought 50 × 40 × 12, scale 64.8, 14-fret join;
 * archtop 17" (43 cm) lower bout, 8 deep, scale 63.5; Stratocaster body
 * 46 × 32 × 4.5, scale 64.8, 22 frets; Telecaster 41 × 32; Les Paul 43 ×
 * 33 × 5 carved, scale 62.8; SG 42 × 33 × 3.5; basses 50 × 35 × 4.5 on
 * an 86.4 cm scale, 20 frets. Fret positions follow 12-TET from the nut.
 *
 * Canonical frame: body centered at the origin in the xy plane, top facing
 * +z, tail at +x, neck toward −x; the bass side is +y. `place` then holds
 * it standing (neck raised 28°, top tipped 12° toward the player, turned
 * 12° toward the audience) or seated in the classical position.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { extrude, line, place, rect, ring, smoothClosed, smoothOpen, spread, strings, symmetric, type P2, type Strokes } from "../spatial-geometry";

type Head = "inline6" | "inline4" | "3+3" | "3+1" | "slotted";

interface GuitarSpec {
  readonly id: string;
  readonly outline: readonly P2[];
  readonly thickness: number;
  readonly scale: number;
  readonly bridgeX: number;
  readonly frets: number;
  readonly stringCount: 4 | 6;
  readonly neckWidth: readonly [number, number];
  readonly head: Head;
  readonly soundhole?: { readonly x: number; readonly r: number };
  readonly pickups?: readonly { readonly x: number; readonly y: number; readonly w: number; readonly h: number }[];
  readonly fHoles?: boolean;
  readonly carved?: boolean;
  readonly fretless?: boolean;
  readonly pick?: boolean;
  readonly tailpiece?: "trapeze" | "stopbar";
}

function fretDistance(scale: number, n: number): number {
  return scale * (1 - Math.pow(2, -n / 12));
}

function guitar(spec: GuitarSpec): Strokes {
  const top = spec.thickness / 2;
  const outline = smoothClosed(spec.outline, 4);
  const out: Strokes = extrude(outline, spec.thickness, "xy", 5);
  if (spec.carved) out.push(smoothClosed(spec.outline.map(([x, y]): P2 => [x * 0.82, y * 0.82]), 4).map(([x, y]): Vec3 => [x, y, top + 0.012]));
  if (spec.soundhole) out.push(ring([spec.soundhole.x, 0, top + 0.001], spec.soundhole.r, "z", 20));
  if (spec.fHoles)
    for (const s of [1, -1])
      out.push(
        smoothOpen(
          [
            [-0.06, s * 0.11],
            [-0.02, s * 0.09],
            [0.02, s * 0.08],
            [0.06, s * 0.06],
          ],
          4,
        ).map(([x, y]): Vec3 => [x, y, top + 0.001]),
        ring([-0.06, s * 0.11, top + 0.001], 0.008, "z", 6),
        ring([0.06, s * 0.06, top + 0.001], 0.006, "z", 6),
      );
  for (const p of spec.pickups ?? []) out.push(rect([p.x, p.y, top + 0.006], p.w, p.h, "xy"));

  // Bridge and strings.
  const stringSpacingBridge = spec.stringCount === 6 ? 0.0105 : 0.019;
  const stringSpacingNut = spec.stringCount === 6 ? 0.0075 : 0.011;
  const bridgeW = stringSpacingBridge * (spec.stringCount + 1);
  out.push(rect([spec.bridgeX, 0, top + 0.004], 0.03, bridgeW + 0.02, "xy"));
  if (spec.tailpiece === "trapeze") out.push([[0.34, 0.03, top], [0.24, 0, top + 0.008], [0.34, -0.03, top]]);
  if (spec.tailpiece === "stopbar") out.push(rect([spec.bridgeX + 0.04, 0, top + 0.006], 0.012, bridgeW + 0.02, "xy"));

  const nutX = spec.bridgeX - spec.scale;
  const [wNut, wBody] = spec.neckWidth;
  const joinX = spec.outline[0][0];
  const fbZ = top + 0.008;
  // Fingerboard edges, the neck's back, and its end at the body.
  out.push(line([nutX, wNut / 2, fbZ], [joinX + 0.06, wBody / 2, fbZ]), line([nutX, -wNut / 2, fbZ], [joinX + 0.06, -wBody / 2, fbZ]));
  out.push(line([nutX, wNut / 2, top - 0.025], [joinX, wBody / 2, top - 0.02]), line([nutX, -wNut / 2, top - 0.025], [joinX, -wBody / 2, top - 0.02]));
  out.push(rect([nutX, 0, (fbZ + top - 0.025) / 2], 0.004, wNut, "yz"));
  const fretCount = spec.fretless ? 0 : spec.frets;
  for (let n = 1; n <= fretCount; n++) {
    const x = nutX + fretDistance(spec.scale, n);
    const t = (x - nutX) / (joinX + 0.06 - nutX);
    const w = wNut + (wBody - wNut) * Math.min(1, t);
    out.push(line([x, w / 2, fbZ], [x, -w / 2, fbZ]));
  }
  if (spec.fretless) for (const n of [3, 5, 7, 9, 12]) out.push(ring([nutX + fretDistance(spec.scale, n), wNut / 2 + 0.004, fbZ - 0.005], 0.003, "y", 6));
  const nutPts = spread([nutX, 0, fbZ + 0.006], [0, 1, 0], spec.stringCount, stringSpacingNut);
  const bridgePts = spread([spec.bridgeX, 0, top + 0.012], [0, 1, 0], spec.stringCount, stringSpacingBridge);
  out.push(...strings(nutPts, bridgePts));

  // Headstock, tilted 12° back from the nut.
  const headLen = spec.stringCount === 6 ? 0.18 : 0.22;
  const drop = (x: number) => fbZ - (nutX - x) * Math.sin((12 * Math.PI) / 180);
  const headHalf = wNut / 2 + 0.015;
  if (spec.head === "inline6" || spec.head === "inline4") {
    out.push([
      [nutX, headHalf - 0.01, drop(nutX)],
      [nutX - headLen * 0.3, headHalf + 0.01, drop(nutX - headLen * 0.3)],
      [nutX - headLen, headHalf + 0.02, drop(nutX - headLen)],
      [nutX - headLen + 0.02, -headHalf + 0.005, drop(nutX - headLen + 0.02)],
      [nutX, -headHalf + 0.01, drop(nutX)],
      [nutX, headHalf - 0.01, drop(nutX)],
    ]);
    for (let i = 0; i < spec.stringCount; i++) {
      const x = nutX - 0.03 - i * ((headLen - 0.05) / (spec.stringCount - 1));
      out.push(line([x, headHalf + 0.012, drop(x)], [x, headHalf + 0.035, drop(x)]), ring([x, headHalf + 0.035, drop(x)], 0.008, "y", 6));
    }
  } else if (spec.head === "slotted") {
    out.push([
      [nutX, headHalf, drop(nutX)],
      [nutX - headLen, headHalf + 0.01, drop(nutX - headLen)],
      [nutX - headLen, -headHalf - 0.01, drop(nutX - headLen)],
      [nutX, -headHalf, drop(nutX)],
      [nutX, headHalf, drop(nutX)],
    ]);
    for (const s of [1, -1]) {
      out.push([
        [nutX - 0.03, s * 0.012, drop(nutX - 0.03)],
        [nutX - headLen + 0.03, s * 0.012, drop(nutX - headLen + 0.03)],
        [nutX - headLen + 0.03, s * 0.024, drop(nutX - headLen + 0.03)],
        [nutX - 0.03, s * 0.024, drop(nutX - 0.03)],
        [nutX - 0.03, s * 0.012, drop(nutX - 0.03)],
      ]);
      for (let i = 0; i < 3; i++) {
        const x = nutX - 0.05 - i * 0.04;
        out.push(line([x, s * headHalf, drop(x)], [x, s * (headHalf + 0.03), drop(x)]));
      }
    }
  } else {
    const perSide = spec.head === "3+3" ? [3, 3] : [3, 1];
    out.push([
      [nutX, headHalf, drop(nutX)],
      [nutX - headLen * 0.5, headHalf + 0.018, drop(nutX - headLen * 0.5)],
      [nutX - headLen, headHalf + 0.01, drop(nutX - headLen)],
      [nutX - headLen, -headHalf - 0.01, drop(nutX - headLen)],
      [nutX - headLen * 0.5, -headHalf - 0.018, drop(nutX - headLen * 0.5)],
      [nutX, -headHalf, drop(nutX)],
      [nutX, headHalf, drop(nutX)],
    ]);
    perSide.forEach((count, side) => {
      const s = side === 0 ? 1 : -1;
      for (let i = 0; i < count; i++) {
        const x = nutX - 0.04 - i * (headLen / 4);
        out.push(line([x, s * headHalf, drop(x)], [x, s * (headHalf + 0.03), drop(x)]), ring([x, s * (headHalf + 0.03), drop(x)], 0.008, "y", 6));
      }
    });
  }
  if (spec.pick) out.push([[spec.bridgeX - 0.06, 0.02, top + 0.03], [spec.bridgeX - 0.045, -0.005, top + 0.03], [spec.bridgeX - 0.075, -0.005, top + 0.03], [spec.bridgeX - 0.06, 0.02, top + 0.03]]);
  return out;
}

const STANDING = { at: [0.08, 0.95, 0.28] as Vec3, roll: -28, pitch: -12, yaw: 12 };
const STANDING_BASS = { at: [0.12, 0.9, 0.3] as Vec3, roll: -20, pitch: -10, yaw: 14 };

const CLASSICAL: GuitarSpec = {
  id: "classical-guitar",
  outline: symmetric(
    [
      [-0.24, 0.05],
      [-0.2, 0.12],
      [-0.15, 0.14],
      [-0.06, 0.125],
      [0.0, 0.13],
      [0.08, 0.17],
      [0.16, 0.18],
      [0.22, 0.12],
      [0.245, 0.0],
    ],
    1,
  ),
  thickness: 0.1,
  scale: 0.65,
  bridgeX: 0.09,
  frets: 19,
  stringCount: 6,
  neckWidth: [0.052, 0.062],
  head: "slotted",
  soundhole: { x: -0.06, r: 0.043 },
};
export const ACOUSTIC_GUITAR_NYLON: InstrumentSpatialModel = spatialModel(CLASSICAL.id, place(guitar(CLASSICAL), { at: [-0.05, 0.72, 0.36], roll: -45, pitch: -15, yaw: 22 }));

const DREADNOUGHT: GuitarSpec = {
  id: "acoustic-guitar-steel",
  outline: symmetric(
    [
      [-0.16, 0.06],
      [-0.12, 0.14],
      [-0.06, 0.146],
      [0.02, 0.14],
      [0.08, 0.14],
      [0.15, 0.185],
      [0.23, 0.2],
      [0.31, 0.16],
      [0.34, 0.0],
    ],
    1,
  ),
  thickness: 0.12,
  scale: 0.648,
  bridgeX: 0.15,
  frets: 20,
  stringCount: 6,
  neckWidth: [0.043, 0.055],
  head: "3+3",
  soundhole: { x: -0.03, r: 0.05 },
};
export const ACOUSTIC_GUITAR_STEEL: InstrumentSpatialModel = spatialModel(DREADNOUGHT.id, place(guitar(DREADNOUGHT), STANDING));

const ARCHTOP: GuitarSpec = {
  id: "electric-guitar-jazz",
  outline: [
    [-0.2, 0.06],
    [-0.17, 0.15],
    [-0.1, 0.165],
    [-0.02, 0.15],
    [0.05, 0.15],
    [0.14, 0.2],
    [0.24, 0.215],
    [0.32, 0.15],
    [0.345, 0.0],
    [0.32, -0.15],
    [0.24, -0.215],
    [0.14, -0.2],
    [0.05, -0.15],
    [-0.02, -0.15],
    [-0.08, -0.16],
    [-0.14, -0.13],
    [-0.16, -0.08],
    [-0.2, -0.06],
  ],
  thickness: 0.08,
  scale: 0.635,
  bridgeX: 0.13,
  frets: 20,
  stringCount: 6,
  neckWidth: [0.043, 0.053],
  head: "3+3",
  fHoles: true,
  pickups: [{ x: -0.13, y: 0, w: 0.03, h: 0.065 }],
  tailpiece: "trapeze",
};
export const ELECTRIC_GUITAR_JAZZ: InstrumentSpatialModel = spatialModel(ARCHTOP.id, place(guitar(ARCHTOP), STANDING));

const STRAT: GuitarSpec = {
  id: "electric-guitar-clean",
  outline: [
    [-0.2, 0.05],
    [-0.27, 0.13],
    [-0.24, 0.17],
    [-0.16, 0.16],
    [-0.08, 0.13],
    [0.0, 0.13],
    [0.08, 0.16],
    [0.16, 0.16],
    [0.22, 0.12],
    [0.25, 0.0],
    [0.22, -0.11],
    [0.14, -0.16],
    [0.04, -0.15],
    [-0.05, -0.13],
    [-0.13, -0.14],
    [-0.2, -0.17],
    [-0.24, -0.12],
    [-0.2, -0.05],
  ],
  thickness: 0.045,
  scale: 0.648,
  bridgeX: 0.14,
  frets: 22,
  stringCount: 6,
  neckWidth: [0.042, 0.056],
  head: "inline6",
  pickups: [
    { x: -0.05, y: 0, w: 0.018, h: 0.07 },
    { x: 0.02, y: 0, w: 0.018, h: 0.07 },
    { x: 0.09, y: 0, w: 0.018, h: 0.07 },
  ],
};
export const ELECTRIC_GUITAR_CLEAN: InstrumentSpatialModel = spatialModel(STRAT.id, place(guitar(STRAT), STANDING));

const TELE: GuitarSpec = {
  id: "electric-guitar-muted",
  outline: [
    [-0.2, 0.06],
    [-0.16, 0.13],
    [-0.06, 0.15],
    [0.06, 0.16],
    [0.16, 0.15],
    [0.23, 0.1],
    [0.25, 0.0],
    [0.23, -0.11],
    [0.14, -0.16],
    [0.02, -0.16],
    [-0.1, -0.14],
    [-0.18, -0.15],
    [-0.24, -0.1],
    [-0.2, -0.05],
  ],
  thickness: 0.045,
  scale: 0.648,
  bridgeX: 0.13,
  frets: 21,
  stringCount: 6,
  neckWidth: [0.042, 0.055],
  head: "inline6",
  pickups: [
    { x: -0.06, y: 0, w: 0.02, h: 0.065 },
    { x: 0.12, y: 0, w: 0.08, h: 0.075 },
    { x: 0.15, y: -0.1, w: 0.1, h: 0.03 },
  ],
  pick: true,
};
export const ELECTRIC_GUITAR_MUTED: InstrumentSpatialModel = spatialModel(TELE.id, place(guitar(TELE), STANDING));

const LES_PAUL_OUTLINE: P2[] = [
  [-0.2, 0.05],
  [-0.18, 0.12],
  [-0.1, 0.15],
  [0.0, 0.14],
  [0.08, 0.16],
  [0.16, 0.165],
  [0.23, 0.12],
  [0.25, 0.0],
  [0.23, -0.12],
  [0.16, -0.165],
  [0.08, -0.16],
  [0.0, -0.14],
  [-0.08, -0.14],
  [-0.16, -0.15],
  [-0.24, -0.11],
  [-0.21, -0.05],
];
const LES_PAUL: GuitarSpec = {
  id: "overdriven-guitar",
  outline: LES_PAUL_OUTLINE,
  thickness: 0.05,
  scale: 0.628,
  bridgeX: 0.12,
  frets: 22,
  stringCount: 6,
  neckWidth: [0.043, 0.056],
  head: "3+3",
  carved: true,
  pickups: [
    { x: -0.03, y: 0, w: 0.035, h: 0.07 },
    { x: 0.07, y: 0, w: 0.035, h: 0.07 },
  ],
  tailpiece: "stopbar",
};
export const OVERDRIVEN_GUITAR: InstrumentSpatialModel = spatialModel(LES_PAUL.id, place(guitar(LES_PAUL), STANDING));
export const GUITAR_HARMONICS: InstrumentSpatialModel = spatialModel("guitar-harmonics", place(guitar({ ...LES_PAUL, id: "guitar-harmonics" }), STANDING));

const SG: GuitarSpec = {
  id: "distortion-guitar",
  outline: [
    [-0.2, 0.04],
    [-0.28, 0.13],
    [-0.26, 0.16],
    [-0.18, 0.15],
    [-0.1, 0.13],
    [0.0, 0.13],
    [0.1, 0.15],
    [0.18, 0.14],
    [0.24, 0.08],
    [0.25, 0.0],
    [0.24, -0.08],
    [0.18, -0.14],
    [0.1, -0.15],
    [0.0, -0.13],
    [-0.1, -0.13],
    [-0.18, -0.15],
    [-0.26, -0.16],
    [-0.28, -0.13],
    [-0.2, -0.04],
  ],
  thickness: 0.035,
  scale: 0.628,
  bridgeX: 0.12,
  frets: 22,
  stringCount: 6,
  neckWidth: [0.043, 0.056],
  head: "3+3",
  pickups: [
    { x: -0.03, y: 0, w: 0.035, h: 0.07 },
    { x: 0.07, y: 0, w: 0.035, h: 0.07 },
  ],
  tailpiece: "stopbar",
};
export const DISTORTION_GUITAR: InstrumentSpatialModel = spatialModel(SG.id, place(guitar(SG), STANDING));

// ---------------------------------------------------------------------------
// Basses
// ---------------------------------------------------------------------------

const OFFSET_BASS_OUTLINE: P2[] = [
  [-0.24, 0.06],
  [-0.33, 0.14],
  [-0.3, 0.19],
  [-0.2, 0.18],
  [-0.1, 0.15],
  [0.0, 0.15],
  [0.1, 0.18],
  [0.2, 0.18],
  [0.27, 0.12],
  [0.3, 0.0],
  [0.27, -0.12],
  [0.18, -0.18],
  [0.06, -0.17],
  [-0.05, -0.15],
  [-0.15, -0.16],
  [-0.24, -0.18],
  [-0.28, -0.13],
  [-0.24, -0.06],
];
const BASS_COMMON = { outline: OFFSET_BASS_OUTLINE, thickness: 0.045, scale: 0.864, bridgeX: 0.2, frets: 20, stringCount: 4 as const, neckWidth: [0.042, 0.062] as const, head: "inline4" as const };

export const ELECTRIC_BASS_FINGER: InstrumentSpatialModel = spatialModel(
  "electric-bass-finger",
  place(
    guitar({
      ...BASS_COMMON,
      id: "electric-bass-finger",
      pickups: [
        { x: 0.0, y: 0.035, w: 0.025, h: 0.05 },
        { x: 0.025, y: -0.035, w: 0.025, h: 0.05 },
      ],
    }),
    STANDING_BASS,
  ),
);
export const ELECTRIC_BASS_PICK: InstrumentSpatialModel = spatialModel(
  "electric-bass-pick",
  place(
    guitar({
      ...BASS_COMMON,
      id: "electric-bass-pick",
      pickups: [
        { x: -0.02, y: 0, w: 0.02, h: 0.09 },
        { x: 0.12, y: 0, w: 0.02, h: 0.09 },
      ],
      pick: true,
    }),
    STANDING_BASS,
  ),
);
export const FRETLESS_BASS: InstrumentSpatialModel = spatialModel(
  "fretless-bass",
  place(
    guitar({
      ...BASS_COMMON,
      id: "fretless-bass",
      pickups: [
        { x: -0.02, y: 0, w: 0.02, h: 0.09 },
        { x: 0.12, y: 0, w: 0.02, h: 0.09 },
      ],
      fretless: true,
    }),
    STANDING_BASS,
  ),
);
const STINGRAY_OUTLINE: P2[] = [
  [-0.22, 0.06],
  [-0.3, 0.15],
  [-0.26, 0.19],
  [-0.15, 0.17],
  [-0.05, 0.15],
  [0.05, 0.16],
  [0.15, 0.19],
  [0.25, 0.16],
  [0.31, 0.06],
  [0.31, -0.06],
  [0.25, -0.16],
  [0.15, -0.19],
  [0.05, -0.16],
  [-0.05, -0.15],
  [-0.15, -0.17],
  [-0.24, -0.18],
  [-0.28, -0.13],
  [-0.22, -0.06],
];
const STINGRAY: GuitarSpec = { ...BASS_COMMON, id: "slap-bass", outline: STINGRAY_OUTLINE, head: "3+1", pickups: [{ x: 0.1, y: 0, w: 0.04, h: 0.1 }] };
export const SLAP_BASS_1: InstrumentSpatialModel = spatialModel("slap-bass-1", place(guitar({ ...STINGRAY, id: "slap-bass-1" }), STANDING_BASS));
export const SLAP_BASS_2: InstrumentSpatialModel = spatialModel("slap-bass-2", place(guitar({ ...STINGRAY, id: "slap-bass-2" }), { ...STANDING_BASS, roll: -32 }));
