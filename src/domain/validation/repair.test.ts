import { describe, expect, it } from "vitest";
import { repairScore } from "./repair.js";
import { validateScore } from "./validator.js";
import { ISSUE_CODES } from "./issues.js";
import { twinkleScore, twoTrackScore } from "../../test/fixtures.js";
import type { NoteEvent, Score } from "../../index.js";

/** Applies `edit` to the first voice of the first measure of the first track. */
function editFirstVoice(
  score: Score,
  edit: (
    events: NoteEvent[],
  ) => Score["tracks"][number]["measures"][number]["voices"][number]["events"],
): Score {
  const track = score.tracks[0];
  const measure = track.measures[0];
  const voice = measure.voices[0];
  return {
    ...score,
    tracks: [
      {
        ...track,
        measures: [
          {
            ...measure,
            voices: [{ ...voice, events: edit(voice.events as NoteEvent[]) }],
            ...{},
          },
          ...track.measures.slice(1),
        ],
      },
      ...score.tracks.slice(1),
    ],
  };
}

describe("repairScore", () => {
  it("returns a clean score untouched, by reference", () => {
    const score = twinkleScore();
    const result = repairScore(score);
    expect(result.score).toBe(score);
    expect(result.fixed).toEqual({});
    expect(result.remaining).toEqual({});
  });

  it("leaves a clean two-track score valid", () => {
    expect(validateScore(repairScore(twoTrackScore()).score)).toEqual([]);
  });

  /*
    The case this was written for: a generated drum part in which the same hit
    was emitted twice at one tick. Identical spelling, tick and length, so
    there is no shortening that separates them — one of the two is not music.
  */
  it("drops an exact duplicate note rather than shortening it", () => {
    const score = editFirstVoice(twinkleScore(), (events) => {
      const first = events[0];
      return [...events, { ...first, id: `${first.id}-copy` }];
    });
    expect(
      validateScore(score).filter(
        (i) => i.code === ISSUE_CODES.OVERLAPPING_SAME_PITCH,
      ),
    ).toHaveLength(1);

    const result = repairScore(score);
    expect(result.fixed[ISSUE_CODES.OVERLAPPING_SAME_PITCH]).toBe(1);
    expect(
      validateScore(result.score).filter(
        (i) => i.code === ISSUE_CODES.OVERLAPPING_SAME_PITCH,
      ),
    ).toEqual([]);
    const kept = result.score.tracks[0].measures[0].voices[0].events;
    expect(kept.filter((e) => e.id.endsWith("-copy"))).toHaveLength(0);
  });

  /*
    A partial overlap is one note still sounding when the next strike of the
    same pitch arrives — the first should stop there, not disappear.
  */
  it("truncates the earlier note when a same-pitch overlap is partial", () => {
    const score = editFirstVoice(twinkleScore(), (events) => {
      const first = events[0];
      return [
        ...events,
        {
          ...first,
          id: `${first.id}-late`,
          startTick: first.startTick + Math.floor(first.durationTicks / 2),
        },
      ];
    });
    const result = repairScore(score);
    const events = result.score.tracks[0].measures[0].voices[0].events;
    const original = events.find(
      (e) => e.id === score.tracks[0].measures[0].voices[0].events[0].id,
    );
    const late = events.find((e) => e.id.endsWith("-late"));
    expect(late).toBeDefined();
    expect(original).toBeDefined();
    expect(original!.startTick + original!.durationTicks).toBe(late!.startTick);
    expect(
      validateScore(result.score).filter(
        (i) => i.code === ISSUE_CODES.OVERLAPPING_SAME_PITCH,
      ),
    ).toEqual([]);
  });

  it("renames a duplicate id and keeps the first use", () => {
    const score = editFirstVoice(twinkleScore(), (events) => [
      ...events.slice(0, 1),
      { ...events[1], id: events[0].id },
      ...events.slice(2),
    ]);
    expect(
      validateScore(score).some((i) => i.code === ISSUE_CODES.DUPLICATE_ID),
    ).toBe(true);
    const result = repairScore(score);
    expect(
      validateScore(result.score).filter(
        (i) => i.code === ISSUE_CODES.DUPLICATE_ID,
      ),
    ).toEqual([]);
  });

  it("clamps an out-of-range velocity and moves an out-of-range pitch by octaves", () => {
    const score = editFirstVoice(twinkleScore(), (events) => [
      {
        ...events[0],
        velocity: 999,
        pitch: { ...events[0].pitch, octave: 40 },
      },
      ...events.slice(1),
    ]);
    const result = repairScore(score);
    const fixedNote = result.score.tracks[0].measures[0].voices[0]
      .events[0] as NoteEvent;
    expect(fixedNote.velocity).toBe(127);
    expect(fixedNote.pitch.step).toBe(
      score.tracks[0].measures[0].voices[0].events[0].pitch.step,
    );
    expect(
      validateScore(result.score).filter(
        (i) =>
          i.code === ISSUE_CODES.INVALID_VELOCITY ||
          i.code === ISSUE_CODES.INVALID_PITCH_RANGE,
      ),
    ).toEqual([]);
  });

  it("sorts an out-of-order tempo map and clamps its bpm", () => {
    const base = twinkleScore();
    const score: Score = {
      ...base,
      tempoMap: [
        { id: "t1", tick: 1920, bpm: 5000 },
        { id: "t2", tick: 0, bpm: 120 },
      ],
    };
    const result = repairScore(score);
    expect(result.score.tempoMap.map((t) => t.tick)).toEqual([0, 1920]);
    expect(
      validateScore(result.score).filter(
        (i) =>
          i.code === ISSUE_CODES.TEMPO_MAP_UNSORTED ||
          i.code === ISSUE_CODES.INVALID_TEMPO_BPM,
      ),
    ).toEqual([]);
  });

  it("fills an underfull voice with rests", () => {
    const score = editFirstVoice(twinkleScore(), (events) =>
      events.slice(0, 1),
    );
    expect(
      validateScore(score).some(
        (i) => i.code === ISSUE_CODES.MEASURE_UNDERFULL,
      ),
    ).toBe(true);
    const result = repairScore(score);
    expect(
      validateScore(result.score).filter(
        (i) => i.code === ISSUE_CODES.MEASURE_UNDERFULL,
      ),
    ).toEqual([]);
  });

  /*
    The report is measured, not asserted: `fixed` is the difference between
    validating before and after, so it can never claim a rule the repaired
    score still reports.
  */
  it("never claims to have fixed something the repaired score still reports", () => {
    const score = editFirstVoice(twinkleScore(), (events) => [
      ...events,
      { ...events[0], id: `${events[0].id}-copy` },
      { ...events[1], id: events[1].id, velocity: -4 },
    ]);
    const result = repairScore(score);
    const after = validateScore(result.score);
    for (const [code, count] of Object.entries(result.fixed)) {
      expect(count).toBeGreaterThan(0);
      const stillThere = after.filter((i) => i.code === code).length;
      expect(stillThere).toBe(result.remaining[code] ?? 0);
    }
  });

  it("reduces the total issue count for a badly broken score", () => {
    const score = editFirstVoice(twinkleScore(), (events) => [
      ...events,
      { ...events[0], id: `${events[0].id}-copy` },
      { ...events[0], id: `${events[0].id}-copy2` },
    ]);
    const before = validateScore(score).length;
    const after = validateScore(repairScore(score).score).length;
    expect(after).toBeLessThan(before);
    expect(after).toBe(0);
  });
});
