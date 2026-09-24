/**
 * Sub-assemblies the instrument models share: a keyboard, a drum, a
 * cymbal on its stand, a bow, a singer. Each is built from
 * `spatial-geometry.ts` in the same meter-based, player-at-origin frame,
 * and returns plain strokes to be `merge`d and `place`d by a model.
 */
import type { Vec3 } from "./spatial-art";
import {
  box,
  ellipse,
  line,
  merge,
  place,
  rect,
  ring,
  tube,
  type Strokes,
} from "./spatial-geometry";

// ---------------------------------------------------------------------------
// Keyboards
// ---------------------------------------------------------------------------

export type KeyLetter = "C" | "D" | "E" | "F" | "G" | "A" | "B";
const LETTERS: readonly KeyLetter[] = ["C", "D", "E", "F", "G", "A", "B"];
const HAS_SHARP: Record<KeyLetter, boolean> = { C: true, D: true, E: false, F: true, G: true, A: true, B: false };

/** Standard piano key geometry: 23.5 mm white keys, black keys 13.5 mm wide over the back 60%. */
export const WHITE_KEY_WIDTH = 0.0235;
const BLACK_KEY_WIDTH = 0.0135;

/**
 * A keyboard of `whiteKeys` white keys starting on `start`, its front edge
 * along `front` (the key fronts face the player, at −z of the keys), its
 * top surface at `front[1]`, centered on `front[0]`.
 */
export function keyboard(whiteKeys: number, start: KeyLetter, front: Vec3, depth = 0.15): Strokes {
  const width = whiteKeys * WHITE_KEY_WIDTH;
  const [cx, y, z0] = front;
  const x0 = cx - width / 2;
  const out: Strokes = [rect([cx, y, z0 + depth / 2], width, depth, "xz")];
  let letter = LETTERS.indexOf(start);
  for (let i = 0; i < whiteKeys; i++) {
    const x = x0 + i * WHITE_KEY_WIDTH;
    if (i > 0) out.push(line([x, y, z0], [x, y, z0 + depth]));
    if (HAS_SHARP[LETTERS[letter]] && i < whiteKeys - 1) {
      const bx = x + WHITE_KEY_WIDTH;
      const zBack = z0 + depth;
      const zFront = z0 + depth * 0.42;
      out.push(rect([bx, y + 0.012, (zBack + zFront) / 2], BLACK_KEY_WIDTH, zBack - zFront, "xz"));
      out.push(line([bx - BLACK_KEY_WIDTH / 2, y, zFront], [bx - BLACK_KEY_WIDTH / 2, y + 0.012, zFront]));
      out.push(line([bx + BLACK_KEY_WIDTH / 2, y, zFront], [bx + BLACK_KEY_WIDTH / 2, y + 0.012, zFront]));
    }
    letter = (letter + 1) % 7;
  }
  return out;
}

/** A row of `count` knobs (small rings) along x, centered on `center`, facing +y or the given axis. */
export function knobRow(center: Vec3, count: number, spacing: number, radius = 0.012, axis: "y" | "z" = "y"): Strokes {
  const out: Strokes = [];
  for (let i = 0; i < count; i++) {
    const x = center[0] + (i - (count - 1) / 2) * spacing;
    out.push(ring([x, center[1], center[2]], radius, axis, 8));
  }
  return out;
}

/** A folding X-stand under a keyboard: two crossed leg pairs, `width` apart. */
export function xStand(center: Vec3, width: number, height: number, depth = 0.45): Strokes {
  const [cx, y, cz] = center;
  const out: Strokes = [];
  for (const side of [-1, 1]) {
    const x = cx + (side * width) / 2;
    out.push(line([x, y, cz - depth / 2], [x, y + height, cz + depth / 2]));
    out.push(line([x, y, cz + depth / 2], [x, y + height, cz - depth / 2]));
  }
  out.push(line([cx - width / 2, y + height, cz - depth / 2], [cx + width / 2, y + height, cz - depth / 2]));
  out.push(line([cx - width / 2, y + height, cz + depth / 2], [cx + width / 2, y + height, cz + depth / 2]));
  return out;
}

/** A piano/organ bench: a slab on four legs, `height` to the seat. */
export function bench(center: Vec3, width = 0.9, depth = 0.35, height = 0.48): Strokes {
  const [cx, , cz] = center;
  const out = box([cx, height - 0.02, cz], [width, 0.04, depth]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      out.push(line([cx + (sx * (width - 0.06)) / 2, 0, cz + (sz * (depth - 0.06)) / 2], [cx + (sx * (width - 0.06)) / 2, height - 0.04, cz + (sz * (depth - 0.06)) / 2]));
  return out;
}

/** `count` pedals at floor level, `spacing` apart, centered on `center`. */
export function pedals(center: Vec3, count: number, spacing = 0.06, length = 0.1): Strokes {
  const out: Strokes = [];
  for (let i = 0; i < count; i++) {
    const x = center[0] + (i - (count - 1) / 2) * spacing;
    out.push(rect([x, center[1], center[2] + length / 2], 0.02, length, "xz"));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Drums and cymbals
// ---------------------------------------------------------------------------

/**
 * A drum shell with its axis along y, heads at ±depth/2: two heads, a hoop
 * on each, and `lugs` tension rods around the shell.
 */
export function drum(center: Vec3, radius: number, depth: number, opts: { readonly lugs?: number; readonly segments?: number } = {}): Strokes {
  const segments = opts.segments ?? (radius > 0.2 ? 28 : 20);
  const lugs = opts.lugs ?? 6;
  const [cx, cy, cz] = center;
  const top = cy + depth / 2;
  const bottom = cy - depth / 2;
  const out: Strokes = [
    ring([cx, top, cz], radius, "y", segments),
    ring([cx, top - 0.012, cz], radius + 0.012, "y", segments),
    ring([cx, bottom, cz], radius, "y", segments),
    ring([cx, bottom + 0.012, cz], radius + 0.012, "y", segments),
  ];
  for (let i = 0; i < lugs; i++) {
    const t = (Math.PI * 2 * i) / lugs + Math.PI / lugs;
    const x = cx + Math.cos(t) * (radius + 0.012);
    const z = cz + Math.sin(t) * (radius + 0.012);
    out.push(line([x, top - 0.012, z], [x, bottom + 0.012, z]));
  }
  return out;
}

/** A cymbal lying in the y plane at `center`: rim, bell, and radial lines that read as its cone. */
export function cymbal(center: Vec3, radius: number, segments = 24): Strokes {
  const [cx, cy, cz] = center;
  const out: Strokes = [ring(center, radius, "y", segments), ring([cx, cy + 0.025, cz], radius * 0.3, "y", 12)];
  for (let i = 0; i < 6; i++) {
    const t = (Math.PI * 2 * i) / 6;
    out.push(line([cx + Math.cos(t) * radius * 0.3, cy + 0.025, cz + Math.sin(t) * radius * 0.3], [cx + Math.cos(t) * radius, cy, cz + Math.sin(t) * radius]));
  }
  return out;
}

/** A tripod stand from the floor at `base` up to `top`: a post and three splayed legs. */
export function stand(base: Vec3, top: Vec3, legSpread = 0.3): Strokes {
  const [bx, , bz] = base;
  const hub: Vec3 = [bx, 0.28, bz];
  const out: Strokes = [line(hub, top)];
  for (let i = 0; i < 3; i++) {
    const t = (Math.PI * 2 * i) / 3 + Math.PI / 2;
    out.push(line(hub, [bx + Math.cos(t) * legSpread, 0, bz + Math.sin(t) * legSpread]));
  }
  return out;
}

/** A drummer's throne: round seat on a tripod. */
export function throne(center: Vec3): Strokes {
  return merge([ring([center[0], 0.5, center[2]], 0.17, "y", 16)], stand(center, [center[0], 0.48, center[2]], 0.25));
}

/** A drumstick from `from` to `to`, with its tip. */
export function stick(from: Vec3, to: Vec3): Strokes {
  return [line(from, to), ring(to, 0.006, "y", 6)];
}

/** A mallet: a shaft with a ball head of `headRadius` at `to`. */
export function mallet(from: Vec3, to: Vec3, headRadius = 0.018): Strokes {
  return [line(from, to), ring(to, headRadius, "y", 10), ring(to, headRadius, "z", 10)];
}

/** A wire brush: a handle and a fan of wires spreading toward `to`. */
export function brush(from: Vec3, to: Vec3): Strokes {
  const out: Strokes = [line(from, [from[0] + (to[0] - from[0]) * 0.45, from[1] + (to[1] - from[1]) * 0.45, from[2] + (to[2] - from[2]) * 0.45])];
  const mid: Vec3 = [from[0] + (to[0] - from[0]) * 0.45, from[1] + (to[1] - from[1]) * 0.45, from[2] + (to[2] - from[2]) * 0.45];
  for (let i = -3; i <= 3; i++) out.push(line(mid, [to[0] + i * 0.02, to[1], to[2] + i * 0.01]));
  return out;
}

// ---------------------------------------------------------------------------
// Bowed strings
// ---------------------------------------------------------------------------

/**
 * A bow lying along the line from `frog` to `tip`: the stick, the hair
 * offset `hairDrop` beneath it, the frog and the tip. Built in whatever
 * frame the instrument is authored in, so it turns with the instrument.
 */
export function bow(frog: Vec3, tip: Vec3, hairDrop = 0.012): Strokes {
  const hair = (p: Vec3): Vec3 => [p[0], p[1] - hairDrop, p[2]];
  const frogBox = box([frog[0], frog[1] - hairDrop / 2, frog[2]], [0.04, hairDrop + 0.008, 0.012]);
  return [line(frog, tip), line(hair(frog), hair(tip)), line(tip, hair(tip)), ...frogBox];
}

// ---------------------------------------------------------------------------
// A person, for the sung programs
// ---------------------------------------------------------------------------

/**
 * A standing figure of `height` at `at` (feet on the floor), facing +z:
 * two crossed head rings, shoulders, a tapered torso, arms to `hands`
 * (default: at the sides) and legs. Abstract on purpose — enough to read as
 * a singer, not a portrait.
 */
export function figure(
  at: Vec3,
  opts: { readonly height?: number; readonly yaw?: number; readonly hands?: readonly [Vec3, Vec3] } = {},
): Strokes {
  const h = opts.height ?? 1.7;
  const headR = 0.105;
  const headY = h - headR;
  const shoulderY = h - 0.3;
  const hipY = h * 0.5;
  const hands = opts.hands ?? ([[-0.28, hipY + 0.02, 0.06], [0.28, hipY + 0.02, 0.06]] as const);
  const shoulders: readonly [Vec3, Vec3] = [
    [-0.21, shoulderY, 0],
    [0.21, shoulderY, 0],
  ];
  const elbow = (s: Vec3, hnd: Vec3): Vec3 => [s[0] + (hnd[0] - s[0]) * 0.5 + Math.sign(s[0]) * 0.03, s[1] + (hnd[1] - s[1]) * 0.5, s[2] + (hnd[2] - s[2]) * 0.5 - 0.04];
  const out: Strokes = [
    ring([0, headY, 0], headR, "z", 16),
    ring([0, headY, 0], headR, "x", 16),
    ellipse([0, headY, 0], headR, headR * 0.98, "y", 16),
    line([0, headY - headR, 0], [0, shoulderY, 0]),
    line(shoulders[0], shoulders[1]),
    [shoulders[0], [-0.16, hipY, 0], [0.16, hipY, 0], shoulders[1]],
    [shoulders[0], elbow(shoulders[0], hands[0]), hands[0]],
    [shoulders[1], elbow(shoulders[1], hands[1]), hands[1]],
    [
      [-0.16, hipY, 0],
      [-0.1, hipY * 0.5, 0.02],
      [-0.1, 0, 0.05],
    ],
    [
      [0.16, hipY, 0],
      [0.1, hipY * 0.5, 0.02],
      [0.1, 0, 0.05],
    ],
    line([-0.1, 0, 0.05], [-0.1, 0, 0.25]),
    line([0.1, 0, 0.05], [0.1, 0, 0.25]),
  ];
  return place(out, { at, yaw: opts.yaw });
}

/** A microphone on a straight stand, its head at `top`. */
export function micStand(base: Vec3, top: Vec3): Strokes {
  return merge(stand(base, [top[0], top[1] - 0.08, top[2]], 0.22), tube([top[0], top[1] - 0.08, top[2]], top, 0.022, { segments: 8, meridians: 3 }));
}

/** A hexagonal electronic drum pad of `radius` in the y plane. */
export function hexPad(center: Vec3, radius: number): Strokes {
  return [ring(center, radius, "y", 6), ring(center, radius * 0.55, "y", 6)];
}
