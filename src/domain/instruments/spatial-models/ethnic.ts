/**
 * Programs 104–111: sitar, banjo, shamisen, koto, kalimba, bagpipe, shanai.
 * (110, the fiddle, is in bowed.ts.)
 *
 * Dimensions: sitar 1.2 m, 35 cm gourd, 9 cm neck with 20 arched frets,
 * played seated on the floor; banjo 28 cm rim, 95 cm overall; shamisen
 * 20 × 22 cm body on an 80 cm neck, played kneeling with a large bachi;
 * koto 1.8 m × 25 cm, 13 strings on movable bridges, on the floor before a
 * kneeling player; a 17-tine kalimba held in both hands; Great Highland
 * bagpipe — 94 cm bass drone, 47 cm tenors, 44 cm chanter, bag under the
 * left arm; shehnai ≈ 0.48 m with a flared metal bell.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { drum } from "../spatial-parts";
import { box, ellipse, extrude, lathe, line, merge, place, rect, ring, rotateX, smoothClosed, spread, strings, tube, type P2, type Strokes } from "../spatial-geometry";

const MOUTH: Vec3 = [0, 1.5, 0.1];

function sitar(): Strokes {
  // Gourd at the origin, neck up (+y); then tilted 45° with the gourd at the player's left foot.
  const gourd = lathe(
    [
      [0.02, -0.16],
      [0.11, -0.13],
      [0.16, -0.06],
      [0.17, 0.03],
      [0.14, 0.12],
      [0.08, 0.19],
      [0.045, 0.24],
    ],
    { segments: 16, meridians: 6 },
  );
  const neckLen = 0.85;
  const out = merge(
    gourd,
    [line([-0.045, 0.24, 0.02], [-0.045, 0.24 + neckLen, 0.02]), line([0.045, 0.24, 0.02], [0.045, 0.24 + neckLen, 0.02])],
    [line([-0.045, 0.24, -0.02], [-0.045, 0.24 + neckLen, -0.02]), line([0.045, 0.24, -0.02], [0.045, 0.24 + neckLen, -0.02])],
    lathe(
      [
        [0.02, 0.24 + neckLen + 0.05],
        [0.08, 0.24 + neckLen + 0.12],
        [0.06, 0.24 + neckLen + 0.2],
        [0.01, 0.24 + neckLen + 0.23],
      ],
      { segments: 12, meridians: 4 },
    ),
    [rect([0, 0.16, 0.03], 0.08, 0.02, "xy")],
  );
  for (let i = 0; i < 20; i++) {
    const y = 0.3 + (i * (neckLen - 0.1)) / 19;
    out.push(ellipse([0, y, 0.03], 0.05, 0.012, "y", 8, { from: 180, to: 360 }));
  }
  for (let i = 0; i < 6; i++) {
    const y = 0.24 + neckLen - 0.06 - i * 0.07;
    const s = i % 2 === 0 ? 1 : -1;
    out.push(line([s * 0.045, y, 0], [s * 0.1, y, 0]), ring([s * 0.1, y, 0], 0.014, "x", 6));
  }
  out.push(...strings(spread([0, 0.24 + neckLen, 0.035], [1, 0, 0], 7, 0.011), spread([0, 0.16, 0.04], [1, 0, 0], 7, 0.011)));
  out.push(...strings(spread([0, 0.24 + neckLen - 0.3, 0.015], [1, 0, 0], 5, 0.012), spread([0, 0.17, 0.02], [1, 0, 0], 5, 0.012)));
  return place(out, { roll: 42, pitch: -10, at: [-0.28, 0.22, 0.32] });
}
export const SITAR: InstrumentSpatialModel = spatialModel("sitar", sitar());

function banjo(): Strokes {
  // Rim in the xy plane facing +z, neck toward −x.
  const out = merge(
    rotateX(drum([0, 0, 0], 0.14, 0.075, { lugs: 16 }), 90),
    [ring([0, 0, 0.04], 0.15, "z", 24)],
    [line([-0.14, 0.014, 0.05], [-0.74, 0.012, 0.05]), line([-0.14, -0.014, 0.05], [-0.74, -0.012, 0.05]), line([-0.14, 0.014, 0.02], [-0.72, 0.012, 0.025]), line([-0.14, -0.014, 0.02], [-0.72, -0.012, 0.025])],
    [rect([0.05, 0, 0.041], 0.012, 0.03, "xy"), rect([0.14, 0, 0.041], 0.02, 0.02, "xy")],
    [
      [
        [-0.74, 0.018, 0.05],
        [-0.9, 0.024, 0.02],
        [-0.9, -0.024, 0.02],
        [-0.74, -0.018, 0.05],
      ],
    ],
  );
  for (let n = 1; n <= 22; n++) {
    const x = -0.74 + 0.66 * (1 - Math.pow(2, -n / 12));
    out.push(line([x, 0.013, 0.051], [x, -0.013, 0.051]));
  }
  out.push(...strings(spread([-0.74, 0, 0.056], [0, 1, 0], 5, 0.0065), spread([0.05, 0, 0.05], [0, 1, 0], 5, 0.011)));
  for (let i = 0; i < 4; i++) out.push(line([-0.78 - i * 0.03, 0.02 * (i % 2 ? 1 : -1), 0.03], [-0.78 - i * 0.03, 0.045 * (i % 2 ? 1 : -1), 0.03]));
  out.push(line([-0.48, 0.02, 0.06], [-0.48, 0.045, 0.06]));
  return place(out, { roll: -26, pitch: -10, yaw: 14, at: [0.1, 0.98, 0.3] });
}
export const BANJO: InstrumentSpatialModel = spatialModel("banjo", banjo());

function shamisen(): Strokes {
  const body: P2[] = smoothClosed(
    [
      [-0.1, 0.08],
      [0.0, 0.11],
      [0.1, 0.08],
      [0.11, 0.0],
      [0.1, -0.08],
      [0.0, -0.11],
      [-0.1, -0.08],
      [-0.11, 0.0],
    ],
    3,
  );
  const out = merge(
    extrude(body, 0.1, "xy", 4),
    [line([-0.11, 0.014, 0.05], [-0.9, 0.012, 0.05]), line([-0.11, -0.014, 0.05], [-0.9, -0.012, 0.05]), line([-0.11, 0, 0.02], [-0.9, 0, 0.025])],
    [rect([0.06, 0, 0.051], 0.008, 0.03, "xy")],
    [
      [
        [-0.9, 0.014, 0.05],
        [-1.02, 0.02, 0.02],
        [-1.02, -0.02, 0.02],
        [-0.9, -0.014, 0.05],
      ],
    ],
    // Bachi: a broad fan-shaped plectrum over the strings.
    [
      [
        [0.02, 0.0, 0.09],
        [0.05, 0.08, 0.14],
        [0.1, 0.09, 0.14],
        [0.07, 0.0, 0.1],
        [0.02, 0.0, 0.09],
      ],
      line([0.07, 0.0, 0.1], [0.14, -0.05, 0.16]),
    ],
  );
  for (let i = 0; i < 3; i++) {
    const s = i === 1 ? -1 : 1;
    out.push(line([-0.93 - i * 0.03, s * 0.02, 0.03], [-0.93 - i * 0.03, s * 0.06, 0.03]));
  }
  out.push(...strings(spread([-0.9, 0, 0.056], [0, 1, 0], 3, 0.006), spread([0.06, 0, 0.055], [0, 1, 0], 3, 0.01)));
  return place(out, { roll: -40, pitch: -15, yaw: 20, at: [0.2, 0.5, 0.32] });
}
export const SHAMISEN: InstrumentSpatialModel = spatialModel("shamisen", shamisen());

function koto(): Strokes {
  const out = box([0, 0.13, 0.5], [1.8, 0.06, 0.25]);
  for (const x of [-0.85, 0.85]) out.push(line([x, 0, 0.42], [x, 0.1, 0.42]), line([x, 0, 0.58], [x, 0.1, 0.58]));
  for (let i = 0; i < 13; i++) {
    const z = 0.4 + i * 0.0165;
    out.push(line([-0.86, 0.17, z], [0.86, 0.17, z]));
    const bx = -0.62 + i * 0.09;
    out.push([
      [bx - 0.02, 0.16, z],
      [bx, 0.19, z],
      [bx + 0.02, 0.16, z],
    ]);
  }
  return out;
}
export const KOTO: InstrumentSpatialModel = spatialModel("koto", koto());

function kalimba(): Strokes {
  const out = box([0, 0, 0], [0.18, 0.035, 0.13]);
  out.push(ring([0, 0.018, 0.02], 0.015, "y", 10), line([-0.075, 0.02, -0.035], [0.075, 0.02, -0.035]));
  for (let i = 0; i < 17; i++) {
    const x = -0.064 + i * 0.008;
    const len = 0.045 + 0.035 * (1 - Math.abs(i - 8) / 8);
    out.push(line([x, 0.022, -0.035], [x, 0.03, -0.035 + len]));
  }
  return place(out, { pitch: -30, at: [0, 1.12, 0.3] });
}
export const KALIMBA: InstrumentSpatialModel = spatialModel("kalimba", kalimba());

function bagpipe(): Strokes {
  const bag = rotateX(
    lathe(
      [
        [0.02, -0.28],
        [0.1, -0.2],
        [0.14, -0.05],
        [0.13, 0.1],
        [0.08, 0.22],
        [0.02, 0.28],
      ],
      { segments: 12, meridians: 6 },
    ),
    90,
  );
  const bagAt: Vec3 = [-0.22, 1.05, 0.15];
  const out = merge(
    place(bag, { at: bagAt }),
    // Chanter, hanging down and forward from the bag's front stock.
    tube([-0.18, 0.95, 0.4], [-0.14, 0.55, 0.58], 0.012, { segments: 8, meridians: 3, rings: 3 }),
    // Blowpipe to the mouth.
    tube([-0.18, 1.16, 0.06], MOUTH, 0.009, { segments: 6, meridians: 3, rings: 2 }),
    // Drones over the left shoulder: one bass, two tenors.
    tube([-0.22, 1.18, 0.1], [-0.42, 1.98, -0.32], 0.016, { segments: 8, meridians: 3, rings: 4 }),
    tube([-0.17, 1.18, 0.08], [-0.28, 1.6, -0.14], 0.012, { segments: 8, meridians: 3, rings: 3 }),
    tube([-0.27, 1.16, 0.12], [-0.4, 1.56, -0.08], 0.012, { segments: 8, meridians: 3, rings: 3 }),
    [line([-0.42, 1.98, -0.32], [-0.28, 1.6, -0.14]), line([-0.28, 1.6, -0.14], [-0.4, 1.56, -0.08])],
  );
  for (let i = 0; i < 8; i++) {
    const t = 0.25 + i * 0.08;
    out.push(ring([-0.18 + 0.04 * t, 0.95 - 0.4 * t, 0.4 + 0.18 * t], 0.004, "z", 6));
  }
  return out;
}
export const BAGPIPE: InstrumentSpatialModel = spatialModel("bagpipe", bagpipe());

export const SHANAI: InstrumentSpatialModel = spatialModel(
  "shanai",
  place(
    merge(
      lathe(
        [
          [0.005, 0],
          [0.005, -0.05],
          [0.012, -0.06],
          [0.014, -0.3],
          [0.02, -0.36],
          [0.04, -0.44],
          [0.06, -0.48],
        ],
        { segments: 12, meridians: 4 },
      ),
      [-0.1, -0.14, -0.18, -0.22, -0.26, -0.3, -0.34].map((y) => ring([0, y, 0.015], 0.004, "z", 6)),
    ),
    { pitch: -45, at: MOUTH },
  ),
);
