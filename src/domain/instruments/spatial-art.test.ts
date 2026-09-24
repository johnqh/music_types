import { describe, expect, it } from "vitest";
import {
  spatialModel,
  playedNeutral,
  played,
  NEUTRAL_POSE,
} from "./spatial-art";

describe("spatialModel", () => {
  it("derives boundsRadius from the furthest point across every stroke", () => {
    const model = spatialModel("test", [
      [
        [0, 0, 0],
        [3, 4, 0],
      ], // distance 5
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
    ]);
    expect(model.boundsRadius).toBe(5);
  });

  it("is zero for a model authored at its own origin", () => {
    const model = spatialModel("origin", [
      [
        [0, 0, 0],
        [0, 0, 0],
      ],
    ]);
    expect(model.boundsRadius).toBe(0);
  });
});

describe("playedNeutral", () => {
  it("attaches the neutral pose untouched", () => {
    const model = spatialModel("test", [
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
    ]);
    expect(playedNeutral(model).pose).toEqual(NEUTRAL_POSE);
  });
});

describe("played", () => {
  it("fills in whatever the given pose omits from neutral", () => {
    const model = spatialModel("test", [
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
    ]);
    const result = played(model, { rotationDeg: [-8, 0, 0] });
    expect(result.pose.rotationDeg).toEqual([-8, 0, 0]);
    expect(result.pose.position).toEqual(NEUTRAL_POSE.position);
    expect(result.pose.scale).toBe(NEUTRAL_POSE.scale);
  });
});
