/**
 * Programs 72–79, the pipes: piccolo, flute, recorder, pan flute, blown
 * bottle, shakuhachi, tin whistle and ocarina.
 *
 * Dimensions: flute 0.67 m (19 mm bore, 13 keys), piccolo 0.32; soprano
 * recorder 0.33; a 18-tube pan flute, tubes 8→32 cm; a 0.28 m bottle;
 * shakuhachi 0.545 (1.8 shaku), five holes; tin whistle 0.30, six holes;
 * a 16 cm sweet-potato ocarina.
 *
 * The transverse flutes are built along +x from the embouchure and held
 * out to the player's right, tipped 10° down and 15° forward. The rest are
 * built mouth at the origin along −y and pitched to their playing angle.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { lathe, line, merge, place, rect, ring, rotateZ, tube, type P2, type Strokes } from "../spatial-geometry";

const MOUTH: Vec3 = [0, 1.5, 0.1];

function transverseFlute(length: number, bore: number, keys: number): Strokes {
  const out = merge(
    tube([0, 0, 0], [length, 0, 0], bore, { segments: 10, meridians: 4, rings: 4 }),
    [rect([0.05, bore + 0.002, 0], 0.035, 0.022, "xz"), ring([0.05, bore + 0.002, 0], 0.006, "y", 8)],
    [ring([0.005, 0, 0], bore + 0.003, "x", 10), ring([length * 0.78, 0, 0], bore + 0.003, "x", 10), ring([length - 0.005, 0, 0], bore + 0.003, "x", 10)],
  );
  for (let i = 0; i < keys; i++) {
    const x = length * 0.28 + (length * 0.65 * i) / (keys - 1);
    out.push(ring([x, bore * 0.4, bore + 0.006], bore * 1.05, "z", 8));
  }
  out.push(line([length * 0.25, bore * 0.9, bore * 0.6], [length * 0.95, bore * 0.9, bore * 0.6]));
  out.push(line([length * 0.25, -bore * 0.9, bore * 0.6], [length * 0.95, -bore * 0.9, bore * 0.6]));
  return place(out, { roll: -10, yaw: -15, at: [MOUTH[0] + 0.02, MOUTH[1] - 0.01, MOUTH[2]] });
}
export const FLUTE: InstrumentSpatialModel = spatialModel("flute", transverseFlute(0.67, 0.0095, 13));
export const PICCOLO: InstrumentSpatialModel = spatialModel("piccolo", transverseFlute(0.32, 0.007, 8));

function fingerHoles(ys: readonly number[], radiusAt: (y: number) => number, r = 0.004): Strokes {
  return ys.map((y) => ring([0, y, radiusAt(y) + 0.001], r, "z", 6));
}

const RECORDER_PROFILE: P2[] = [
  [0.011, 0],
  [0.013, -0.03],
  [0.016, -0.035],
  [0.016, -0.2],
  [0.019, -0.205],
  [0.015, -0.21],
  [0.015, -0.28],
  [0.02, -0.31],
  [0.023, -0.33],
];
export const RECORDER: InstrumentSpatialModel = spatialModel(
  "recorder",
  place(
    merge(lathe(RECORDER_PROFILE, { segments: 10, meridians: 4 }), [rect([0, -0.05, 0.017], 0.012, 0.014, "xy")], fingerHoles([-0.09, -0.12, -0.15, -0.19, -0.23, -0.26, -0.29], () => 0.016)),
    { pitch: -45, at: MOUTH },
  ),
);

function panFlute(): Strokes {
  const out: Strokes = [];
  const count = 18;
  for (let i = 0; i < count; i++) {
    const x = -0.17 + i * 0.02;
    const len = 0.32 - (0.24 * i) / (count - 1);
    // A gentle arc: the tubes bow away from the lips toward the ends.
    const z = 0.02 * Math.pow((i - (count - 1) / 2) / ((count - 1) / 2), 2);
    out.push(...tube([x, 0, z], [x, -len, z], 0.0085, { segments: 6, meridians: 2 }));
  }
  out.push(line([-0.19, -0.03, -0.01], [0.19, -0.03, -0.01]), line([-0.19, -0.075, -0.01], [0.19, -0.075, -0.01]));
  return place(out, { pitch: -20, at: [MOUTH[0], MOUTH[1] + 0.005, MOUTH[2] - 0.02] });
}
export const PAN_FLUTE: InstrumentSpatialModel = spatialModel("pan-flute", panFlute());

const BOTTLE_PROFILE: P2[] = [
  [0.012, 0],
  [0.014, -0.01],
  [0.012, -0.05],
  [0.028, -0.09],
  [0.035, -0.12],
  [0.035, -0.26],
  [0.03, -0.28],
];
export const BLOWN_BOTTLE: InstrumentSpatialModel = spatialModel("blown-bottle", place(lathe(BOTTLE_PROFILE, { segments: 12, meridians: 4 }), { pitch: -28, at: [MOUTH[0], MOUTH[1] - 0.005, MOUTH[2] + 0.02] }));

const SHAKUHACHI_PROFILE: P2[] = [
  [0.017, 0],
  [0.019, -0.1],
  [0.021, -0.3],
  [0.024, -0.45],
  [0.028, -0.52],
  [0.03, -0.545],
];
export const SHAKUHACHI: InstrumentSpatialModel = spatialModel(
  "shakuhachi",
  place(
    merge(
      lathe(SHAKUHACHI_PROFILE, { segments: 10, meridians: 4 }),
      [ring([0, -0.47, 0], 0.026, "y", 10), ring([0, -0.5, 0], 0.028, "y", 10), ring([0, -0.53, 0], 0.03, "y", 10)],
      fingerHoles([-0.28, -0.33, -0.38, -0.43], () => 0.022, 0.005),
      [ring([0, -0.25, -0.022], 0.005, "z", 6)],
      [line([-0.012, 0.005, 0.014], [0.012, 0.005, 0.014])],
    ),
    { pitch: -45, at: MOUTH },
  ),
);

const WHISTLE_PROFILE: P2[] = [
  [0.008, 0],
  [0.009, -0.035],
  [0.0075, -0.04],
  [0.0075, -0.3],
];
export const WHISTLE: InstrumentSpatialModel = spatialModel(
  "whistle",
  place(merge(lathe(WHISTLE_PROFILE, { segments: 8, meridians: 4 }), [rect([0, -0.03, 0.009], 0.007, 0.01, "xy")], fingerHoles([-0.13, -0.16, -0.19, -0.23, -0.26, -0.29], () => 0.0075, 0.003)), {
    pitch: -40,
    at: MOUTH,
  }),
);

function ocarina(): Strokes {
  const body = rotateZ(
    lathe(
      [
        [0, 0],
        [0.03, 0.02],
        [0.04, 0.05],
        [0.038, 0.1],
        [0.022, 0.14],
        [0.008, 0.16],
      ],
      { segments: 12, meridians: 6 },
    ),
    -90,
  );
  const out = merge(
    body,
    tube([0.02, 0.01, -0.02], [0.02, 0.012, -0.06], 0.008, { segments: 6, meridians: 3 }),
  );
  for (const [x, z] of [
    [0.04, 0.02],
    [0.06, 0.03],
    [0.08, 0.02],
    [0.1, 0.0],
    [0.11, -0.02],
    [0.05, -0.015],
    [0.07, -0.005],
    [0.09, -0.025],
    [0.13, 0.0],
    [0.03, -0.01],
  ])
    out.push(ring([x, 0.038, z], 0.004, "y", 6));
  return place(out, { at: [MOUTH[0] - 0.02, MOUTH[1] - 0.01, MOUTH[2] + 0.06] });
}
export const OCARINA: InstrumentSpatialModel = spatialModel("ocarina", ocarina());
