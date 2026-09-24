/**
 * The eight General MIDI drum kits, each a different physical setup:
 *
 * - Standard: 22" kick, 14" snare, 12"/13" rack toms, 16" floor tom, 14"
 *   hi-hat, 16" crash, 20" ride.
 * - Room: the same with a 24" kick and a second crash.
 * - Power: 24" kick, deep 13"/14"/16"/18" toms, two crashes and a china.
 * - Electronic: hexagonal pads on a rack, a kick pad, a hi-hat pad.
 * - TR-808: the drum machine itself (508 × 305 × 105 mm) on a table.
 * - Jazz: 18" kick, one 12" rack tom, 14" floor tom, 20" ride, 18" crash.
 * - Brush: the jazz kit with wire brushes.
 * - Orchestra: a 36" concert bass drum, concert snare, suspended cymbal,
 *   tam-tam.
 *
 * The drummer sits at the origin facing +z; the kick's heads face ±z.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { box, line, merge, place, rect, ring, rotateX, type Strokes } from "../spatial-geometry";
import { brush, cymbal, drum, hexPad, mallet, stand, stick, throne } from "../spatial-parts";

interface KitSpec {
  readonly kick: number;
  readonly snare?: boolean;
  readonly rackToms: readonly number[];
  readonly floorToms: readonly number[];
  readonly hihat?: boolean;
  readonly crashes: readonly number[];
  readonly ride?: number;
  readonly china?: number;
  readonly deepToms?: boolean;
  readonly brushes?: boolean;
}

const INCH = 0.0254;

function kick(diameterIn: number): Strokes {
  const r = (diameterIn * INCH) / 2;
  const depth = 0.4;
  const shell = rotateX(drum([0, 0, 0], r, depth, { lugs: 8 }), 90);
  const out = merge(place(shell, { at: [0.05, r + 0.02, 0.62] }), [line([-0.2, r + 0.02, 0.5], [-0.32, 0, 0.55]), line([0.3, r + 0.02, 0.5], [0.42, 0, 0.55])]);
  out.push(rect([0.05, 0.02, 0.36], 0.09, 0.2, "xz"), line([0.05, 0.02, 0.42], [0.05, r + 0.02, 0.44]));
  return out;
}

function snare(): Strokes {
  return merge(place(drum([0, 0, 0], 7 * INCH, 0.14), { pitch: -6, at: [-0.12, 0.66, 0.38] }), stand([-0.12, 0, 0.38], [-0.12, 0.58, 0.38], 0.24));
}

function rackTom(diameterIn: number, at: Vec3, deep: boolean): Strokes {
  const r = (diameterIn * INCH) / 2;
  return merge(place(drum([0, 0, 0], r, deep ? 0.32 : 0.24), { pitch: -22, at }), [line(at, [at[0], at[1] - 0.16, at[2] + 0.1])]);
}

function floorTom(diameterIn: number, at: Vec3, deep: boolean): Strokes {
  const r = (diameterIn * INCH) / 2;
  const depth = deep ? 0.42 : 0.36;
  const out = place(drum([0, 0, 0], r, depth), { at });
  for (let i = 0; i < 3; i++) {
    const t = (Math.PI * 2 * i) / 3 + 0.5;
    out.push(line([at[0] + Math.cos(t) * (r + 0.015), at[1] - 0.1, at[2] + Math.sin(t) * (r + 0.015)], [at[0] + Math.cos(t) * (r + 0.05), 0, at[2] + Math.sin(t) * (r + 0.05)]));
  }
  return out;
}

function hihat(): Strokes {
  const at: Vec3 = [-0.48, 0.88, 0.42];
  return merge(cymbal(at, 7 * INCH, 20), cymbal([at[0], at[1] - 0.03, at[2]], 7 * INCH, 20), stand([at[0], 0, at[2]], [at[0], at[1] + 0.06, at[2]], 0.25), [rect([at[0], 0.02, at[2] - 0.15], 0.08, 0.22, "xz")]);
}

function cymbalOnBoom(diameterIn: number, at: Vec3, tilt: number, base: Vec3): Strokes {
  const r = (diameterIn * INCH) / 2;
  return merge(place(cymbal([0, 0, 0], r), { pitch: tilt, at }), stand(base, [base[0], at[1] - 0.25, base[2]], 0.3), [line([base[0], at[1] - 0.25, base[2]], at)]);
}

function acousticKit(spec: KitSpec): Strokes {
  const out = merge(kick(spec.kick), throne([0, 0, -0.08]));
  if (spec.snare !== false) out.push(...snare());
  if (spec.hihat !== false) out.push(...hihat());
  const rackX = spec.rackToms.length === 1 ? [-0.05] : [-0.14, 0.24];
  spec.rackToms.forEach((d, i) => out.push(...rackTom(d, [rackX[i], 0.95, 0.72], spec.deepToms ?? false)));
  spec.floorToms.forEach((d, i) => out.push(...floorTom(d, [0.55 + i * 0.42, 0.5, 0.3 - i * 0.2], spec.deepToms ?? false)));
  spec.crashes.forEach((d, i) => out.push(...cymbalOnBoom(d, i === 0 ? [-0.45, 1.38, 0.82] : [0.15, 1.45, 1.0], i === 0 ? 15 : 12, i === 0 ? [-0.7, 0, 0.75] : [0.0, 0, 1.1])));
  if (spec.ride) out.push(...cymbalOnBoom(spec.ride, [0.62, 1.18, 0.7], 10, [0.85, 0, 0.8]));
  if (spec.china) out.push(...cymbalOnBoom(spec.china, [0.75, 1.5, 0.95], -20, [0.95, 0, 1.05]));
  if (spec.brushes) out.push(...brush([-0.2, 0.95, 0.15], [-0.14, 0.75, 0.38]), ...brush([0.2, 0.95, 0.15], [-0.05, 0.75, 0.42]));
  else out.push(...stick([-0.2, 0.95, 0.15], [-0.4, 0.92, 0.4]), ...stick([0.2, 0.95, 0.15], [-0.08, 0.76, 0.4]));
  return out;
}

export const STANDARD_KIT: InstrumentSpatialModel = spatialModel("standard-kit", acousticKit({ kick: 22, rackToms: [12, 13], floorToms: [16], crashes: [16], ride: 20 }));
export const ROOM_KIT: InstrumentSpatialModel = spatialModel("room-kit", acousticKit({ kick: 24, rackToms: [12, 13], floorToms: [16], crashes: [16, 18], ride: 20 }));
export const POWER_KIT: InstrumentSpatialModel = spatialModel("power-kit", acousticKit({ kick: 24, rackToms: [13, 14], floorToms: [16, 18], crashes: [17, 19], ride: 22, china: 18, deepToms: true }));
export const JAZZ_KIT: InstrumentSpatialModel = spatialModel("jazz-kit", acousticKit({ kick: 18, rackToms: [12], floorToms: [14], crashes: [18], ride: 20 }));
export const BRUSH_KIT: InstrumentSpatialModel = spatialModel("brush-kit", acousticKit({ kick: 18, rackToms: [12], floorToms: [14], crashes: [18], ride: 20, brushes: true }));

function electronicKit(): Strokes {
  const out: Strokes = [line([-0.7, 1.0, 0.7], [0.7, 1.0, 0.7]), line([-0.7, 0.6, 0.7], [0.7, 0.6, 0.7]), ...stand([-0.65, 0, 0.7], [-0.65, 1.0, 0.7]), ...stand([0.65, 0, 0.7], [0.65, 1.0, 0.7]), ...throne([0, 0, -0.08])];
  for (const [x, y, z] of [
    [-0.42, 0.92, 0.72],
    [0.0, 0.95, 0.78],
    [0.42, 0.92, 0.72],
  ])
    out.push(...place(hexPad([0, 0, 0], 0.14), { pitch: -25, at: [x, y, z] }), line([x, 1.0, 0.7], [x, y, z]));
  out.push(...place(hexPad([0, 0, 0], 0.15), { pitch: -8, at: [-0.15, 0.68, 0.4] }), ...stand([-0.15, 0, 0.4], [-0.15, 0.65, 0.4], 0.22));
  out.push(...place(hexPad([0, 0, 0], 0.16), { at: [0.5, 0.55, 0.35] }), ...stand([0.5, 0, 0.35], [0.5, 0.52, 0.35], 0.22));
  out.push(...place(hexPad([0, 0, 0], 0.12), { pitch: 90, at: [0.08, 0.2, 0.62] }), rect([0.08, 0.02, 0.36], 0.09, 0.2, "xz"));
  out.push(...place(cymbal([0, 0, 0], 0.15), { pitch: 15, at: [-0.5, 1.3, 0.85] }), ...stand([-0.6, 0, 0.8], [-0.5, 1.28, 0.85], 0.25));
  out.push(...place(cymbal([0, 0, 0], 0.15), { pitch: 10, at: [0.62, 1.2, 0.72] }), ...stand([0.72, 0, 0.75], [0.62, 1.18, 0.72], 0.25));
  out.push(...cymbal([-0.5, 0.88, 0.42], 0.13, 16), ...stand([-0.5, 0, 0.42], [-0.5, 0.9, 0.42], 0.22));
  out.push(...box([0.35, 1.12, 0.72], [0.28, 0.1, 0.16]));
  out.push(...stick([-0.2, 0.95, 0.15], [-0.35, 0.92, 0.42]), ...stick([0.2, 0.95, 0.15], [-0.1, 0.78, 0.42]));
  return out;
}
export const ELECTRONIC_KIT: InstrumentSpatialModel = spatialModel("electronic-kit", electronicKit());

function tr808(): Strokes {
  const tableY = 0.8;
  const out = merge(box([0, tableY - 0.015, 0.5], [0.8, 0.03, 0.5]), box([0, tableY + 0.0525, 0.45], [0.508, 0.105, 0.305]));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push(line([sx * 0.37, 0, 0.5 + sz * 0.22], [sx * 0.37, tableY - 0.03, 0.5 + sz * 0.22]));
  const top = tableY + 0.105;
  for (let i = 0; i < 16; i++) out.push(rect([-0.22 + i * 0.0293, top + 0.001, 0.33], 0.02, 0.03, "xz"));
  for (let i = 0; i < 12; i++) out.push(ring([-0.2 + i * 0.036, top + 0.001, 0.44], 0.011, "y", 8), ring([-0.2 + i * 0.036, top + 0.001, 0.5], 0.011, "y", 8));
  out.push(ring([0.2, top + 0.001, 0.56], 0.028, "y", 12), rect([-0.2, top + 0.001, 0.56], 0.06, 0.03, "xz"));
  return out;
}
export const TR808_KIT: InstrumentSpatialModel = spatialModel("tr-808", tr808());

function orchestraKit(): Strokes {
  const bd = rotateX(drum([0, 0, 0], 18 * INCH, 0.45, { lugs: 10 }), 90);
  const out = merge(
    place(bd, { yaw: 90, at: [-0.75, 0.85, 0.6] }),
    [line([-0.75, 0.85, 0.6], [-1.1, 0, 0.45]), line([-0.75, 0.85, 0.6], [-1.1, 0, 0.75]), line([-0.75, 0.85, 0.6], [-0.4, 0, 0.45]), line([-0.75, 0.85, 0.6], [-0.4, 0, 0.75])],
    place(drum([0, 0, 0], 7 * INCH, 0.16), { at: [0.25, 0.9, 0.5] }),
    stand([0.25, 0, 0.5], [0.25, 0.82, 0.5], 0.25),
    cymbal([0.75, 1.4, 0.55], 9 * INCH),
    stand([0.75, 0, 0.55], [0.75, 1.4, 0.55], 0.3),
    [ring([0.4, 1.35, 1.1], 0.38, "z", 28), ring([0.4, 1.35, 1.1], 0.14, "z", 14), line([-0.1, 0, 1.1], [-0.1, 1.9, 1.1]), line([0.9, 0, 1.1], [0.9, 1.9, 1.1]), line([-0.1, 1.9, 1.1], [0.9, 1.9, 1.1]), line([0.4, 1.9, 1.1], [0.4, 1.73, 1.1])],
    mallet([-0.35, 1.2, 0.25], [-0.55, 0.95, 0.5], 0.035),
    stick([0.15, 1.1, 0.2], [0.22, 0.98, 0.45]),
  );
  return out;
}
export const ORCHESTRA_KIT: InstrumentSpatialModel = spatialModel("orchestra-kit", orchestraKit());
