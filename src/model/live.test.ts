import { describe, expect, it } from "vitest";
import { twoTrackScore } from "../test/fixtures";
import {
  isTerminalLiveGenerationMessage,
  LIVE_GENERATION_CLOSE_CODES,
  LIVE_GENERATION_ERROR_CODES,
  LIVE_GENERATION_MESSAGE_TYPES,
  LIVE_GENERATION_PROGRESS_STAGES,
  liveGenerationClientMessageSchema,
  liveGenerationMessageSchema,
  parseLiveGenerationMessage,
} from "./live";
import type { GenerationJob, LiveGenerationMessage } from "../index";
import { extractFragment } from "../domain/score/fragment";

const job: GenerationJob = {
  id: "job-1",
  projectId: "project-1",
  kind: "generate-score",
  status: "running",
  createdAt: "2024-01-01T00:00:00.000Z",
  finishedAt: null,
  error: null,
};

function every(): LiveGenerationMessage[] {
  const score = twoTrackScore();
  const fragment = extractFragment(score, {
    startTick: 0,
    endTick: 1920,
    trackIds: [score.tracks[0].id],
  });
  return [
    { type: "snapshot", seq: 0, status: "generating", job, score, updatedAt: "2024-01-01T00:00:01.000Z" },
    { type: "fragment", seq: 1, fragment },
    { type: "progress", seq: 2, stage: "section", label: "Piano · Verse", done: 1, total: 4 },
    { type: "heartbeat" },
    {
      type: "complete",
      seq: 3,
      job: { ...job, status: "done", finishedAt: "2024-01-01T00:01:00.000Z" },
      score,
      updatedAt: "2024-01-01T00:01:00.000Z",
    },
    { type: "failed", seq: 3, job: { ...job, status: "failed", error: "boom" }, score, updatedAt: "x" },
    { type: "cancelled", seq: 3, job: { ...job, status: "cancelled" }, score, updatedAt: "x" },
    { type: "error", code: "unauthorized", message: "Bad token" },
  ];
}

describe("live generation protocol", () => {
  it("parses every message type the vocabulary names", () => {
    const seen = new Set<string>();
    for (const message of every()) {
      expect(liveGenerationMessageSchema.safeParse(message).success).toBe(true);
      seen.add(message.type);
    }
    expect([...seen].sort()).toEqual([...LIVE_GENERATION_MESSAGE_TYPES].sort());
  });

  it("returns the original object, not a stripped copy", () => {
    // A field the schema does not know must survive: the adopted score has to
    // equal what GET returns, and zod's parse would silently drop it.
    const [snapshot] = every();
    const withExtra = { ...snapshot, extra: { future: true } };
    expect(parseLiveGenerationMessage(withExtra)).toBe(withExtra);
  });

  it("refuses an unknown type, a missing seq, and a bad stage", () => {
    expect(() => parseLiveGenerationMessage({ type: "nope" })).toThrow();
    expect(() =>
      parseLiveGenerationMessage({ type: "fragment", fragment: every()[1] }),
    ).toThrow();
    expect(() =>
      parseLiveGenerationMessage({
        type: "progress", seq: 1, stage: "verse", label: "", done: 0, total: 1,
      }),
    ).toThrow();
  });

  it("knows which messages end the stream", () => {
    const terminal = every()
      .filter(isTerminalLiveGenerationMessage)
      .map(m => m.type)
      .sort();
    expect(terminal).toEqual(["cancelled", "complete", "error", "failed"]);
  });

  it("accepts the client's two frames and nothing else", () => {
    expect(liveGenerationClientMessageSchema.safeParse({ type: "auth", token: "t" }).success).toBe(true);
    expect(liveGenerationClientMessageSchema.safeParse({ type: "ping" }).success).toBe(true);
    expect(liveGenerationClientMessageSchema.safeParse({ type: "auth", token: "" }).success).toBe(false);
    expect(liveGenerationClientMessageSchema.safeParse({ type: "snapshot" }).success).toBe(false);
  });

  it("keeps refusals in the application close-code range", () => {
    for (const [name, code] of Object.entries(LIVE_GENERATION_CLOSE_CODES)) {
      if (["DONE", "GOING_AWAY", "INTERNAL"].includes(name)) continue;
      expect(code).toBeGreaterThanOrEqual(4000);
      expect(code).toBeLessThan(5000);
    }
    expect(LIVE_GENERATION_ERROR_CODES.length).toBeGreaterThan(0);
    expect(LIVE_GENERATION_PROGRESS_STAGES).toContain("section");
  });
});
