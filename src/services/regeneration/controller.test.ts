import { describe, expect, it } from "vitest";
import { createEmptyScore } from "../../domain/score/factory.js";
import { emptySelection } from "../../domain/selection/types.js";
import type { ScoreSelection } from "../../domain/selection/types.js";
import {
  applyCandidate,
  prepareRegenerationRequest,
  prepareRegenerationRequestForRange,
} from "./controller.js";
import type { RegenerationCandidate } from "../../index.js";

function scoreWithMeasures(measureCount = 6) {
  return createEmptyScore({
    title: "S",
    measures: measureCount,
    tracks: [{ name: "Piano" }],
  });
}

describe("prepareRegenerationRequest", () => {
  it("throws when the selection has no resolvable tick range", () => {
    const score = scoreWithMeasures();
    expect(() =>
      prepareRegenerationRequest(score, emptySelection(), "x"),
    ).toThrow();
  });

  it("does not report expansion for an already full-measure selection", () => {
    const score = scoreWithMeasures();
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[2].id],
      trackIds: [],
    };

    const request = prepareRegenerationRequest(
      score,
      selection,
      "Make this more dramatic",
    );

    expect(request.expandedToFullMeasures).toBe(false);
    expect(request.range).toEqual({
      startTick: track.measures[2].startTick,
      endTick: track.measures[2].startTick + track.measures[2].durationTicks,
      trackIds: [track.id],
    });
  });

  it("reports expansion for a partial-measure range selection and aligns range to full measures", () => {
    const score = scoreWithMeasures();
    const track = score.tracks[0];
    const measure = track.measures[2];
    const partialRange = {
      startTick: measure.startTick + 10,
      endTick: measure.startTick + 20,
      trackIds: [track.id],
    };
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [],
      trackIds: [],
      range: partialRange,
    };

    const request = prepareRegenerationRequest(score, selection, "x");

    expect(request.expandedToFullMeasures).toBe(true);
    expect(request.range).toEqual({
      startTick: measure.startTick,
      endTick: measure.startTick + measure.durationTicks,
      trackIds: [track.id],
    });
  });

  it("extracts up to 2 measures of preceding and following context", () => {
    const score = scoreWithMeasures(6);
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[3].id],
      trackIds: [],
    };

    const request = prepareRegenerationRequest(score, selection, "x");

    expect(
      request.precedingContext.tracks[0].measures.map((m) => m.index),
    ).toEqual([1, 2]);
    expect(
      request.followingContext.tracks[0].measures.map((m) => m.index),
    ).toEqual([4, 5]);
    expect(
      request.selectedFragment.tracks[0].measures.map((m) => m.index),
    ).toEqual([3]);
  });

  it("preceding context is empty (not an error) when the selection starts at measure 0", () => {
    const score = scoreWithMeasures(4);
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[0].id],
      trackIds: [],
    };

    const request = prepareRegenerationRequest(score, selection, "x");

    expect(request.precedingContext.tracks[0].measures).toEqual([]);
    expect(
      request.followingContext.tracks[0].measures.map((m) => m.index),
    ).toEqual([1, 2]);
  });

  it("following context is empty (not an error) when the selection ends at the last measure", () => {
    const score = scoreWithMeasures(4);
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[3].id],
      trackIds: [],
    };

    const request = prepareRegenerationRequest(score, selection, "x");

    expect(request.followingContext.tracks[0].measures).toEqual([]);
  });

  it("always sets preserveMeasureCount/preserveTimeSignatures/preserveTempoEvents to true", () => {
    const score = scoreWithMeasures();
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[0].id],
      trackIds: [],
    };
    const request = prepareRegenerationRequest(score, selection, "x");

    expect(request.constraints.preserveMeasureCount).toBe(true);
    expect(request.constraints.preserveTimeSignatures).toBe(true);
    expect(request.constraints.preserveTempoEvents).toBe(true);
  });

  it("pins candidateCount to 1 and allows overriding other constraints", () => {
    const score = scoreWithMeasures();
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[0].id],
      trackIds: [],
    };

    // Was 3 with a `candidateCount` option. Generation is a background job
    // now, so there is nobody present to choose between alternatives when it
    // lands; one result is produced and applied.
    const withDefaults = prepareRegenerationRequest(score, selection, "x");
    expect(withDefaults.candidateCount).toBe(1);

    const withOverrides = prepareRegenerationRequest(score, selection, "x", {
      constraints: { preserveMelody: true, maximumPolyphony: 1 },
    });
    expect(withOverrides.candidateCount).toBe(1);
    expect(withOverrides.constraints.preserveMelody).toBe(true);
    expect(withOverrides.constraints.maximumPolyphony).toBe(1);
  });

  it("sets scoreId to the source score's id", () => {
    const score = scoreWithMeasures();
    const track = score.tracks[0];
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [track.measures[0].id],
      trackIds: [],
    };
    const request = prepareRegenerationRequest(score, selection, "x");
    expect(request.scoreId).toBe(score.id);
  });
});

describe("applyCandidate", () => {
  it("returns a ScoreCommand that replaces the candidate's range with its fragment", () => {
    const score = scoreWithMeasures(3);
    const track = score.tracks[0];
    const measure = track.measures[1];
    const range = {
      startTick: measure.startTick,
      endTick: measure.startTick + measure.durationTicks,
      trackIds: [track.id],
    };

    const replacementNote = {
      id: "replacement-note",
      pitch: { step: "G" as const, accidental: 0 as const, octave: 4 },
      startTick: measure.startTick,
      durationTicks: measure.durationTicks,
      velocity: 90,
      voiceId: "placeholder-voice",
      trackId: "placeholder-track",
    };
    const candidate: RegenerationCandidate = {
      id: "candidate-1",
      label: "Variation 1",
      fragment: {
        range,
        ppq: score.ppq,
        tracks: [
          {
            trackId: track.id,
            measures: [
              {
                ...measure,
                id: "new-measure",
                voices: [
                  {
                    id: "new-voice",
                    name: "Voice 1",
                    events: [replacementNote],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const command = applyCandidate(score, candidate);
    const result = command.execute(score);
    const resultTrack = result.tracks.find((t) => t.id === track.id)!;

    expect(resultTrack.measures).toHaveLength(3);
    const replacedMeasure = resultTrack.measures[1];
    expect(replacedMeasure.voices[0].events[0]).toMatchObject({
      trackId: track.id,
      voiceId: replacedMeasure.voices[0].id,
    });

    const undone = command.undo(result);
    expect(undone).toEqual(score);
  });

  it("throws when the candidate references a track absent from the score", () => {
    const score = scoreWithMeasures(1);
    const candidate: RegenerationCandidate = {
      id: "candidate-1",
      label: "Variation 1",
      fragment: {
        range: { startTick: 0, endTick: 1, trackIds: ["no-such-track"] },
        ppq: score.ppq,
        tracks: [{ trackId: "no-such-track", measures: [] }],
      },
    };
    expect(() => applyCandidate(score, candidate)).toThrow();
  });
});

describe("prepareRegenerationRequestForRange", () => {
  it("uses the range verbatim, without expanding to measures", () => {
    const score = scoreWithMeasures();
    const ppq = score.ppq;
    const range = {
      startTick: ppq,
      endTick: ppq * 3,
      trackIds: [score.tracks[0].id],
    };

    const req = prepareRegenerationRequestForRange(score, range, "brighter", {
      measureAligned: false,
    });

    expect(req.range.startTick).toBe(ppq);
    expect(req.range.endTick).toBe(ppq * 3);
    expect(req.expandedToFullMeasures).toBe(false);
  });

  it("drops preserveMeasureCount for a region that is not measure-aligned", () => {
    const score = scoreWithMeasures();
    const ppq = score.ppq;
    const range = {
      startTick: ppq,
      endTick: ppq * 3,
      trackIds: [score.tracks[0].id],
    };

    const req = prepareRegenerationRequestForRange(score, range, "x", {
      measureAligned: false,
    });

    expect(req.constraints.preserveMeasureCount).toBeUndefined();
    // The other two never depend on alignment.
    expect(req.constraints.preserveTimeSignatures).toBe(true);
    expect(req.constraints.preserveTempoEvents).toBe(true);
  });

  it("keeps preserveMeasureCount for a measure-aligned region", () => {
    const score = scoreWithMeasures();
    const m = score.tracks[0].measures;
    const range = {
      startTick: m[0].startTick,
      endTick: m[1].startTick + m[1].durationTicks,
      trackIds: [score.tracks[0].id],
    };

    const req = prepareRegenerationRequestForRange(score, range, "x", {
      measureAligned: true,
    });

    expect(req.constraints.preserveMeasureCount).toBe(true);
  });

  it("defaults to measure-aligned, since every caller but Replace Notes is", () => {
    const score = scoreWithMeasures();
    const m = score.tracks[0].measures;
    const range = {
      startTick: 0,
      endTick: m[0].durationTicks,
      trackIds: [score.tracks[0].id],
    };

    expect(
      prepareRegenerationRequestForRange(score, range, "x").constraints
        .preserveMeasureCount,
    ).toBe(true);
  });

  it("carries style, mood and complexity onto the request", () => {
    const score = scoreWithMeasures();
    const m = score.tracks[0].measures;
    const range = {
      startTick: 0,
      endTick: m[0].durationTicks,
      trackIds: [score.tracks[0].id],
    };

    const req = prepareRegenerationRequestForRange(score, range, "x", {
      style: "baroque",
      mood: "melancholy",
      complexity: "complex",
    });

    expect(req.style).toBe("baroque");
    expect(req.mood).toBe("melancholy");
    expect(req.complexity).toBe("complex");
  });

  it("always asks for exactly one candidate", () => {
    const score = scoreWithMeasures();
    const m = score.tracks[0].measures;
    const range = {
      startTick: 0,
      endTick: m[0].durationTicks,
      trackIds: [score.tracks[0].id],
    };

    expect(
      prepareRegenerationRequestForRange(score, range, "x").candidateCount,
    ).toBe(1);
  });

  it("still extracts preceding and following context around the range", () => {
    const score = scoreWithMeasures();
    const m = score.tracks[0].measures;
    const range = {
      startTick: m[2].startTick,
      endTick: m[2].startTick + m[2].durationTicks,
      trackIds: [score.tracks[0].id],
    };

    const req = prepareRegenerationRequestForRange(score, range, "x");

    expect(req.precedingContext.range.endTick).toBe(range.startTick);
    expect(req.followingContext.range.startTick).toBe(range.endTick);
  });
});

describe("prepareRegenerationRequest still snaps", () => {
  it("asks for one candidate too, now that candidates are gone", () => {
    const score = scoreWithMeasures();
    const selection: ScoreSelection = {
      eventIds: [],
      measureIds: [score.tracks[0].measures[1].id],
      trackIds: [],
    };

    expect(
      prepareRegenerationRequest(score, selection, "x").candidateCount,
    ).toBe(1);
  });
});

describe("the request says who is playing", () => {
  it("describes each track of the fragment, in the fragment's order", () => {
    // A `ScoreFragment` carries measures and no identity, so a request without
    // this left the model inferring the instrument from the notes.
    const score = createEmptyScore({
      title: "S",
      measures: 4,
      tracks: [
        { name: "Cello", midiProgram: 42, clef: "bass" },
        { name: "Kit", midiProgram: 16, clef: "percussion" },
      ],
    });
    const request = prepareRegenerationRequestForRange(
      score,
      {
        startTick: 0,
        endTick: 1920,
        trackIds: score.tracks.map((t) => t.id),
      },
      "busier",
    );

    expect(request.tracks?.map((t) => t.name)).toEqual(["Cello", "Kit"]);
    expect(request.tracks?.map((t) => t.clef)).toEqual(["bass", "percussion"]);
  });

  it("names the kit, not the melodic instrument sharing its program", () => {
    // Program 16 is the Power kit on a drum track and a Drawbar Organ
    // everywhere else. Telling the model it is writing for an organ while
    // handing it the drum map is worse than saying nothing at all.
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Kit", midiProgram: 16, clef: "percussion" }],
    });
    const request = prepareRegenerationRequestForRange(
      score,
      { startTick: 0, endTick: 1920, trackIds: [score.tracks[0].id] },
      "busier",
    );

    expect(request.tracks?.[0].instrumentName).toBe("Power Kit");
  });

  it("gives the kit its own compass, not the compass of program 16", () => {
    // Program 16 is a drawbar organ on a pitched track and the Power kit on a
    // drum one, so a range read from the program alone is wrong for the kit.
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Kit", midiProgram: 16, clef: "percussion" }],
    });
    const request = prepareRegenerationRequestForRange(
      score,
      { startTick: 0, endTick: 1920, trackIds: [score.tracks[0].id] },
      "busier",
    );

    const range = request.tracks?.[0].range;
    expect(range).toEqual({ lowestMidi: 35, highestMidi: 81 });
  });
});

describe("the request carries what the new part must fit", () => {
  it("sends the other tracks over the same bars, with who plays them", () => {
    // "Write something that works with the piano" is unfollowable by a model
    // that was never shown the piano — and the preceding/following contexts
    // are earlier and later BARS, not other parts of the same bars.
    const score = createEmptyScore({
      title: "S",
      measures: 4,
      tracks: [
        { name: "Piano", midiProgram: 0, clef: "treble" },
        { name: "Cello", midiProgram: 42, clef: "bass" },
      ],
    });
    const cello = score.tracks[1];

    const request = prepareRegenerationRequestForRange(
      score,
      { startTick: 0, endTick: 1920, trackIds: [cello.id] },
      "sing over the piano",
    );

    expect(request.accompaniment?.tracks.map((t) => t.name)).toEqual(["Piano"]);
    expect(request.accompaniment?.fragment.tracks.map((t) => t.trackId)).toEqual(
      [score.tracks[0].id],
    );
    // The same bars the new part will occupy, not earlier or later ones.
    expect(request.accompaniment?.fragment.range.startTick).toBe(0);
    expect(request.accompaniment?.fragment.range.endTick).toBe(1920);
  });

  it("omits it when the region already covers every track", () => {
    // Nothing left to listen to; an empty accompaniment would only cost bytes.
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Piano" }],
    });
    const request = prepareRegenerationRequestForRange(
      score,
      { startTick: 0, endTick: 1920, trackIds: [score.tracks[0].id] },
      "again",
    );

    expect(request.accompaniment).toBeUndefined();
  });
});
