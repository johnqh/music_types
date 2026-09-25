import { describe, expect, it } from "vitest";
import { twoTrackScore } from "../../test/fixtures";
import { extractFragment, replaceFragment } from "../score/fragment";
import {
  applyLiveGenerationMessage,
  INITIAL_LIVE_GENERATION_STATE,
  mergeLiveScore,
} from "./live-generation";
import type { GenerationJob, LiveGenerationMessage, Score } from "../../index";

const job: GenerationJob = {
  id: "job-1",
  projectId: "project-1",
  kind: "generate-score",
  status: "running",
  createdAt: "2024-01-01T00:00:00.000Z",
  finishedAt: null,
  error: null,
};

/** The fixture with the first track's second bar transposed up, as a fragment. */
function louderBar(score: Score, bar: number) {
  const track = score.tracks[0];
  const measure = track.measures[bar];
  const fragment = extractFragment(score, {
    startTick: measure.startTick,
    endTick: measure.startTick + measure.durationTicks,
    trackIds: [track.id],
  });
  return {
    ...fragment,
    tracks: fragment.tracks.map(t => ({
      ...t,
      measures: t.measures.map(m => ({
        ...m,
        voices: m.voices.map(v => ({
          ...v,
          events: v.events.map(e =>
            "velocity" in e ? { ...e, velocity: 120 } : e,
          ),
        })),
      })),
    })),
  };
}

const snapshot = (score: Score, seq = 0): LiveGenerationMessage => ({
  type: "snapshot",
  seq,
  status: "generating",
  job,
  score,
  updatedAt: "2024-01-01T00:00:01.000Z",
});

describe("applyLiveGenerationMessage", () => {
  it("starts from the snapshot and merges fragments exactly as replaceFragment does", () => {
    const base = twoTrackScore();
    const fragment = louderBar(base, 1);
    let state = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, snapshot(base));
    expect(state.phase).toBe("live");
    expect(state.score).toBe(base);

    state = applyLiveGenerationMessage(state, { type: "fragment", seq: 1, fragment });
    expect(state.score).toEqual(replaceFragment(base, fragment));
    expect(state.lastSeq).toBe(1);
    expect(state.touched).toEqual([fragment.range]);
  });

  it("returns the same state for a duplicate or out-of-order seq, and for a heartbeat", () => {
    const base = twoTrackScore();
    const fragment = louderBar(base, 1);
    const live = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, snapshot(base, 5));
    const after = applyLiveGenerationMessage(live, { type: "fragment", seq: 6, fragment });

    expect(applyLiveGenerationMessage(after, { type: "fragment", seq: 6, fragment })).toBe(after);
    expect(applyLiveGenerationMessage(after, { type: "fragment", seq: 3, fragment })).toBe(after);
    expect(applyLiveGenerationMessage(after, { type: "heartbeat" })).toBe(after);
  });

  it("drops a fragment that arrives before any snapshot", () => {
    const fragment = louderBar(twoTrackScore(), 0);
    const state = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, {
      type: "fragment", seq: 1, fragment,
    });
    expect(state).toBe(INITIAL_LIVE_GENERATION_STATE);
  });

  it("adopts the terminal score verbatim and ends the phase", () => {
    const base = twoTrackScore();
    const final = replaceFragment(base, louderBar(base, 2));
    const live = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, snapshot(base));
    const done = applyLiveGenerationMessage(live, {
      type: "complete",
      seq: 9,
      job: { ...job, status: "done" },
      score: final,
      updatedAt: "2024-01-01T00:02:00.000Z",
    });
    expect(done.phase).toBe("complete");
    expect(done.score).toBe(final);
    expect(done.updatedAt).toBe("2024-01-01T00:02:00.000Z");
    expect(done.progress).toBeNull();

    const cancelled = applyLiveGenerationMessage(live, {
      type: "cancelled", seq: 2, job: { ...job, status: "cancelled" }, score: base, updatedAt: "x",
    });
    expect(cancelled.phase).toBe("cancelled");
  });

  it("records progress and errors", () => {
    const live = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, snapshot(twoTrackScore()));
    const progressed = applyLiveGenerationMessage(live, {
      type: "progress", seq: 1, stage: "part", label: "Bass", done: 1, total: 2,
    });
    expect(progressed.progress).toEqual({ stage: "part", label: "Bass", done: 1, total: 2 });
    const errored = applyLiveGenerationMessage(progressed, {
      type: "error", code: "forbidden", message: "not yours",
    });
    expect(errored.phase).toBe("error");
    expect(errored.error).toEqual({ code: "forbidden", message: "not yours" });
  });
});

describe("mergeLiveScore", () => {
  it("is replaceFragment for a fragment and identity for the rest", () => {
    const base = twoTrackScore();
    const fragment = louderBar(base, 0);
    expect(mergeLiveScore(base, { type: "fragment", seq: 1, fragment })).toEqual(
      replaceFragment(base, fragment),
    );
    expect(mergeLiveScore(base, { type: "heartbeat" })).toBe(base);
    expect(
      mergeLiveScore(base, { type: "progress", seq: 1, stage: "plan", label: "", done: 0, total: 1 }),
    ).toBe(base);
  });

  it("carries the project's status, and a job-less failure's reason", () => {
    // A transcription has no job: the stream still opens (the project is
    // busy), still ends, and the reason for a failure comes from the project.
    const base = twoTrackScore();
    const waiting = applyLiveGenerationMessage(INITIAL_LIVE_GENERATION_STATE, {
      type: "snapshot",
      seq: 0,
      status: "transcribing",
      job: null,
      score: base,
      updatedAt: "t1",
    });
    expect(waiting.status).toBe("transcribing");
    expect(waiting.job).toBeNull();
    const failed = applyLiveGenerationMessage(waiting, {
      type: "failed",
      seq: 1,
      job: null,
      score: base,
      updatedAt: "t2",
      error: "The recording could not be transcribed",
    });
    expect(failed.phase).toBe("failed");
    expect(failed.status).toBe("ready");
    expect(failed.failure).toBe("The recording could not be transcribed");
    const done = applyLiveGenerationMessage(waiting, {
      type: "complete",
      seq: 1,
      job: null,
      score: base,
      updatedAt: "t2",
    });
    expect(done.status).toBe("ready");
    expect(done.failure).toBeNull();
  });
});
