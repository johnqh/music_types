import { describe, expect, it } from "vitest";
import { createEmptyScore } from "./factory.js";
import {
  PLAYBACK_SPEEDS,
  formatTimecode,
  synthLoadPercent,
  transportExtent,
} from "./transport-readouts.js";
import type { Score } from "../../index.js";

describe("formatTimecode", () => {
  it("writes minutes, zero-padded seconds and tenths", () => {
    expect(formatTimecode(0)).toBe("0:00.0");
    expect(formatTimecode(5.27)).toBe("0:05.2");
    expect(formatTimecode(65.99)).toBe("1:05.9");
    expect(formatTimecode(600)).toBe("10:00.0");
  });

  it("never shows a negative time", () => {
    expect(formatTimecode(-3)).toBe("0:00.0");
  });
});

describe("PLAYBACK_SPEEDS", () => {
  it("is spec §22's list, slowest first, with 1x in it", () => {
    expect(PLAYBACK_SPEEDS).toEqual([0.5, 0.75, 1, 1.25, 1.5, 2]);
  });
});

describe("transportExtent", () => {
  it("measures to the end of the longest track, not the first", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tempo: 120,
      tracks: [{ name: "A" }, { name: "B" }],
    });
    // Give the second track one more bar than the first.
    const longer: Score = {
      ...score,
      tracks: [
        score.tracks[0]!,
        {
          ...score.tracks[1]!,
          measures: [
            ...score.tracks[1]!.measures,
            {
              ...score.tracks[1]!.measures[1]!,
              id: "extra",
              index: 2,
              startTick: 3840,
            },
          ],
        },
      ],
    };
    const extent = transportExtent(longer);
    expect(extent.maxTick).toBe(5760);
    // Three bars of 4/4 at 120bpm is six seconds.
    expect(extent.totalSeconds).toBeCloseTo(6);
  });

  it("floors the tick at 1 so a range control always has a span", () => {
    const score = createEmptyScore({ title: "S" });
    const empty: Score = {
      ...score,
      tracks: score.tracks.map((t) => ({ ...t, measures: [] })),
    };
    expect(transportExtent(empty).maxTick).toBe(1);
  });

  it("has no extent without a score", () => {
    expect(transportExtent(null)).toEqual({ maxTick: 1, totalSeconds: 0 });
  });
});

describe("synthLoadPercent", () => {
  it("is a whole percentage while downloading", () => {
    expect(synthLoadPercent({ status: "loading", fraction: 0.456 })).toBe(46);
  });

  it("is null while the synth digests the font and reports nothing", () => {
    expect(synthLoadPercent({ status: "loading", fraction: null })).toBeNull();
  });

  it("is null in every state that is not loading", () => {
    expect(synthLoadPercent({ status: "idle" })).toBeNull();
    expect(synthLoadPercent({ status: "ready" })).toBeNull();
    expect(synthLoadPercent({ status: "failed", message: "x" })).toBeNull();
  });
});
