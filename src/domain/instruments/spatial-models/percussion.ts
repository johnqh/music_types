/**
 * Programs 112–119, the percussive family: tinkle bell, agogô, steel pan,
 * woodblock, taiko, melodic toms, synth drum, reverse cymbal.
 *
 * Dimensions: a 10 cm handbell; agogô cones of 10 and 13 cm; a 57 cm tenor
 * steel pan with a 20 cm skirt on a stand at 0.9 m; a 20 cm woodblock; a
 * nagadō-daiko with a 52 cm head and 56 cm barrel on a tilted stand, with
 * 40 cm bachi; four concert toms 8/10/12/14" on a rack; six Simmons-style
 * hexagonal pads; an 18" cymbal on a straight stand.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { box, ellipse, lathe, line, merge, place, rect, ring, translate, tube, type Strokes } from "../spatial-geometry";
import { cymbal, drum, hexPad, mallet, stand, stick } from "../spatial-parts";

function handbell(): Strokes {
  const bell = lathe(
    [
      [0.05, 0],
      [0.048, 0.02],
      [0.04, 0.06],
      [0.03, 0.09],
      [0.018, 0.1],
      [0.012, 0.11],
      [0.012, 0.2],
      [0.02, 0.21],
    ],
    { segments: 14, meridians: 6 },
  );
  return place(merge(bell, [line([0, 0.09, 0], [0, 0.01, 0]), ring([0, 0.012, 0], 0.01, "y", 6)]), { roll: 30, at: [0.14, 1.2, 0.3] });
}
export const TINKLE_BELL: InstrumentSpatialModel = spatialModel("tinkle-bell", handbell());

function agogo(): Strokes {
  const small = lathe(
    [
      [0.018, 0],
      [0.03, 0.05],
      [0.045, 0.1],
    ],
    { segments: 12, meridians: 4 },
  );
  const large = lathe(
    [
      [0.022, 0],
      [0.04, 0.07],
      [0.06, 0.13],
    ],
    { segments: 12, meridians: 4 },
  );
  const out = merge(translate(small, [-0.06, 0, 0]), translate(large, [0.07, 0, 0]), [
    [
      [-0.06, 0, 0],
      [-0.06, -0.06, 0],
      [0.0, -0.09, 0],
      [0.07, -0.06, 0],
      [0.07, 0, 0],
    ],
  ]);
  return merge(place(out, { pitch: 60, at: [-0.15, 1.2, 0.32] }), stick([0.2, 1.15, 0.2], [0.02, 1.15, 0.38]));
}
export const AGOGO: InstrumentSpatialModel = spatialModel("agogo", agogo());

function steelPan(): Strokes {
  const rimY = 0.9;
  const out = merge(
    [ring([0, rimY, 0.5], 0.285, "y", 28), ring([0, rimY - 0.2, 0.5], 0.285, "y", 28)],
    [ring([0, rimY - 0.03, 0.5], 0.24, "y", 24), ring([0, rimY - 0.07, 0.5], 0.16, "y", 20), ring([0, rimY - 0.09, 0.5], 0.08, "y", 12)],
    stand([0, 0, 0.5], [0, rimY - 0.2, 0.5], 0.32),
    stick([-0.15, 1.15, 0.2], [-0.1, 0.9, 0.42]),
    stick([0.15, 1.15, 0.2], [0.12, 0.9, 0.48]),
  );
  for (let i = 0; i < 4; i++) {
    const t = (Math.PI * 2 * i) / 4;
    out.push(line([Math.cos(t) * 0.285, rimY, 0.5 + Math.sin(t) * 0.285], [Math.cos(t) * 0.285, rimY - 0.2, 0.5 + Math.sin(t) * 0.285]));
  }
  for (let i = 0; i < 8; i++) {
    const t = (Math.PI * 2 * i) / 8;
    out.push(ellipse([Math.cos(t) * 0.2, rimY - 0.045, 0.5 + Math.sin(t) * 0.2], 0.05, 0.035, "y", 8));
  }
  for (let i = 0; i < 6; i++) {
    const t = (Math.PI * 2 * i) / 6 + 0.3;
    out.push(ellipse([Math.cos(t) * 0.12, rimY - 0.08, 0.5 + Math.sin(t) * 0.12], 0.03, 0.025, "y", 8));
  }
  return out;
}
export const STEEL_DRUMS: InstrumentSpatialModel = spatialModel("steel-drums", steelPan());

export const WOODBLOCK: InstrumentSpatialModel = spatialModel(
  "woodblock",
  merge(box([0, 1.0, 0.45], [0.2, 0.06, 0.06]), [line([-0.08, 1.02, 0.42], [0.08, 1.02, 0.42])], stand([0, 0, 0.45], [0, 0.97, 0.45], 0.25), mallet([0.18, 1.2, 0.2], [0.04, 1.06, 0.44], 0.014)),
);

function taiko(): Strokes {
  const body = lathe(
    [
      [0.26, 0],
      [0.3, 0.12],
      [0.32, 0.28],
      [0.3, 0.44],
      [0.26, 0.56],
    ],
    { segments: 20, meridians: 8 },
  );
  const tacks = [ring([0, 0.03, 0], 0.27, "y", 20), ring([0, 0.53, 0], 0.27, "y", 20)];
  const drumAt: Vec3 = [0, 0.85, 0.7];
  const out = merge(
    place(merge(body, tacks), { pitch: -45, at: [drumAt[0], drumAt[1] - 0.28, drumAt[2] + 0.2] }),
    [line([-0.35, 0, 0.5], [-0.28, 0.75, 0.7]), line([0.35, 0, 0.5], [0.28, 0.75, 0.7]), line([-0.35, 0, 1.0], [-0.28, 0.75, 0.85]), line([0.35, 0, 1.0], [0.28, 0.75, 0.85]), line([-0.35, 0, 0.5], [-0.35, 0, 1.0]), line([0.35, 0, 0.5], [0.35, 0, 1.0])],
    tube([-0.22, 1.3, 0.2], [-0.12, 1.05, 0.52], 0.012, { segments: 6, meridians: 2 }),
    tube([0.22, 1.3, 0.2], [0.12, 1.05, 0.52], 0.012, { segments: 6, meridians: 2 }),
  );
  return out;
}
export const TAIKO_DRUM: InstrumentSpatialModel = spatialModel("taiko-drum", taiko());

function melodicToms(): Strokes {
  const out: Strokes = [line([-0.85, 0.95, 0.6], [0.85, 0.95, 0.6]), ...stand([-0.8, 0, 0.6], [-0.8, 0.95, 0.6]), ...stand([0.8, 0, 0.6], [0.8, 0.95, 0.6])];
  const radii = [0.1, 0.127, 0.152, 0.178];
  const xs = [-0.6, -0.2, 0.2, 0.6];
  for (let i = 0; i < 4; i++) {
    const d = drum([0, 0, 0], radii[i], 0.3, { lugs: 6 });
    out.push(...place(d, { pitch: -15, at: [xs[i], 0.78, 0.62] }));
    out.push(line([xs[i], 0.95, 0.6], [xs[i], 0.9, 0.62]));
  }
  out.push(...stick([-0.15, 1.1, 0.2], [-0.25, 0.98, 0.55]), ...stick([0.15, 1.1, 0.2], [0.22, 0.98, 0.55]));
  return out;
}
export const MELODIC_TOM: InstrumentSpatialModel = spatialModel("melodic-tom", melodicToms());

function synthDrum(): Strokes {
  const out: Strokes = [line([-0.7, 0.98, 0.6], [0.7, 0.98, 0.6]), ...stand([-0.65, 0, 0.6], [-0.65, 0.98, 0.6]), ...stand([0.65, 0, 0.6], [0.65, 0.98, 0.6])];
  for (const x of [-0.5, -0.17, 0.17, 0.5]) out.push(...place(hexPad([0, 0, 0], 0.15), { pitch: -20, at: [x, 0.9, 0.62] }), line([x, 0.98, 0.6], [x, 0.92, 0.6]));
  out.push(...place(hexPad([0, 0, 0], 0.16), { pitch: -10, at: [0, 0.72, 0.4] }), ...stand([0, 0, 0.4], [0, 0.7, 0.4], 0.25));
  out.push(...box([0.35, 1.12, 0.62], [0.3, 0.1, 0.18]));
  out.push(...stick([-0.15, 1.1, 0.2], [-0.2, 0.95, 0.58]), ...stick([0.15, 1.1, 0.2], [0.2, 0.95, 0.58]));
  return out;
}
export const SYNTH_DRUM: InstrumentSpatialModel = spatialModel("synth-drum", synthDrum());

export const REVERSE_CYMBAL: InstrumentSpatialModel = spatialModel(
  "reverse-cymbal",
  merge(cymbal([0.1, 1.2, 0.5], 0.229), stand([0.1, 0, 0.5], [0.1, 1.2, 0.5], 0.3), mallet([0.3, 1.25, 0.2], [0.18, 1.24, 0.45], 0.02), [rect([0.1, 1.23, 0.5], 0.03, 0.03, "xz")]),
);
