/**
 * The beam derivation — the one both the renderer and the exporter read.
 */
import { describe, expect, it } from "vitest";
import { beamBeatTicks, beamGroups } from "./beams.js";
import type { MusicalEvent, NoteEvent, TimeSignature } from "../../index.js";
import { ticksFor } from "./ticks.js";

const PPQ = 480;
const FOUR_FOUR: TimeSignature = { numerator: 4, denominator: 4 };
const SIX_EIGHT: TimeSignature = { numerator: 6, denominator: 8 };

/** `n` notes of `name`, back to back from tick 0, with optional overrides. */
function run(
  name: Parameters<typeof ticksFor>[0],
  count: number,
  overrides: Record<number, NoteEvent["beam"]> = {},
): MusicalEvent[] {
  const dur = ticksFor(name, PPQ);
  return Array.from({ length: count }, (_, i) => {
    const note = {
      id: `n-${i}`,
      trackId: "t",
      kind: "note",
      startTick: i * dur,
      durationTicks: dur,
      pitch: { step: "C", accidental: 0, octave: 5 },
      velocity: 80,
      voice: 0,
    } as NoteEvent;
    return overrides[i] ? { ...note, beam: overrides[i] } : note;
  });
}

const sizes = (events: MusicalEvent[], time = FOUR_FOUR): number[] =>
  beamGroups(events, 0, time, PPQ).map((g) => g.indices.length);

describe("beamBeatTicks", () => {
  it("is the beat in simple time", () => {
    expect(beamBeatTicks(FOUR_FOUR, PPQ)).toBe(PPQ);
    expect(beamBeatTicks({ numerator: 3, denominator: 4 }, PPQ)).toBe(PPQ);
  });

  it("is the dotted beat in compound time", () => {
    // 6/8 is two groups of three eighths. Beaming it in twos is the classic
    // way to make a jig unreadable.
    expect(beamBeatTicks(SIX_EIGHT, PPQ)).toBe(ticksFor("eighth", PPQ) * 3);
    expect(beamBeatTicks({ numerator: 12, denominator: 8 }, PPQ)).toBe(
      ticksFor("eighth", PPQ) * 3,
    );
  });

  it("treats 3/8 as simple, not compound", () => {
    // One dotted-quarter beat spanning the whole bar is simple time in
    // practice, so the `> 3` guard keeps it out of the compound branch.
    expect(beamBeatTicks({ numerator: 3, denominator: 8 }, PPQ)).toBe(
      ticksFor("eighth", PPQ),
    );
  });
});

describe("beamGroups", () => {
  it("groups eighths by beat", () => {
    expect(sizes(run("eighth", 8))).toEqual([2, 2, 2, 2]);
  });

  it("groups sixteenths by beat, four to a group", () => {
    expect(sizes(run("sixteenth", 8))).toEqual([4, 4]);
  });

  it("beams nothing when the notes are quarters", () => {
    // A quarter has no flag to join.
    expect(sizes(run("quarter", 4))).toEqual([]);
  });

  it("drops a group of one — a lone eighth draws its flag", () => {
    expect(sizes(run("eighth", 1))).toEqual([]);
  });

  it("groups three eighths per beat in 6/8", () => {
    expect(sizes(run("eighth", 6), SIX_EIGHT)).toEqual([3, 3]);
  });

  it("a break splits the run and suspends the beat boundary after it", () => {
    // "Beam these three together" has to survive crossing a beat, or the
    // override means nothing on the one edit people actually want it for.
    expect(sizes(run("eighth", 4, { 1: "break" }))).toEqual([3]);
  });

  it("a break on the first note is a no-op", () => {
    expect(sizes(run("eighth", 4, { 0: "break" }))).toEqual([2, 2]);
  });

  it("none removes its note and closes the group around it", () => {
    expect(sizes(run("eighth", 4, { 2: "none" }))).toEqual([2]);
  });

  it("a rest interrupts a beam", () => {
    const events = run("eighth", 4);
    const withRest: MusicalEvent[] = [
      ...events.slice(0, 2),
      {
        id: "r",
        trackId: "t",
        kind: "rest",
        startTick: 2 * ticksFor("eighth", PPQ),
        durationTicks: ticksFor("eighth", PPQ),
        voice: 0,
      } as MusicalEvent,
      ...events.slice(3),
    ];
    expect(sizes(withRest)).toEqual([2]);
  });

  it("measures beats from the bar, not from the start of the piece", () => {
    // A bar forty quarters in would otherwise land its beats wherever the
    // arithmetic happened to fall.
    const dur = ticksFor("eighth", PPQ);
    const offset = PPQ * 40;
    const events = run("eighth", 4).map((e, i) => ({
      ...(e as NoteEvent),
      startTick: offset + i * dur,
    })) as MusicalEvent[];
    expect(
      beamGroups(events, offset, FOUR_FOUR, PPQ).map((g) => g.indices.length),
    ).toEqual([2, 2]);
  });

  it("reports indices into the array it was given", () => {
    const groups = beamGroups(run("eighth", 4), 0, FOUR_FOUR, PPQ);
    expect(groups[0].indices).toEqual([0, 1]);
    expect(groups[1].indices).toEqual([2, 3]);
    expect(groups[0].start).toBe(0);
  });
});
