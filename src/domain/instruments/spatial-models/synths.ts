/**
 * Synthesizer keyboards — what a synth patch is actually played on. Five
 * physically different instruments cover every synth program:
 *
 * - `SYNTH_MONO`: a 44-key monosynth (Minimoog-sized, 0.61 m keys) with a
 *   tilted control panel and pitch/mod wheels — synth basses (38–39) and the
 *   leads (80–87).
 * - `SYNTH_POLY`: a 61-key polysynth (0.85 m) with a flat panel of sliders
 *   — synth brass (62–63), synth strings (50–51), synth voice (54).
 * - `SYNTH_WORKSTATION`: 76 keys (1.06 m) with a screen — the pads (88–95).
 * - `SYNTH_MODULAR`: a 49-key controller under a rack of modules with patch
 *   cables — the effects (96–103).
 * - `SYNTH_SAMPLER`: 61 keys with a 4×4 pad grid — orchestra hit (55).
 *
 * All on an X-stand at 0.9 m, the player standing behind (−z) them.
 */
import type { Vec3 } from "../spatial-art";
import { spatialModel, type InstrumentSpatialModel } from "../spatial-art";
import { keyboard, knobRow, xStand, type KeyLetter } from "../spatial-parts";
import { box, line, merge, rect, ring, smoothOpen, type Strokes } from "../spatial-geometry";

const KEY_Y = 0.9;
const KEY_Z = 0.3;

function synthBase(whiteKeys: number, start: KeyLetter, caseDepth: number): Strokes {
  const width = whiteKeys * 0.0235 + 0.12;
  return merge(
    box([0, KEY_Y - 0.04, KEY_Z + caseDepth / 2], [width, 0.08, caseDepth]),
    keyboard(whiteKeys, start, [0, KEY_Y, KEY_Z + 0.02], 0.14),
    xStand([0, 0, KEY_Z + caseDepth / 2], width * 0.7, KEY_Y - 0.09, caseDepth * 0.8),
  );
}

/** Two control wheels (pitch, mod) standing on edge at the left of the keys. */
function wheels(x: number): Strokes {
  return [ring([x, KEY_Y + 0.02, KEY_Z + 0.06], 0.03, "x", 10), ring([x + 0.05, KEY_Y + 0.02, KEY_Z + 0.06], 0.03, "x", 10)];
}

/** A tilted control panel behind the keys, its bottom edge at `zFront`. */
function tiltedPanel(width: number, zFront: number, depth: number, rise: number, knobs: readonly number[]): Strokes {
  const out: Strokes = [
    [
      [-width / 2, KEY_Y, zFront],
      [width / 2, KEY_Y, zFront],
      [width / 2, KEY_Y + rise, zFront + depth],
      [-width / 2, KEY_Y + rise, zFront + depth],
      [-width / 2, KEY_Y, zFront],
    ],
  ];
  knobs.forEach((count, row) => {
    const t = (row + 1) / (knobs.length + 1);
    const y = KEY_Y + rise * t;
    const z = zFront + depth * t;
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * (width / (count + 1));
      // A knob face tilted with the panel: drawn as a ring in the panel's own plane.
      const r = 0.012;
      const pts: Vec3[] = [];
      for (let k = 0; k <= 8; k++) {
        const a = (Math.PI * 2 * k) / 8;
        const dz = Math.sin(a) * r * (depth / Math.hypot(depth, rise));
        const dy = Math.sin(a) * r * (rise / Math.hypot(depth, rise));
        pts.push([x + Math.cos(a) * r, y + dy, z + dz]);
      }
      out.push(pts);
    }
  });
  return out;
}

export const SYNTH_MONO: InstrumentSpatialModel = spatialModel(
  "synth-mono",
  merge(synthBase(26, "F", 0.42), wheels(-0.36), tiltedPanel(0.66, KEY_Z + 0.17, 0.2, 0.16, [7, 7, 5])),
);

export const SYNTH_POLY: InstrumentSpatialModel = spatialModel(
  "synth-poly",
  merge(
    synthBase(36, "C", 0.4),
    wheels(-0.48),
    // Flat panel: a row of knobs and a bank of nine sliders.
    knobRow([0.1, KEY_Y + 0.001, KEY_Z + 0.28], 8, 0.06),
    ...[[-0.35, 9]].map(([x0, n]) => {
      const out: Strokes = [];
      for (let i = 0; i < n; i++) out.push(line([x0 + i * 0.03, KEY_Y + 0.001, KEY_Z + 0.2], [x0 + i * 0.03, KEY_Y + 0.001, KEY_Z + 0.36]));
      return out;
    }),
  ),
);

export const SYNTH_WORKSTATION: InstrumentSpatialModel = spatialModel(
  "synth-workstation",
  merge(
    synthBase(45, "E", 0.42),
    wheels(-0.58),
    [rect([0, KEY_Y + 0.001, KEY_Z + 0.3], 0.16, 0.09, "xz")],
    knobRow([0.35, KEY_Y + 0.001, KEY_Z + 0.3], 6, 0.05),
    knobRow([-0.3, KEY_Y + 0.001, KEY_Z + 0.3], 4, 0.05),
  ),
);

function modularRack(): Strokes {
  const rackY = 1.2;
  const out = box([0, rackY, KEY_Z + 0.35], [1.0, 0.36, 0.14]);
  // Module divisions and a grid of knobs and jacks on the front face.
  for (let i = 1; i < 8; i++) out.push(line([-0.5 + i * 0.125, rackY - 0.18, KEY_Z + 0.28], [-0.5 + i * 0.125, rackY + 0.18, KEY_Z + 0.28]));
  for (let row = 0; row < 3; row++) out.push(...knobRow([0, rackY + 0.1 - row * 0.1, KEY_Z + 0.279], 16, 0.06, 0.009, "z"));
  // Patch cables hanging between jacks.
  const cables: readonly [number, number][][] = [
    [[-0.44, rackY + 0.1], [-0.3, rackY - 0.25], [0.06, rackY]],
    [[0.12, rackY + 0.1], [0.28, rackY - 0.28], [0.44, rackY - 0.1]],
    [[-0.2, rackY], [0.0, rackY - 0.3], [0.32, rackY + 0.1]],
  ];
  for (const c of cables) out.push(smoothOpen(c, 6).map(([x, y]): Vec3 => [x, y, KEY_Z + 0.27]));
  // Posts holding the rack above the keyboard.
  out.push(line([-0.5, KEY_Y, KEY_Z + 0.4], [-0.5, rackY - 0.18, KEY_Z + 0.4]), line([0.5, KEY_Y, KEY_Z + 0.4], [0.5, rackY - 0.18, KEY_Z + 0.4]));
  return out;
}
export const SYNTH_MODULAR: InstrumentSpatialModel = spatialModel("synth-modular", merge(synthBase(29, "C", 0.42), wheels(-0.4), modularRack()));

function padGrid(center: Vec3): Strokes {
  const out: Strokes = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) out.push(rect([center[0] + (c - 1.5) * 0.045, center[1], center[2] + (r - 1.5) * 0.045], 0.038, 0.038, "xz"));
  return out;
}
export const SYNTH_SAMPLER: InstrumentSpatialModel = spatialModel(
  "synth-sampler",
  merge(synthBase(36, "C", 0.44), wheels(-0.48), padGrid([0.3, KEY_Y + 0.001, KEY_Z + 0.3]), [rect([-0.15, KEY_Y + 0.001, KEY_Z + 0.3], 0.14, 0.08, "xz")], knobRow([-0.36, KEY_Y + 0.001, KEY_Z + 0.34], 4, 0.04)),
);
