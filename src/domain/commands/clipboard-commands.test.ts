/**
 * Clear keeps the container; Delete removes it. Everything here is one of the
 * two ways that can go wrong: a clear that quietly drops a marking, or an
 * insert that lengthens one part and not the others.
 */
import { describe, expect, it } from "vitest";
import { twoTrackScore } from "../../test/fixtures.js";
import { allNotes } from "../score/queries.js";
import {
  clearMeasuresCommand,
  clearTrackCommand,
  insertMeasuresCommand,
  insertTrackCommand,
  replaceMeasuresCommand,
  replaceTrackCommand,
} from "./clipboard-commands.js";
import type { MeasureSlice } from "./clipboard-commands.js";
import type { Score } from "../../model/score.js";

const run = (score: Score, command: ReturnType<typeof clearTrackCommand>): Score =>
  command.execute(score);

/** The bars at [from, to) across every track — what a copy puts on the clipboard. */
function slice(score: Score, from: number, to: number): MeasureSlice {
  return {
    count: to - from,
    tracks: score.tracks.map((track) => track.measures.slice(from, to)),
  };
}

const notesIn = (score: Score, trackIndex: number, measureIndex: number): number =>
  allNotes(score).filter(
    (note) =>
      note.trackId === score.tracks[trackIndex].id &&
      note.startTick >= score.tracks[trackIndex].measures[measureIndex].startTick &&
      note.startTick <
        score.tracks[trackIndex].measures[measureIndex].startTick +
          score.tracks[trackIndex].measures[measureIndex].durationTicks,
  ).length;

describe("clearMeasuresCommand", () => {
  it("empties the bar and keeps everything that says which bar it is", () => {
    const score = twoTrackScore();
    // A marking of each shape: one the model carries as a flag, one as an enum,
    // one as a whole object. A clear that rebuilds the measure loses all three.
    const marked = {
      ...score,
      tracks: score.tracks.map((track) => ({
        ...track,
        measures: track.measures.map((m, i) =>
          i === 1 ? { ...m, repeatStart: true, barline: "double" as const } : m,
        ),
      })),
    };
    const target = marked.tracks[0].measures[1];
    const after = run(marked, clearMeasuresCommand([target.id], "Clear"));

    expect(notesIn(after, 0, 1)).toBe(0);
    expect(after.tracks[0].measures[1].repeatStart).toBe(true);
    expect(after.tracks[0].measures[1].barline).toBe("double");
    expect(after.tracks[0].measures[1].timeSignature).toEqual(target.timeSignature);
    // The bar is still there, and so is the one beside it.
    expect(after.tracks[0].measures).toHaveLength(4);
    expect(notesIn(after, 0, 2)).toBeGreaterThan(0);
  });

  it("leaves the same bar on other tracks alone", () => {
    // The ids are per track, so clearing bar 2 of the treble must not silence
    // the bass — that is `clearTrackCommand`'s job, or a wider selection's.
    const score = twoTrackScore();
    const after = run(
      score,
      clearMeasuresCommand([score.tracks[0].measures[1].id], "Clear"),
    );
    expect(notesIn(after, 0, 1)).toBe(0);
    expect(notesIn(after, 1, 1)).toBeGreaterThan(0);
  });
});

describe("clearTrackCommand", () => {
  it("empties every bar and keeps the part itself", () => {
    const score = twoTrackScore();
    const track = score.tracks[0];
    const after = run(score, clearTrackCommand(track.id, "Clear"));

    expect(after.tracks).toHaveLength(2);
    expect(after.tracks[0].id).toBe(track.id);
    expect(after.tracks[0].name).toBe(track.name);
    expect(after.tracks[0].midiProgram).toBe(track.midiProgram);
    expect(after.tracks[0].measures).toHaveLength(track.measures.length);
    expect(
      allNotes(after).filter((n) => n.trackId === track.id),
    ).toHaveLength(0);
    // The other part is untouched.
    expect(
      allNotes(after).filter((n) => n.trackId === score.tracks[1].id).length,
    ).toBe(allNotes(score).filter((n) => n.trackId === score.tracks[1].id).length);
  });
});

describe("insertMeasuresCommand", () => {
  it("lengthens every track by the same amount, so the parts still agree", () => {
    // The failure this exists for: inserting into one part leaves the score's
    // staves disagreeing about where bar 5 is.
    const score = twoTrackScore();
    const after = run(score, insertMeasuresCommand(1, slice(score, 0, 2), "Insert"));
    expect(after.tracks.map((t) => t.measures.length)).toEqual([6, 6]);
  });

  it("puts the copied bars where it was told and moves the rest later", () => {
    const score = twoTrackScore();
    const wasAt1 = notesIn(score, 0, 1);
    const after = run(score, insertMeasuresCommand(1, slice(score, 0, 1), "Insert"));

    // Bar 1's music is now at index 1 as well as index 0, and what was at 1 has
    // moved to 2.
    expect(notesIn(after, 0, 1)).toBe(notesIn(score, 0, 0));
    expect(notesIn(after, 0, 2)).toBe(wasAt1);
  });

  it("re-times the whole score, so nothing is left at a stale tick", () => {
    const score = twoTrackScore();
    const after = run(score, insertMeasuresCommand(0, slice(score, 0, 1), "Insert"));
    for (const track of after.tracks) {
      track.measures.forEach((measure, index) => {
        expect(measure.index).toBe(index);
        if (index > 0) {
          const previous = track.measures[index - 1];
          expect(measure.startTick).toBe(previous.startTick + previous.durationTicks);
        }
      });
    }
  });

  it("gives silence to a track the slice has nothing for", () => {
    // A two-track slice pasted into a score with more parts still has to
    // lengthen all of them.
    const score = twoTrackScore();
    const oneTrack: MeasureSlice = {
      count: 1,
      tracks: [score.tracks[0].measures.slice(0, 1)],
    };
    const after = run(score, insertMeasuresCommand(0, oneTrack, "Insert"));
    expect(after.tracks[1].measures).toHaveLength(5);
    expect(notesIn(after, 1, 0)).toBe(0);
  });

  it("gives every pasted note a new id, so a paste cannot select its source", () => {
    const score = twoTrackScore();
    const before = new Set(allNotes(score).map((n) => n.id));
    const after = run(score, insertMeasuresCommand(0, slice(score, 0, 1), "Insert"));
    const added = allNotes(after).filter((n) => !before.has(n.id));
    expect(added.length).toBeGreaterThan(0);
    expect(new Set(allNotes(after).map((n) => n.id)).size).toBe(allNotes(after).length);
  });
});

describe("replaceMeasuresCommand", () => {
  it("overwrites in place and changes no lengths", () => {
    const score = twoTrackScore();
    const after = run(score, replaceMeasuresCommand(2, slice(score, 0, 2), "Replace"));
    expect(after.tracks.map((t) => t.measures.length)).toEqual([4, 4]);
    expect(notesIn(after, 0, 2)).toBe(notesIn(score, 0, 0));
    expect(notesIn(after, 0, 3)).toBe(notesIn(score, 0, 1));
  });

  it("stops at the end rather than lengthening the score", () => {
    // Replacing bars that are not there would be an insert wearing the wrong
    // name.
    const score = twoTrackScore();
    const after = run(score, replaceMeasuresCommand(3, slice(score, 0, 3), "Replace"));
    expect(after.tracks[0].measures).toHaveLength(4);
    expect(notesIn(after, 0, 3)).toBe(notesIn(score, 0, 0));
  });
});

describe("insertTrackCommand / replaceTrackCommand", () => {
  it("fits a pasted part to the score's own grid rather than its source's", () => {
    // Otherwise pasting a part copied from a longer score silently changes how
    // long every other part is.
    const score = twoTrackScore();
    const longer = {
      ...score.tracks[0],
      measures: [...score.tracks[0].measures, ...score.tracks[0].measures],
    };
    const after = run(score, insertTrackCommand(longer, 1, "Paste"));
    expect(after.tracks).toHaveLength(3);
    expect(after.tracks[1].measures).toHaveLength(4);
    expect(after.tracks.every((t) => t.measures.length === 4)).toBe(true);
  });

  it("puts the track where it was told", () => {
    const score = twoTrackScore();
    const after = run(score, insertTrackCommand(score.tracks[1], 0, "Paste"));
    expect(after.tracks[0].name).toBe(score.tracks[1].name);
    expect(after.tracks[0].id).not.toBe(score.tracks[1].id);
  });

  it("replaces in place, keeping the position and the count", () => {
    const score = twoTrackScore();
    const after = run(
      score,
      replaceTrackCommand(score.tracks[0].id, score.tracks[1], "Paste"),
    );
    expect(after.tracks).toHaveLength(2);
    expect(after.tracks[0].name).toBe(score.tracks[1].name);
    // A fresh id: the old track is gone, not renamed.
    expect(after.tracks[0].id).not.toBe(score.tracks[0].id);
    expect(after.tracks[1].id).toBe(score.tracks[1].id);
  });
});
