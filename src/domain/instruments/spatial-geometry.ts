/**
 * Parametric wireframe builders for the instrument spatial models.
 *
 * Every model in `spatial-models/` is *computed* from real dimensions with
 * these rather than typed out as coordinates: a violin's outline is a spline
 * through nine measured points, a bell is a surface of revolution over a
 * six-point profile, a drum is two rings and its lugs. That is what lets 136
 * instruments each be authored in a few dozen lines while still coming out
 * with hundreds of correctly placed segments — the alternative, hand-typing
 * every vertex, is how the first draft ended up with a violin made of four
 * lines that could have been anything.
 *
 * Pure arithmetic over `Vec3` tuples — no `three` here, no renderer. The
 * output is the same `SpatialStroke[]` the rest of `music_types` deals in.
 *
 * ## Frame
 *
 * Meters. The player stands (or sits) at the origin, on the floor (y = 0):
 * **+x is the player's right, +y is up, +z is forward, toward the audience.**
 * `buildScene` in music_spatial_core yaws every instrument to face the
 * listener, so a model authored this way faces the person walking the stage.
 *
 * ## Rotation conventions (`place`)
 *
 * - `pitch` (about x): positive tips the forward end (+z) *down*.
 * - `yaw` (about y): positive turns the forward end toward the player's right.
 * - `roll` (about z): positive lifts the player's-right side (+x) up.
 *
 * Applied in the order scale → roll → pitch → yaw → translate, so an
 * instrument authored lying on its canonical axes can be tilted, turned and
 * carried to its held position in one call.
 */
import type { SpatialStroke, Vec3 } from "./spatial-art";

export type Strokes = SpatialStroke[];
export type P2 = readonly [number, number];
export type Axis = "x" | "y" | "z";
export type Plane = "xy" | "xz" | "yz";

export function v3(x: number, y: number, z: number): Vec3 {
  return [x, y, z];
}

export function rad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function merge(...groups: readonly (readonly SpatialStroke[])[]): Strokes {
  const out: Strokes = [];
  for (const group of groups) for (const stroke of group) out.push(stroke);
  return out;
}

function mapPoints(strokes: readonly SpatialStroke[], f: (p: Vec3) => Vec3): Strokes {
  return strokes.map((stroke) => stroke.map(f));
}

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

export function translate(strokes: readonly SpatialStroke[], [dx, dy, dz]: Vec3): Strokes {
  return mapPoints(strokes, ([x, y, z]) => [x + dx, y + dy, z + dz]);
}

export function scale(strokes: readonly SpatialStroke[], s: number | Vec3): Strokes {
  const [sx, sy, sz] = typeof s === "number" ? [s, s, s] : s;
  return mapPoints(strokes, ([x, y, z]) => [x * sx, y * sy, z * sz]);
}

export function rotateX(strokes: readonly SpatialStroke[], degrees: number): Strokes {
  const c = Math.cos(rad(degrees));
  const s = Math.sin(rad(degrees));
  return mapPoints(strokes, ([x, y, z]) => [x, y * c - z * s, y * s + z * c]);
}

export function rotateY(strokes: readonly SpatialStroke[], degrees: number): Strokes {
  const c = Math.cos(rad(degrees));
  const s = Math.sin(rad(degrees));
  return mapPoints(strokes, ([x, y, z]) => [x * c + z * s, y, -x * s + z * c]);
}

export function rotateZ(strokes: readonly SpatialStroke[], degrees: number): Strokes {
  const c = Math.cos(rad(degrees));
  const s = Math.sin(rad(degrees));
  return mapPoints(strokes, ([x, y, z]) => [x * c - y * s, x * s + y * c, z]);
}

export function mirrorX(strokes: readonly SpatialStroke[]): Strokes {
  return mapPoints(strokes, ([x, y, z]) => [-x, y, z]);
}

export interface Placement {
  readonly at?: Vec3;
  readonly yaw?: number;
  readonly pitch?: number;
  readonly roll?: number;
  readonly scale?: number | Vec3;
}

/** Scale, roll, pitch, yaw, then translate — see the module doc for signs. */
export function place(strokes: readonly SpatialStroke[], placement: Placement): Strokes {
  let out: Strokes = strokes as Strokes;
  if (placement.scale !== undefined) out = scale(out, placement.scale);
  if (placement.roll) out = rotateZ(out, placement.roll);
  if (placement.pitch) out = rotateX(out, placement.pitch);
  if (placement.yaw) out = rotateY(out, placement.yaw);
  if (placement.at) out = translate(out, placement.at);
  return out;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export function line(a: Vec3, b: Vec3): SpatialStroke {
  return [a, b];
}

/** A rectangle outline. `width` runs along the plane's first axis, `height` along its second. */
export function rect(center: Vec3, width: number, height: number, plane: Plane): SpatialStroke {
  const [cx, cy, cz] = center;
  const w = width / 2;
  const h = height / 2;
  switch (plane) {
    case "xy":
      return [
        [cx - w, cy - h, cz],
        [cx + w, cy - h, cz],
        [cx + w, cy + h, cz],
        [cx - w, cy + h, cz],
        [cx - w, cy - h, cz],
      ];
    case "xz":
      return [
        [cx - w, cy, cz - h],
        [cx + w, cy, cz - h],
        [cx + w, cy, cz + h],
        [cx - w, cy, cz + h],
        [cx - w, cy, cz - h],
      ];
    default:
      return [
        [cx, cy - h, cz - w],
        [cx, cy - h, cz + w],
        [cx, cy + h, cz + w],
        [cx, cy + h, cz - w],
        [cx, cy - h, cz - w],
      ];
  }
}

/**
 * A circle (or arc, in degrees) of `radius` around `center`, lying in the
 * plane perpendicular to `axis`. Closed when it is a full circle.
 */
export function ring(
  center: Vec3,
  radius: number,
  axis: Axis,
  segments = 24,
  arc?: { readonly from: number; readonly to: number },
): SpatialStroke {
  return ellipse(center, radius, radius, axis, segments, arc);
}

/** `ring` with two radii: `r1` along the plane's first in-plane axis (x, or y for an x-axis ring), `r2` along the second. */
export function ellipse(
  center: Vec3,
  r1: number,
  r2: number,
  axis: Axis,
  segments = 24,
  arc?: { readonly from: number; readonly to: number },
): SpatialStroke {
  const [cx, cy, cz] = center;
  const from = arc ? rad(arc.from) : 0;
  const to = arc ? rad(arc.to) : Math.PI * 2;
  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = from + ((to - from) * i) / segments;
    const a = Math.cos(t) * r1;
    const b = Math.sin(t) * r2;
    points.push(
      axis === "y" ? [cx + a, cy, cz + b] : axis === "z" ? [cx + a, cy + b, cz] : [cx, cy + a, cz + b],
    );
  }
  return points;
}

/** The twelve edges of an axis-aligned box: two rectangles and four posts. */
export function box(center: Vec3, [w, h, d]: Vec3): Strokes {
  const [cx, cy, cz] = center;
  const bottom = rect([cx, cy - h / 2, cz], w, d, "xz");
  const top = rect([cx, cy + h / 2, cz], w, d, "xz");
  const posts: Strokes = [];
  for (let i = 0; i < 4; i++) posts.push(line(bottom[i], top[i]));
  return [bottom, top, ...posts];
}

/**
 * A surface of revolution about the local y axis: `profile` is a list of
 * `[radius, height]` pairs from one end to the other. A ring is drawn at
 * every profile point with a non-zero radius, plus `meridians` longitudinal
 * lines through all of them — the classic wireframe of a bell, a drum
 * bowl, a bottle or a tube.
 */
export function lathe(
  profile: readonly P2[],
  opts: { readonly segments?: number; readonly meridians?: number } = {},
): Strokes {
  const segments = opts.segments ?? 24;
  const meridians = opts.meridians ?? 8;
  const out: Strokes = [];
  for (const [r, y] of profile) if (r > 1e-6) out.push(ring([0, y, 0], r, "y", segments));
  for (let m = 0; m < meridians; m++) {
    const t = (Math.PI * 2 * m) / meridians;
    const c = Math.cos(t);
    const s = Math.sin(t);
    out.push(profile.map(([r, y]): Vec3 => [r * c, y, r * s]));
  }
  return out;
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function length(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}
function normalize(a: Vec3): Vec3 {
  const l = length(a);
  return l > 1e-9 ? [a[0] / l, a[1] / l, a[2] / l] : [0, 1, 0];
}
export function distance(a: Vec3, b: Vec3): number {
  return length(sub(a, b));
}
export function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/**
 * A mapping from a local frame whose y axis runs from `a` to `b` into
 * world space — what `tube` and `bentTube` use to orient a lathe along an
 * arbitrary direction. `up` is a reference the local x axis is made
 * perpendicular to; it must not be parallel to `b - a`.
 */
export function frameAlong(a: Vec3, b: Vec3, up: Vec3 = [0, 1, 0]): (p: Vec3) => Vec3 {
  const u = normalize(sub(b, a));
  const helper: Vec3 = Math.abs(u[0] * up[0] + u[1] * up[1] + u[2] * up[2]) < 0.95 ? up : [1, 0, 0];
  const e1 = normalize(cross(helper, u));
  const e2 = cross(u, e1);
  return ([x, y, z]) => [
    a[0] + e1[0] * x + u[0] * y + e2[0] * z,
    a[1] + e1[1] * x + u[1] * y + e2[1] * z,
    a[2] + e1[2] * x + u[2] * y + e2[2] * z,
  ];
}

/** A straight cylinder of `radius` from `a` to `b`. */
export function tube(
  a: Vec3,
  b: Vec3,
  radius: number,
  opts: { readonly segments?: number; readonly meridians?: number; readonly rings?: number } = {},
): Strokes {
  const rings = Math.max(2, opts.rings ?? 2);
  const len = distance(a, b);
  const profile: P2[] = [];
  for (let i = 0; i < rings; i++) profile.push([radius, (len * i) / (rings - 1)]);
  const f = frameAlong(a, b);
  return lathe(profile, { segments: opts.segments ?? 12, meridians: opts.meridians ?? 4 }).map((s) =>
    s.map(f),
  );
}

/**
 * A tube of `radius` following a polyline `path` — brass tubing, a sax
 * body, a harp's neck. A ring is drawn at every path point, oriented to the
 * local tangent, and `meridians` lines connect matching ring points. `up`
 * fixes the ring orientation so consecutive rings do not twist against each
 * other; pass the normal of the plane the path mostly lies in.
 */
export function bentTube(
  path: readonly Vec3[],
  radius: number | readonly number[],
  opts: { readonly segments?: number; readonly meridians?: number; readonly up?: Vec3 } = {},
): Strokes {
  const segments = opts.segments ?? 10;
  const meridians = opts.meridians ?? 4;
  const up = opts.up ?? [0, 1, 0];
  const rings: Vec3[][] = [];
  for (let i = 0; i < path.length; i++) {
    const prev = path[Math.max(0, i - 1)];
    const next = path[Math.min(path.length - 1, i + 1)];
    const r = typeof radius === "number" ? radius : radius[Math.min(i, radius.length - 1)];
    // A frame centered on this very point, its y axis along the local
    // tangent (the chord from the previous point to the next).
    const tangent = sub(next, prev);
    const p = path[i];
    const f = frameAlong(p, [p[0] + tangent[0], p[1] + tangent[1], p[2] + tangent[2]], up);
    const pts: Vec3[] = [];
    for (let k = 0; k <= segments; k++) {
      const ang = (Math.PI * 2 * k) / segments;
      pts.push(f([Math.cos(ang) * r, 0, Math.sin(ang) * r]));
    }
    rings.push(pts);
  }
  const out: Strokes = rings.map((r) => r);
  for (let m = 0; m < meridians; m++) {
    const k = Math.round((segments * m) / meridians);
    out.push(rings.map((r) => r[k]));
  }
  return out;
}

/** A helix of `turns` about `axis` through `center`, rising `height` over its length. */
export function helix(
  center: Vec3,
  radius: number,
  turns: number,
  height: number,
  axis: Axis,
  segmentsPerTurn = 24,
): SpatialStroke {
  const n = Math.max(2, Math.round(turns * segmentsPerTurn));
  const [cx, cy, cz] = center;
  const points: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (Math.PI * 2 * turns * i) / n;
    const h = (height * i) / n - height / 2;
    const a = Math.cos(t) * radius;
    const b = Math.sin(t) * radius;
    points.push(
      axis === "y" ? [cx + a, cy + h, cz + b] : axis === "z" ? [cx + a, cy + b, cz + h] : [cx + h, cy + a, cz + b],
    );
  }
  return points;
}

/** A flat spiral in the given plane from `r0` out to `r1` — a violin scroll, a sousaphone coil seen edge-on. */
export function spiral(center: Vec3, r0: number, r1: number, turns: number, plane: Plane, segmentsPerTurn = 16): SpatialStroke {
  const n = Math.max(2, Math.round(turns * segmentsPerTurn));
  const [cx, cy, cz] = center;
  const points: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (Math.PI * 2 * turns * i) / n;
    const r = r0 + ((r1 - r0) * i) / n;
    const a = Math.cos(t) * r;
    const b = Math.sin(t) * r;
    points.push(plane === "xy" ? [cx + a, cy + b, cz] : plane === "xz" ? [cx + a, cy, cz + b] : [cx, cy + b, cz + a]);
  }
  return points;
}

// ---------------------------------------------------------------------------
// 2D outlines → 3D
// ---------------------------------------------------------------------------

function catmullRom(p0: P2, p1: P2, p2: P2, p3: P2, t: number): P2 {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}

/** A closed Catmull-Rom spline through `control`, sampled `samples` times per segment. Ends on its own first point. */
export function smoothClosed(control: readonly P2[], samples = 6): P2[] {
  const n = control.length;
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = control[(i - 1 + n) % n];
    const p1 = control[i];
    const p2 = control[(i + 1) % n];
    const p3 = control[(i + 2) % n];
    for (let j = 0; j < samples; j++) out.push(catmullRom(p0, p1, p2, p3, j / samples));
  }
  out.push(out[0]);
  return out;
}

/** An open Catmull-Rom spline through `control` (ends clamped), sampled `samples` times per segment. */
export function smoothOpen(control: readonly P2[], samples = 6): P2[] {
  const n = control.length;
  if (n < 2) return [...control];
  const out: P2[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = control[Math.max(0, i - 1)];
    const p1 = control[i];
    const p2 = control[i + 1];
    const p3 = control[Math.min(n - 1, i + 2)];
    for (let j = 0; j < samples; j++) out.push(catmullRom(p0, p1, p2, p3, j / samples));
  }
  out.push(control[n - 1]);
  return out;
}

/**
 * A full outline from its right half: `half` runs from one end to the other
 * with the second coordinate ≥ 0, and comes back mirrored. Points exactly on
 * the axis are not duplicated.
 */
export function symmetric(half: readonly P2[], mirror: 0 | 1 = 1): P2[] {
  const back: P2[] = [];
  for (let i = half.length - 1; i >= 0; i--) {
    const p = half[i];
    if (p[mirror] !== 0) back.push(mirror === 1 ? [p[0], -p[1]] : [-p[0], p[1]]);
  }
  return [...half, ...back];
}

/** Lifts a 2D outline into a plane at `offset` along the plane's normal. */
export function lift(outline: readonly P2[], plane: Plane, offset = 0): Vec3[] {
  return outline.map(([u, v]): Vec3 =>
    plane === "xy" ? [u, v, offset] : plane === "xz" ? [u, offset, v] : [offset, v, u],
  );
}

/**
 * A 2D outline extruded `thickness` along its plane's normal, centered on
 * the plane: both faces plus a post every `posts` points. A guitar body, a
 * piano rim, a bar.
 */
export function extrude(outline: readonly P2[], thickness: number, plane: Plane, posts = 4): Strokes {
  return extrudeBetween(outline, plane, -thickness / 2, thickness / 2, posts);
}

/** `extrude` between two explicit offsets along the plane's normal — a piano rim from y = 0.62 to y = 1.0. */
export function extrudeBetween(outline: readonly P2[], plane: Plane, from: number, to: number, posts = 4): Strokes {
  const a = lift(outline, plane, from);
  const b = lift(outline, plane, to);
  const out: Strokes = [a, b];
  for (let i = 0; i < outline.length - 1; i += posts) out.push(line(a[i], b[i]));
  return out;
}

/** A 3D polyline (or several) from 2D points in a plane, for open shapes like f-holes. */
export function curve(control: readonly P2[], plane: Plane, offset = 0, samples = 6): SpatialStroke {
  return lift(smoothOpen(control, samples), plane, offset);
}

// ---------------------------------------------------------------------------
// Bulk helpers
// ---------------------------------------------------------------------------

/** `count` points centered on `center`, `spacing` apart along `dir` (unit length not required). */
export function spread(center: Vec3, dir: Vec3, count: number, spacing: number): Vec3[] {
  const d = normalize(dir);
  const out: Vec3[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i - (count - 1) / 2) * spacing;
    out.push([center[0] + d[0] * t, center[1] + d[1] * t, center[2] + d[2] * t]);
  }
  return out;
}

/** Pairwise lines between two equal-length point lists — strings from nut to bridge. */
export function strings(from: readonly Vec3[], to: readonly Vec3[]): Strokes {
  const out: Strokes = [];
  const n = Math.min(from.length, to.length);
  for (let i = 0; i < n; i++) out.push(line(from[i], to[i]));
  return out;
}
