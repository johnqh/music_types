/**
 * A 2D icon projected from an instrument's 3D wireframe model — so the 128
 * icons are exactly as distinct as the 128 models, and a track's icon
 * matches the instrument it shows on the Spatial stage by construction.
 *
 * The view is whichever of the three axis-aligned projections (front, side,
 * top) spreads the model over the most area, which is the one that reads
 * as its silhouette: a grand piano from above, a guitar from the front, a
 * clarinet from the side. The projection is fitted into the 24-unit icon
 * viewbox, then simplified for a glyph a few millimetres across: each
 * polyline is Douglas–Peucker-reduced, strokes too small to survive at that
 * size are dropped (a key cup, a tuning peg), and the longest strokes win
 * if what is left is still too busy.
 *
 * Emitted as `M`/`L` paths, the subset `parseIconPath` reads, so every
 * existing icon consumer — the canvas gutter, the app's `<svg>`, the native
 * app — draws them unchanged.
 */
import type { IconShape, InstrumentIconArt } from "./icon-art";
import { ICON_VIEWBOX } from "./icon-art";
import type { InstrumentSpatialModel, Vec3 } from "./spatial-art";

type P2 = readonly [number, number];

const PADDING = 1.5;
/** Douglas–Peucker tolerance, in icon units. */
const EPSILON = 0.4;
/** A stroke whose projected extent is under this many icon units is noise at glyph size. */
const MIN_EXTENT = 1.8;
/** Enough for a silhouette, few enough to stay a glyph rather than a smear. */
const MAX_SEGMENTS = 90;

type View = "front" | "side" | "top";

function project(p: Vec3, view: View): P2 {
  switch (view) {
    case "front":
      return [p[0], -p[1]];
    case "side":
      return [p[2], -p[1]];
    default:
      return [p[0], -p[2]];
  }
}

function bounds(points: readonly P2[]): { readonly min: P2; readonly max: P2 } {
  let minU = Infinity;
  let minV = Infinity;
  let maxU = -Infinity;
  let maxV = -Infinity;
  for (const [u, v] of points) {
    if (u < minU) minU = u;
    if (v < minV) minV = v;
    if (u > maxU) maxU = u;
    if (v > maxV) maxV = v;
  }
  return { min: [minU, minV], max: [maxU, maxV] };
}

function bestView(model: InstrumentSpatialModel): View {
  let best: View = "front";
  let bestArea = -1;
  for (const view of ["front", "side", "top"] as const) {
    const pts = model.strokes.flatMap((s) => s.map((p) => project(p, view)));
    const { min, max } = bounds(pts);
    const area = (max[0] - min[0]) * (max[1] - min[1]);
    if (area > bestArea) {
      bestArea = area;
      best = view;
    }
  }
  return best;
}

function perpendicularDistance(p: P2, a: P2, b: P2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function douglasPeucker(points: readonly P2[], epsilon: number): P2[] {
  if (points.length < 3) return [...points];
  let index = 0;
  let maxDist = 0;
  const last = points.length - 1;
  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      index = i;
    }
  }
  if (maxDist <= epsilon) return [points[0], points[last]];
  const left = douglasPeucker(points.slice(0, index + 1), epsilon);
  const right = douglasPeucker(points.slice(index), epsilon);
  return [...left.slice(0, -1), ...right];
}

function extent(points: readonly P2[]): number {
  const { min, max } = bounds(points);
  return Math.max(max[0] - min[0], max[1] - min[1]);
}

const cache = new Map<InstrumentSpatialModel, InstrumentIconArt>();

/** The icon for `model`, derived once and cached by model identity. */
export function iconFromModel(model: InstrumentSpatialModel): InstrumentIconArt {
  const cached = cache.get(model);
  if (cached) return cached;
  const view = bestView(model);
  const projected = model.strokes.map((s) => s.map((p) => project(p, view)));
  const { min, max } = bounds(projected.flat());
  const span = Math.max(max[0] - min[0], max[1] - min[1], 1e-6);
  const scale = (ICON_VIEWBOX - 2 * PADDING) / span;
  const offU = PADDING + ((ICON_VIEWBOX - 2 * PADDING) - (max[0] - min[0]) * scale) / 2;
  const offV = PADDING + ((ICON_VIEWBOX - 2 * PADDING) - (max[1] - min[1]) * scale) / 2;
  const fitted = projected.map((s) => s.map(([u, v]): P2 => [offU + (u - min[0]) * scale, offV + (v - min[1]) * scale]));

  const simplified = fitted
    .map((s) => douglasPeucker(s, EPSILON))
    .filter((s) => s.length >= 2 && extent(s) >= MIN_EXTENT)
    .sort((a, b) => extent(b) - extent(a));

  const shapes: IconShape[] = [];
  let segments = 0;
  for (const stroke of simplified) {
    if (segments + stroke.length - 1 > MAX_SEGMENTS) continue;
    segments += stroke.length - 1;
    const d = stroke.map(([u, v], i) => `${i === 0 ? "M" : "L"}${u.toFixed(1)} ${v.toFixed(1)}`).join(" ");
    shapes.push({ kind: "path", d });
  }
  const icon: InstrumentIconArt = { name: model.id, shapes };
  cache.set(model, icon);
  return icon;
}
