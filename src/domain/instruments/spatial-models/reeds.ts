/**
 * Programs 64–71, the reeds: four saxophones, oboe, English horn, bassoon
 * and clarinet.
 *
 * Dimensions: soprano sax 0.65 m straight; alto 0.66 tall with a curved
 * neck and a 12 cm bell; tenor 0.80 with the crook in its neck; baritone
 * 1.2 with the upper loop; oboe 0.65 (bell 5 cm); English horn 0.80 with
 * its bulb bell and bent bocal; bassoon 1.34 (wing and long joints side by
 * side, bell at the top, bocal to the mouth); clarinet 0.66 (bell 8 cm).
 *
 * Straight instruments are built mouth at the origin, body along −y, then
 * pitched forward-down to their playing angle (clarinet 35° from vertical,
 * oboe 40°, soprano 40°). The curved saxes are built with the neck
 * receiver at the origin and hang in front of the player from a mouthpiece
 * at lip height.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { bentTube, lathe, line, merge, place, ring, tube, type P2, type Strokes } from "../spatial-geometry";

const MOUTH: Vec3 = [0, 1.5, 0.1];

/** Key cups down the front (+z) of a body of radius `r(y)`, with two rods beside them. */
function keywork(ys: readonly number[], radiusAt: (y: number) => number, cup = 0.008): Strokes {
  const out: Strokes = [];
  for (const y of ys) out.push(ring([0, y, radiusAt(y) + 0.006], cup, "z", 8));
  const y0 = ys[0];
  const y1 = ys[ys.length - 1];
  out.push(line([0.012, y0, radiusAt(y0) + 0.004], [0.012, y1, radiusAt(y1) + 0.004]), line([-0.012, y0, radiusAt(y0) + 0.004], [-0.012, y1, radiusAt(y1) + 0.004]));
  return out;
}

function evenly(from: number, to: number, count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) out.push(from + ((to - from) * i) / (count - 1));
  return out;
}

// ---------------------------------------------------------------------------
// Clarinet, oboe, English horn, soprano sax: straight, along −y.
// ---------------------------------------------------------------------------

const CLARINET_PROFILE: P2[] = [
  [0.009, 0],
  [0.013, -0.07],
  [0.02, -0.078],
  [0.02, -0.095],
  [0.017, -0.1],
  [0.017, -0.245],
  [0.019, -0.25],
  [0.017, -0.255],
  [0.017, -0.55],
  [0.022, -0.58],
  [0.032, -0.62],
  [0.042, -0.66],
];
export const CLARINET: InstrumentSpatialModel = spatialModel(
  "clarinet",
  place(
    merge(lathe(CLARINET_PROFILE, { segments: 12, meridians: 4 }), [line([0, 0, 0.01], [0, -0.07, 0.013])], keywork(evenly(-0.12, -0.5, 12), () => 0.017)),
    { pitch: -35, at: MOUTH },
  ),
);

const OBOE_PROFILE: P2[] = [
  [0.004, 0],
  [0.004, -0.06],
  [0.012, -0.07],
  [0.012, -0.3],
  [0.014, -0.31],
  [0.013, -0.32],
  [0.013, -0.55],
  [0.02, -0.6],
  [0.028, -0.65],
];
export const OBOE: InstrumentSpatialModel = spatialModel(
  "oboe",
  place(
    merge(lathe(OBOE_PROFILE, { segments: 10, meridians: 4 }), [line([-0.005, 0, 0], [-0.005, -0.055, 0]), line([0.005, 0, 0], [0.005, -0.055, 0])], keywork(evenly(-0.1, -0.52, 14), () => 0.013, 0.006)),
    { pitch: -40, at: MOUTH },
  ),
);

function englishHorn(): Strokes {
  const bocal = bentTube(
    [
      [0, 0, 0],
      [0, -0.03, 0.02],
      [0, -0.06, 0.03],
      [0, -0.09, 0.02],
    ],
    0.004,
    { segments: 6, meridians: 3, up: [1, 0, 0] },
  );
  const body = lathe(
    [
      [0.013, -0.09],
      [0.013, -0.35],
      [0.016, -0.36],
      [0.015, -0.37],
      [0.016, -0.7],
      [0.022, -0.73],
      [0.03, -0.77],
      [0.024, -0.81],
      [0.012, -0.84],
    ],
    { segments: 10, meridians: 4 },
  );
  return place(merge(bocal, body, keywork(evenly(-0.14, -0.66, 14), () => 0.015, 0.006)), { pitch: -40, at: MOUTH });
}
export const ENGLISH_HORN: InstrumentSpatialModel = spatialModel("english-horn", englishHorn());

const SOPRANO_PROFILE: P2[] = [
  [0.011, 0],
  [0.013, -0.07],
  [0.014, -0.08],
  [0.02, -0.3],
  [0.026, -0.5],
  [0.03, -0.58],
  [0.04, -0.62],
  [0.048, -0.65],
];
export const SOPRANO_SAX: InstrumentSpatialModel = spatialModel(
  "soprano-sax",
  place(merge(lathe(SOPRANO_PROFILE, { segments: 12, meridians: 4 }), keywork(evenly(-0.12, -0.56, 14), (y) => 0.014 + (0.026 - 0.014) * (-y / 0.65), 0.01)), { pitch: -40, at: MOUTH }),
);

// ---------------------------------------------------------------------------
// Curved saxophones: neck receiver at the origin; body down, bow, bell up in front.
// ---------------------------------------------------------------------------

interface SaxSpec {
  readonly body: number;
  readonly bore: readonly [number, number];
  readonly bell: number;
  readonly bellTop: number;
  readonly neck: readonly Vec3[];
  readonly loop?: boolean;
}

function curvedSax(spec: SaxSpec): Strokes {
  const b = spec.body;
  const [r0, r1] = spec.bore;
  const bowR = r1 * 1.15;
  const path: Vec3[] = [
    [0, 0, 0],
    [0, -b * 0.35, 0],
    [0, -b * 0.7, 0],
    [0, -b, 0],
    [0, -b - r1 * 2, r1 * 0.6],
    [0, -b - r1 * 3, r1 * 2.4],
    [0, -b - r1 * 2, r1 * 4],
    [0, -b, r1 * 4.6],
    [0, spec.bellTop - 0.12, r1 * 4.8],
    [0, spec.bellTop - 0.05, r1 * 4.8],
    [0, spec.bellTop, r1 * 4.8],
  ];
  const radii = [r0, r0 + (r1 - r0) * 0.35, r0 + (r1 - r0) * 0.7, r1, bowR, bowR, bowR, bowR, r1 * 1.1, spec.bell * 0.7, spec.bell];
  const tubeStrokes = bentTube(path, radii, { segments: 12, meridians: 4, up: [1, 0, 0] });
  const neck = bentTube(spec.neck, 0.011, { segments: 8, meridians: 3, up: [1, 0, 0] });
  const mouthpiece = spec.neck[spec.neck.length - 1];
  const keys = keywork(evenly(-0.08, -b * 0.85, 12), (y) => r0 + (r1 - r0) * (-y / b), 0.011);
  const bellKeys = [ring([-r1 * 1.3, spec.bellTop - 0.2, r1 * 4.8], 0.022, "x", 10), ring([-r1 * 1.3, spec.bellTop - 0.26, r1 * 4.8], 0.02, "x", 10)];
  const extras: Strokes = [line([0, -0.05, r0 + 0.01], [0, -0.05, r0 + 0.03])];
  if (spec.loop) extras.push(ring([0, 0.07, -0.02], 0.06, "x", 14), ring([0, 0.07, -0.02], 0.05, "x", 14));
  return merge(tubeStrokes, neck, tube(mouthpiece, [mouthpiece[0], mouthpiece[1] + 0.02, mouthpiece[2] - 0.04], 0.012, { segments: 8, meridians: 3 }), keys, bellKeys, extras);
}

const ALTO_SPEC: SaxSpec = {
  body: 0.5,
  bore: [0.014, 0.036],
  bell: 0.062,
  bellTop: -0.2,
  neck: [
    [0, 0, 0],
    [0, 0.06, -0.03],
    [0, 0.1, -0.09],
    [0, 0.11, -0.13],
  ],
};
const TENOR_SPEC: SaxSpec = {
  body: 0.62,
  bore: [0.016, 0.042],
  bell: 0.075,
  bellTop: -0.24,
  neck: [
    [0, 0, 0],
    [0, 0.07, -0.02],
    [0, 0.12, -0.08],
    [0, 0.11, -0.14],
    [0, 0.08, -0.18],
  ],
};
const BARITONE_SPEC: SaxSpec = {
  body: 0.75,
  bore: [0.02, 0.05],
  bell: 0.095,
  bellTop: -0.2,
  loop: true,
  neck: [
    [0, 0, 0],
    [0, 0.13, -0.02],
    [0, 0.15, -0.09],
    [0, 0.12, -0.15],
  ],
};

/** Hung so the mouthpiece meets the lips: the neck's last point lands at `MOUTH`. */
function hang(spec: SaxSpec, dropBelowMouth: number): Strokes {
  const m = spec.neck[spec.neck.length - 1];
  return place(curvedSax(spec), { at: [MOUTH[0] + 0.05 - m[0], MOUTH[1] - dropBelowMouth - m[1], MOUTH[2] - m[2] + 0.02] });
}
export const ALTO_SAX: InstrumentSpatialModel = spatialModel("alto-sax", hang(ALTO_SPEC, 0));
export const TENOR_SAX: InstrumentSpatialModel = spatialModel("tenor-sax", hang(TENOR_SPEC, 0));
export const BARITONE_SAX: InstrumentSpatialModel = spatialModel("baritone-sax", hang(BARITONE_SPEC, 0.02));

// ---------------------------------------------------------------------------
// Bassoon: butt at the origin, wing and long joints up, bell at 1.34 m.
// ---------------------------------------------------------------------------

function bassoon(): Strokes {
  const wingX = 0.026;
  const longX = -0.026;
  const out = merge(
    lathe(
      [
        [0.05, 0],
        [0.055, 0.04],
        [0.05, 0.12],
      ],
      { segments: 12, meridians: 4 },
    ).map((s) => s.map(([x, y, z]): Vec3 => [x, y, z])),
    tube([wingX, 0.1, 0], [wingX, 0.56, 0], 0.014, { segments: 8, meridians: 3, rings: 3 }),
    tube([longX, 0.1, 0], [longX, 1.1, 0], 0.02, { segments: 8, meridians: 3, rings: 4 }),
    lathe(
      [
        [0.02, 1.1],
        [0.022, 1.22],
        [0.028, 1.3],
        [0.032, 1.34],
      ],
      { segments: 10, meridians: 4 },
    ).map((s) => s.map(([x, y, z]): Vec3 => [x + longX, y, z])),
    bentTube(
      [
        [wingX, 0.56, 0],
        [wingX + 0.01, 0.63, 0.03],
        [wingX + 0.02, 0.69, 0.07],
        [wingX + 0.03, 0.72, 0.1],
      ],
      0.005,
      { segments: 6, meridians: 3, up: [1, 0, 0] },
    ),
    [line([0.005, 0.72, 0.1], [0.06, 0.72, 0.1])],
  );
  // Rods and cups on the long joint and the wing.
  for (let i = 0; i < 6; i++) out.push(ring([longX, 0.25 + i * 0.12, 0.026], 0.009, "z", 8));
  for (let i = 0; i < 4; i++) out.push(ring([wingX, 0.2 + i * 0.09, 0.02], 0.008, "z", 8));
  out.push(line([longX + 0.018, 0.2, 0.024], [longX + 0.018, 1.0, 0.024]), line([wingX - 0.014, 0.15, 0.02], [wingX - 0.014, 0.5, 0.02]));
  return place(out, { roll: 24, at: [0.3, 0.72, 0.25] });
}
export const BASSOON: InstrumentSpatialModel = spatialModel("bassoon", bassoon());
