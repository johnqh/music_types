import { describe, expect, it } from "vitest";
import type { Score, Track } from "../../index.js";
import {
  auditionVoiceFor,
  scoreWithResolvedKits,
  trackInstrumentLabel,
  trackKeyboardRange,
  trackMaxPolyphony,
  trackWrittenTransposition,
} from "./track-instrument.js";
import { UNLIMITED_POLYPHONY } from "./gm-polyphony.js";
import { GM_PERCUSSION_RANGE } from "./gm-percussion.js";

const track = (over: Partial<Track> = {}): Track =>
  ({
    id: "t1",
    name: "Track",
    instrumentName: "x",
    midiProgram: 0,
    midiChannel: 0,
    clef: "treble",
    volume: 1,
    pan: 0,
    muted: false,
    solo: false,
    measures: [],
    ...over,
  }) as Track;

describe("track-aware instrument lookups", () => {
  it("reads a drum track as its kit, not as the instrument at that address", () => {
    // Brush is kit 40; program 40 is Violin. Every one of these answered for
    // the violin before, and none of the wrong answers looked wrong.
    const brush = track({ clef: "percussion", midiProgram: 40 });
    expect(trackMaxPolyphony(brush)).toBe(UNLIMITED_POLYPHONY);
    expect(trackKeyboardRange(brush)).toEqual({ ...GM_PERCUSSION_RANGE });
    expect(trackInstrumentLabel(brush)).toBe("Brush Kit");
  });

  it("never transposes a drum track", () => {
    // Kits 24 and 25 are guitar programs, written an octave above where they
    // sound — so a TR-808 part was drawn an octave off its own drums.
    expect(
      trackWrittenTransposition(track({ clef: "percussion", midiProgram: 25 })),
    ).toBe(0);
    expect(
      trackWrittenTransposition(track({ clef: "treble", midiProgram: 25 })),
    ).toBe(12);
  });

  it("leaves a pitched track answering exactly as before", () => {
    const violin = track({ clef: "treble", midiProgram: 40 });
    expect(trackMaxPolyphony(violin)).toBe(2); // double stops
    expect(trackKeyboardRange(violin)).toEqual({ min: 55, max: 100 });
    expect(trackInstrumentLabel(violin)).toBe("Violin");
  });
});

describe("scoreWithResolvedKits", () => {
  const scoreOf = (tracks: Track[]) =>
    ({ id: "s", tracks }) as unknown as Score;

  it("corrects a percussion track sitting at an address no kit is at", () => {
    // A MIDI file may set any program on channel 10, and nothing before this
    // treated that number as a kit at all.
    const before = scoreOf([
      track({ clef: "percussion", midiProgram: 45, instrumentName: "Drums" }),
    ]);
    const after = scoreWithResolvedKits(before);
    expect(after.tracks[0].midiProgram).toBe(40);
    expect(after.tracks[0].instrumentName).toBe("Brush Kit");
  });

  it("returns the identical score when every kit is already a kit", () => {
    // Identity is load-bearing twice over: `computeLayout` caches on it, and a
    // fresh object would read as an edit to the autosaver — so opening a
    // project would upload a change the user never made.
    const before = scoreOf([
      track({ clef: "percussion", midiProgram: 8, instrumentName: "Drums" }),
      track({ id: "t2", clef: "treble", midiProgram: 40 }),
    ]);
    expect(scoreWithResolvedKits(before)).toBe(before);
  });

  it("leaves a valid kit track completely alone, name included", () => {
    // `instrumentName` describes a sound that is not changing, and the user may
    // have set it. Only a track being corrected has it rewritten.
    const before = scoreOf([
      track({ clef: "percussion", midiProgram: 25, instrumentName: "Beatbox" }),
    ]);
    expect(scoreWithResolvedKits(before).tracks[0].instrumentName).toBe(
      "Beatbox",
    );
  });

  it("does not touch a pitched track at a non-kit program", () => {
    const before = scoreOf([track({ clef: "treble", midiProgram: 45 })]);
    expect(scoreWithResolvedKits(before)).toBe(before);
  });
});

describe("auditionVoiceFor", () => {
  it("auditions an instrument track as its own program", () => {
    expect(auditionVoiceFor(track({ midiProgram: 40 }))).toEqual({
      program: 40,
      isPercussion: false,
    });
  });

  it("auditions a drum track as its kit, on the drum channel", () => {
    // Program 40 on a percussion track is Brush, not Violin: the flag is what
    // sends it to the drum channel, and without it the key sounds a violin.
    expect(
      auditionVoiceFor(track({ clef: "percussion", midiProgram: 40 })),
    ).toEqual({ program: 40, isPercussion: true });
  });

  it("resolves a kit address GM defines no kit at to the kit containing it", () => {
    // 41 is inside Brush's region; the plan plays it as Brush, so the
    // audition must too, or the key and the playback disagree.
    expect(
      auditionVoiceFor(track({ clef: "percussion", midiProgram: 41 })),
    ).toEqual({ program: 40, isPercussion: true });
  });

  it("auditions a piano when there is no track to ask", () => {
    expect(auditionVoiceFor(null)).toEqual({ program: 0, isPercussion: false });
    expect(auditionVoiceFor(undefined)).toEqual({
      program: 0,
      isPercussion: false,
    });
  });
});
