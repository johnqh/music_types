import { describe, expect, it } from "vitest";
import {
  bentTube,
  box,
  extrude,
  lathe,
  place,
  ring,
  rotateX,
  rotateY,
  rotateZ,
  smoothClosed,
  smoothOpen,
  symmetric,
  tube,
} from "./spatial-geometry";

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6);

describe("rotation conventions", () => {
  it("pitch: positive tips the forward end (+z) down", () => {
    const [[p]] = rotateX([[[0, 0, 1]]], 90);
    close(p[1], -1);
    close(p[2], 0);
  });

  it("yaw: positive turns the forward end toward the player's right (+x)", () => {
    const [[p]] = rotateY([[[0, 0, 1]]], 90);
    close(p[0], 1);
    close(p[2], 0);
  });

  it("roll: positive lifts the player's-right side (+x) up", () => {
    const [[p]] = rotateZ([[[1, 0, 0]]], 90);
    close(p[1], 1);
    close(p[0], 0);
  });

  it("place applies scale, roll, pitch, yaw, then translation", () => {
    // Scale 2 on +x, roll 90 takes it to +y, pitch 90 takes +y to +z, yaw 90 takes +z to +x, then move.
    const [[p]] = place([[[1, 0, 0]]], { scale: 2, roll: 90, pitch: 90, yaw: 90, at: [10, 20, 30] });
    close(p[0], 12);
    close(p[1], 20);
    close(p[2], 30);
  });
});

describe("primitives", () => {
  it("ring closes on itself and lies in the plane perpendicular to its axis", () => {
    const r = ring([1, 2, 3], 0.5, "y", 8);
    expect(r).toHaveLength(9);
    close(r[0][0], r[8][0]);
    close(r[0][2], r[8][2]);
    for (const p of r) close(p[1], 2);
  });

  it("ring accepts an arc in degrees", () => {
    const r = ring([0, 0, 0], 1, "z", 4, { from: 0, to: 180 });
    close(r[0][0], 1);
    close(r[4][0], -1);
  });

  it("box has two rectangles and four posts", () => {
    expect(box([0, 0, 0], [1, 2, 3])).toHaveLength(6);
  });

  it("lathe draws a ring per non-zero profile point plus the meridians", () => {
    const strokes = lathe(
      [
        [0, 0],
        [1, 1],
        [1, 2],
      ],
      { segments: 8, meridians: 4 },
    );
    expect(strokes).toHaveLength(2 + 4);
  });

  it("tube runs from a to b", () => {
    const strokes = tube([0, 0, 0], [0, 0, 2], 0.1, { rings: 2, meridians: 4, segments: 8 });
    const ys = strokes.flatMap((s) => s.map((p) => p[2]));
    close(Math.min(...ys), 0);
    close(Math.max(...ys), 2);
    // Rings stay at radius 0.1 from the axis.
    for (const p of strokes[0]) close(Math.hypot(p[0], p[1]), 0.1);
  });

  it("bentTube places a ring at every path point", () => {
    const path = [
      [0, 0, 0],
      [0, 1, 0],
      [1, 2, 0],
    ] as const;
    const strokes = bentTube(path, 0.1, { segments: 6, meridians: 2, up: [0, 0, 1] });
    expect(strokes).toHaveLength(3 + 2);
    for (let i = 0; i < 3; i++) {
      const ringPts = strokes[i];
      const cx = ringPts.reduce((s, p) => s + p[0], 0) / ringPts.length;
      const cy = ringPts.reduce((s, p) => s + p[1], 0) / ringPts.length;
      // The first point is repeated to close the ring, which skews the mean slightly.
      expect(Math.abs(cx - path[i][0])).toBeLessThan(0.03);
      expect(Math.abs(cy - path[i][1])).toBeLessThan(0.03);
    }
  });
});

describe("outlines", () => {
  it("smoothClosed passes through every control point and closes", () => {
    const control = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as const;
    const pts = smoothClosed(control, 4);
    expect(pts).toHaveLength(17);
    for (let i = 0; i < 4; i++) {
      close(pts[i * 4][0], control[i][0]);
      close(pts[i * 4][1], control[i][1]);
    }
    expect(pts[16]).toEqual(pts[0]);
  });

  it("smoothOpen starts and ends on its end points", () => {
    const pts = smoothOpen(
      [
        [0, 0],
        [1, 2],
        [3, 1],
      ],
      5,
    );
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[pts.length - 1]).toEqual([3, 1]);
  });

  it("symmetric mirrors the chosen coordinate without duplicating on-axis points", () => {
    expect(
      symmetric(
        [
          [0, 0],
          [1, 1],
          [2, 0],
        ],
        1,
      ),
    ).toEqual([
      [0, 0],
      [1, 1],
      [2, 0],
      [1, -1],
    ]);
    expect(
      symmetric(
        [
          [0, 0],
          [1, 1],
        ],
        0,
      ),
    ).toEqual([
      [0, 0],
      [1, 1],
      [-1, 1],
    ]);
  });

  it("extrude gives two faces and posts between them", () => {
    const strokes = extrude(
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
      0.2,
      "xy",
      2,
    );
    expect(strokes).toHaveLength(2 + 2);
    close(strokes[0][0][2], -0.1);
    close(strokes[1][0][2], 0.1);
  });
});
