import { describe, expect, it } from "vitest";
import { createEmptyScore } from "./factory.js";
import {
  measureAtTick,
  measureIndexOf,
  noteIdsOverlappingRange,
  noteIndexAtOrAfter,
  trackNotesInOrder,
  voiceNumberOf,
} from "./queries.js";
import { createEmptyScore as testScore } from "../../test-helpers.js";

/**
 * Three named tracks, built from this package's own helper.
 *
 * The fixture this replaces lives in `music_lib`'s test tree and reaches a
 * VexFlow type, which is exactly what must not follow these modules across.
 */
function threeTrackScore() {
  return testScore({
    title: "Three",
    measures: 2,
    tracks: [{ name: "Alpha" }, { name: "Beta" }, { name: "Gamma" }],
  });
}
import {
  allNotes,
  eventsInRange,
  findEvent,
  findMeasure,
  findTrack,
  measuresInRange,
  noteAt,
  scoreEndTick,
  scoreWithTracks,
} from "./queries.js";
import type { NoteEvent, Score } from "../../index.js";

/** Builds a 2-measure, single-track score, then overwrites voice 0's events with `events`. */
function scoreWithEvents(events: NoteEvent[]): Score {
  const score = createEmptyScore({
    title: "Fixture",
    measures: 2,
    tracks: [{ name: "Piano" }],
  });
  const track = score.tracks[0];
  const [m0, m1] = track.measures;
  const m0Events = events.filter(
    (e) => e.startTick < m0.startTick + m0.durationTicks,
  );
  const m1Events = events.filter(
    (e) => e.startTick >= m0.startTick + m0.durationTicks,
  );
  return {
    ...score,
    tracks: [
      {
        ...track,
        measures: [
          { ...m0, voices: [{ ...m0.voices[0], events: m0Events }] },
          { ...m1, voices: [{ ...m1.voices[0], events: m1Events }] },
        ],
      },
    ],
  };
}

function note(
  overrides: Partial<NoteEvent> &
    Pick<NoteEvent, "id" | "startTick" | "durationTicks">,
): NoteEvent {
  return {
    pitch: { step: "C", accidental: 0, octave: 4 },
    velocity: 80,
    voiceId: "v1",
    trackId: "t1",
    ...overrides,
  };
}

describe("findTrack / findMeasure / findEvent", () => {
  it("finds a track by id, or null when absent", () => {
    const score = createEmptyScore({ title: "S", tracks: [{ name: "Piano" }] });
    const track = score.tracks[0];
    expect(findTrack(score, track.id)).toBe(track);
    expect(findTrack(score, "missing")).toBeNull();
  });

  it("finds a measure by id across all tracks, or null when absent", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Piano" }],
    });
    const measure = score.tracks[0].measures[1];
    expect(findMeasure(score, measure.id)).toBe(measure);
    expect(findMeasure(score, "missing")).toBeNull();
  });

  it("finds an event (note or rest) by id across all tracks/measures/voices, or null when absent", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 1,
      tracks: [{ name: "Piano" }],
    });
    const event = score.tracks[0].measures[0].voices[0].events[0];
    expect(findEvent(score, event.id)).toBe(event);
    expect(findEvent(score, "missing")).toBeNull();
  });
});

describe("eventsInRange", () => {
  it("returns only note events overlapping the tick range, on the requested tracks", () => {
    const n1 = note({ id: "n1", startTick: 0, durationTicks: 480 });
    const n2 = note({ id: "n2", startTick: 480, durationTicks: 480 });
    const n3 = note({ id: "n3", startTick: 1920, durationTicks: 480 }); // in measure 2, outside range
    const score = scoreWithEvents([n1, n2, n3]);
    const trackId = score.tracks[0].id;

    const result = eventsInRange(score, {
      startTick: 0,
      endTick: 960,
      trackIds: [trackId],
    });
    expect(result.map((e) => e.id).sort()).toEqual(["n1", "n2"]);
  });

  it("excludes rests (returns NoteEvent[] only)", () => {
    // Default empty score measures are filled with a single rest per measure.
    const score = createEmptyScore({
      title: "S",
      measures: 1,
      tracks: [{ name: "Piano" }],
    });
    const trackId = score.tracks[0].id;
    const result = eventsInRange(score, {
      startTick: 0,
      endTick: 10_000,
      trackIds: [trackId],
    });
    expect(result).toEqual([]);
  });

  it("includes all tracks when trackIds is empty", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 1,
      tracks: [{ name: "A" }, { name: "B" }],
    });
    const [trackA, trackB] = score.tracks;
    const noteA = note({
      id: "a",
      startTick: 0,
      durationTicks: 480,
      trackId: trackA.id,
    });
    const noteB = note({
      id: "b",
      startTick: 0,
      durationTicks: 480,
      trackId: trackB.id,
    });
    const withNotes: Score = {
      ...score,
      tracks: [
        {
          ...trackA,
          measures: [
            {
              ...trackA.measures[0],
              voices: [{ ...trackA.measures[0].voices[0], events: [noteA] }],
            },
          ],
        },
        {
          ...trackB,
          measures: [
            {
              ...trackB.measures[0],
              voices: [{ ...trackB.measures[0].voices[0], events: [noteB] }],
            },
          ],
        },
      ],
    };

    const result = eventsInRange(withNotes, {
      startTick: 0,
      endTick: 480,
      trackIds: [],
    });
    expect(result.map((e) => e.id).sort()).toEqual(["a", "b"]);
  });
});

describe("measuresInRange", () => {
  it("returns per-track measures overlapping the tick range", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 3,
      tracks: [{ name: "Piano" }],
    });
    const trackId = score.tracks[0].id;
    const measureTicks = score.tracks[0].measures[0].durationTicks;

    const result = measuresInRange(score, {
      startTick: measureTicks, // start of measure index 1
      endTick: measureTicks + 1,
      trackIds: [trackId],
    });

    expect(result).toHaveLength(1);
    expect(result[0].trackId).toBe(trackId);
    expect(result[0].measures.map((m) => m.index)).toEqual([1]);
  });
});

describe("noteAt", () => {
  it("finds a note event covering the given tick on the given track", () => {
    const n1 = note({ id: "n1", startTick: 0, durationTicks: 480 });
    const score = scoreWithEvents([n1]);
    const trackId = score.tracks[0].id;

    const found = noteAt(score, trackId, 240);
    expect(found?.id).toBe("n1");
  });

  it("returns null when no note covers the tick", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 1,
      tracks: [{ name: "Piano" }],
    });
    const trackId = score.tracks[0].id;
    expect(noteAt(score, trackId, 0)).toBeNull();
  });

  it("filters by midi pitch when provided", () => {
    const c4 = note({
      id: "c4",
      startTick: 0,
      durationTicks: 480,
      pitch: { step: "C", accidental: 0, octave: 4 },
    });
    const score = scoreWithEvents([c4]);
    const trackId = score.tracks[0].id;

    expect(noteAt(score, trackId, 0, 60)).not.toBeNull(); // C4 = midi 60
    expect(noteAt(score, trackId, 0, 61)).toBeNull();
  });
});

describe("scoreEndTick", () => {
  it("returns the tick where the last measure of the longest track ends", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Piano" }],
    });
    const track = score.tracks[0];
    const lastMeasure = track.measures[track.measures.length - 1];
    expect(scoreEndTick(score)).toBe(
      lastMeasure.startTick + lastMeasure.durationTicks,
    );
  });

  it("returns 0 for a score with no measures", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 0,
      tracks: [{ name: "Piano" }],
    });
    expect(scoreEndTick(score)).toBe(0);
  });
});

describe("allNotes", () => {
  it("flattens all note events across all tracks/measures/voices, excluding rests", () => {
    const n1 = note({ id: "n1", startTick: 0, durationTicks: 480 });
    const n2 = note({ id: "n2", startTick: 1920, durationTicks: 480 });
    const score = scoreWithEvents([n1, n2]);
    expect(
      allNotes(score)
        .map((n) => n.id)
        .sort(),
    ).toEqual(["n1", "n2"]);
  });
});

describe("scoreWithTracks", () => {
  const score = () => threeTrackScore();

  it("keeps only the named tracks, in score order", () => {
    const s = score();
    const [a, , c] = s.tracks;
    expect(scoreWithTracks(s, [c.id, a.id]).tracks.map((t) => t.id)).toEqual([
      a.id,
      c.id,
    ]);
  });

  it("ignores ids that do not resolve", () => {
    const s = score();
    expect(
      scoreWithTracks(s, [s.tracks[0].id, "deleted"]).tracks.map((t) => t.id),
    ).toEqual([s.tracks[0].id]);
  });

  it("returns the same score when every track is named", () => {
    // Reference equality, not deep equality: exporting an unfiltered score
    // should cost nothing.
    const s = score();
    expect(
      scoreWithTracks(
        s,
        s.tracks.map((t) => t.id),
      ),
    ).toBe(s);
  });

  it("leaves the tracks it keeps untouched", () => {
    const s = score();
    expect(scoreWithTracks(s, [s.tracks[1].id]).tracks[0]).toBe(s.tracks[1]);
  });
});

describe("score queries added for the UI extraction", () => {
  const scoreWithNotes = (): Score => {
    const score = createEmptyScore({
      title: "Q",
      measures: 2,
      tracks: [{ name: "One" }, { name: "Two" }],
    });
    const track = score.tracks[0];
    const voice = track.measures[0].voices[0];
    voice.events = [
      {
        id: "b",
        startTick: 960,
        durationTicks: 480,
        voiceId: voice.id,
        trackId: track.id,
        pitch: { step: "E", accidental: 0, octave: 4 },
        velocity: 80,
      },
      {
        id: "a",
        startTick: 0,
        durationTicks: 480,
        voiceId: voice.id,
        trackId: track.id,
        pitch: { step: "C", accidental: 0, octave: 4 },
        velocity: 80,
      },
      { id: "r", startTick: 480, durationTicks: 480, voiceId: voice.id, trackId: track.id },
    ];
    return score;
  };

  it("trackNotesInOrder sorts by tick and drops rests", () => {
    // The sort is part of the answer: anything meaning "the next note after
    // here" depends on it, and it must not be each caller's job to remember.
    const score = scoreWithNotes();
    const notes = trackNotesInOrder(score, score.tracks[0].id);
    expect(notes.map((n) => n.id)).toEqual(["a", "b"]);
  });

  it("noteIndexAtOrAfter falls back to the start past the end", () => {
    // "Begin here" with the caret past the last note means begin at the
    // beginning, because the command has to start somewhere.
    const score = scoreWithNotes();
    const notes = trackNotesInOrder(score, score.tracks[0].id);
    expect(noteIndexAtOrAfter(notes, 0)).toBe(0);
    expect(noteIndexAtOrAfter(notes, 500)).toBe(1);
    expect(noteIndexAtOrAfter(notes, 99999)).toBe(0);
  });

  it("voiceNumberOf counts from 1, matching the toolbar", () => {
    const score = scoreWithNotes();
    const note = trackNotesInOrder(score, score.tracks[0].id)[0];
    expect(voiceNumberOf(score, note)).toBe(1);
  });

  it("measureIndexOf finds a measure in its own track", () => {
    const score = scoreWithNotes();
    expect(measureIndexOf(score, score.tracks[0].measures[1].id)).toBe(1);
    expect(measureIndexOf(score, "nope")).toBeNull();
  });

  it("measureAtTick clamps past the end rather than answering null", () => {
    const score = scoreWithNotes();
    const track = score.tracks[0];
    expect(measureAtTick(score, track.id, 0)?.id).toBe(track.measures[0].id);
    expect(measureAtTick(score, track.id, 9_999_999)?.id).toBe(
      track.measures[track.measures.length - 1].id,
    );
  });

  it("noteIdsOverlappingRange takes a note that starts before and sounds inside", () => {
    // Overlap, not containment: such a note was replaced by whatever was
    // written there, so it is part of what changed.
    const score = scoreWithNotes();
    const track = score.tracks[0];
    const ids = noteIdsOverlappingRange(score, {
      startTick: 240,
      endTick: 300,
      trackIds: [track.id],
    });
    expect(ids).toEqual(["a"]);
  });

  it("noteIdsOverlappingRange ignores tracks outside the range", () => {
    const score = scoreWithNotes();
    expect(
      noteIdsOverlappingRange(score, {
        startTick: 0,
        endTick: 99999,
        trackIds: [score.tracks[1].id],
      }),
    ).toEqual([]);
  });
});
