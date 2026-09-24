import { describe, expect, it } from "vitest";
import { createEmptyScore } from "../score/factory";
import { validateScore } from "../validation/validator";
import { isNoteEvent } from "../../index";
import { twinkleScore, twoTrackScore } from "../../test/fixtures";
import {
  addMeasureCommand,
  addTrackCommand,
  changeClefCommand,
  changeKeySignatureCommand,
  changeMetadataCommand,
  changeRepeatsCommand,
  changeTempoCommand,
  removeTempoCommand,
  changeTimeSignatureCommand,
  changeTrackPropsCommand,
  insertBlankMeasuresCommand,
  deleteMeasureCommand,
  deleteTrackCommand,
  resetUnpluggedArrangementCommand,
  setUnpluggedListenerCommand,
  setUnpluggedTrackPositionCommand,
} from "./structure-commands";

function baseScore() {
  return createEmptyScore({
    title: "S",
    measures: 2,
    tracks: [{ name: "Piano" }],
  });
}

describe("addMeasureCommand", () => {
  it("appends a fully-rested measure to every track and round-trips through undo", () => {
    const score = baseScore();
    const cmd = addMeasureCommand("Add measure");

    const next = cmd.execute(score);
    expect(next.tracks[0].measures).toHaveLength(3);
    expect(validateScore(next)).toEqual([]);
    expect(cmd.undo(next)).toEqual(score);
  });
});

describe("insertBlankMeasuresCommand", () => {
  it("inserts rested bars at the requested index across every track", () => {
    const score = twoTrackScore();
    const next = insertBlankMeasuresCommand(1, 2, "Insert bars").execute(score);
    expect(next.tracks.map((track) => track.measures.length)).toEqual([6, 6]);
    expect(next.tracks[0]!.measures[1]!.voices[0]!.events).toHaveLength(1);
    expect(
      isNoteEvent(next.tracks[0]!.measures[1]!.voices[0]!.events[0]!),
    ).toBe(false);
    expect(next.tracks[0]!.measures[5]!.index).toBe(5);
  });
});

describe("deleteMeasureCommand", () => {
  it("removes the measure and retracks subsequent measures, round-tripping through undo", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 3,
      tracks: [{ name: "Piano" }],
    });
    const cmd = deleteMeasureCommand(1, "Delete measure");

    const next = cmd.execute(score);
    const track = next.tracks[0];
    expect(track.measures).toHaveLength(2);
    expect(track.measures.map((m) => m.index)).toEqual([0, 1]);
    expect(track.measures[1].startTick).toBe(track.measures[0].durationTicks);
    expect(validateScore(next)).toEqual([]);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("is a no-op when the measure index does not exist", () => {
    const score = baseScore();
    const cmd = deleteMeasureCommand(99, "Delete measure");
    expect(cmd.execute(score)).toEqual(score);
  });
});

describe("addTrackCommand", () => {
  it("adds a track matching the existing measure layout and round-trips through undo", () => {
    const score = baseScore();
    const cmd = addTrackCommand(
      {
        name: "Bass",
        instrumentName: "Bass",
        clef: "bass",
      },
      "Add track",
    );

    const next = cmd.execute(score);
    expect(next.tracks).toHaveLength(2);
    const added = next.tracks[1];
    expect(added.name).toBe("Bass");
    expect(added.measures).toHaveLength(score.tracks[0].measures.length);
    expect(validateScore(next)).toEqual([]);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("adds an empty (no-measures) track to a score with no existing tracks", () => {
    const score = createEmptyScore({ title: "S", tracks: [] });
    const cmd = addTrackCommand({ name: "Solo" }, "Add track");
    const next = cmd.execute(score);
    expect(next.tracks[0].measures).toEqual([]);
    expect(cmd.undo(next)).toEqual(score);
  });
});

describe("deleteTrackCommand", () => {
  it("removes the track and round-trips through undo", () => {
    const score = createEmptyScore({
      title: "S",
      tracks: [{ name: "A" }, { name: "B" }],
    });
    const trackId = score.tracks[1].id;
    const cmd = deleteTrackCommand(trackId, "Delete track");

    const next = cmd.execute(score);
    expect(next.tracks.map((t) => t.id)).toEqual([score.tracks[0].id]);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("is a no-op for an unknown track id", () => {
    const score = baseScore();
    const cmd = deleteTrackCommand("missing", "Delete track");
    expect(cmd.execute(score)).toEqual(score);
  });
});

describe("changeTimeSignatureCommand", () => {
  it("changes a measure duration, reflows it, retracks later measures, and round-trips through undo", () => {
    const score = createEmptyScore({
      title: "S",
      measures: 2,
      tracks: [{ name: "Piano" }],
    });
    const track = score.tracks[0];
    const measureId = track.measures[0].id;
    const cmd = changeTimeSignatureCommand(
      measureId,
      {
        numerator: 3,
        denominator: 4,
      },
      "Change time signature",
    );

    const next = cmd.execute(score);
    const nextTrack = next.tracks[0];
    expect(nextTrack.measures[0].timeSignature).toEqual({
      numerator: 3,
      denominator: 4,
    });
    expect(nextTrack.measures[0].durationTicks).toBe(3 * 480);
    expect(nextTrack.measures[1].startTick).toBe(3 * 480);
    expect(validateScore(next)).toEqual([]);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("is a no-op for an unknown measure id", () => {
    const score = baseScore();
    const cmd = changeTimeSignatureCommand(
      "missing",
      {
        numerator: 3,
        denominator: 4,
      },
      "Change time signature",
    );
    expect(cmd.execute(score)).toEqual(score);
  });
});

describe("changeKeySignatureCommand", () => {
  it("changes a measure key signature and round-trips through undo", () => {
    const score = baseScore();
    const measureId = score.tracks[0].measures[0].id;
    const cmd = changeKeySignatureCommand(
      measureId,
      {
        fifths: -3,
        mode: "minor",
      },
      "Change key signature",
    );

    const next = cmd.execute(score);
    expect(next.tracks[0].measures[0].keySignature).toEqual({
      fifths: -3,
      mode: "minor",
    });
    expect(cmd.undo(next)).toEqual(score);
  });
});

describe("changeClefCommand", () => {
  it("changes a track clef and round-trips through undo", () => {
    const score = baseScore();
    const cmd = changeClefCommand(score.tracks[0].id, "bass", "Change clef");

    const next = cmd.execute(score);
    expect(next.tracks[0].clef).toBe("bass");
    expect(cmd.undo(next)).toEqual(score);
  });

  it("reinterprets the program when a track becomes percussion", () => {
    // `midiProgram` addresses a kit on a percussion track, so the number the
    // track already holds now means something else. Program 40 is Violin as an
    // instrument and Brush as an address.
    const score = baseScore();
    const track = {
      ...score.tracks[0],
      midiProgram: 40,
      instrumentName: "Violin",
    };
    const withViolin = { ...score, tracks: [track, ...score.tracks.slice(1)] };

    const next = changeClefCommand(
      track.id,
      "percussion",
      "Change clef",
    ).execute(withViolin);
    expect(next.tracks[0].midiProgram).toBe(40);
    expect(next.tracks[0].instrumentName).toBe("Brush Kit");
  });

  it("resets the program when a track stops being percussion", () => {
    // A kit address as an instrument is whatever program happens to sit there,
    // which is not a choice anybody made.
    const score = baseScore();
    const track = {
      ...score.tracks[0],
      clef: "percussion" as const,
      midiProgram: 40,
      instrumentName: "Brush Kit",
    };
    const withKit = { ...score, tracks: [track, ...score.tracks.slice(1)] };

    const next = changeClefCommand(track.id, "treble", "Change clef").execute(
      withKit,
    );
    expect(next.tracks[0].midiProgram).toBe(0);
    expect(next.tracks[0].instrumentName).toBe("Acoustic Grand Piano");
  });

  it("leaves the program alone when the clef change stays on one side", () => {
    const score = baseScore();
    const track = {
      ...score.tracks[0],
      midiProgram: 40,
      instrumentName: "Violin",
    };
    const withViolin = { ...score, tracks: [track, ...score.tracks.slice(1)] };

    const next = changeClefCommand(track.id, "bass", "Change clef").execute(
      withViolin,
    );
    expect(next.tracks[0].midiProgram).toBe(40);
    expect(next.tracks[0].instrumentName).toBe("Violin");
  });

  it("keeps the user’s own track name across the reinterpretation", () => {
    // `name` is theirs; `instrumentName` describes the sound and has to follow.
    const score = baseScore();
    const track = { ...score.tracks[0], name: "Backbeat", midiProgram: 40 };
    const withName = { ...score, tracks: [track, ...score.tracks.slice(1)] };

    const next = changeClefCommand(
      track.id,
      "percussion",
      "Change clef",
    ).execute(withName);
    expect(next.tracks[0].name).toBe("Backbeat");
  });
});

describe("changeTempoCommand", () => {
  it("inserts a new tempo event and keeps tempoMap sorted, round-tripping through undo", () => {
    const score = baseScore();
    const cmd = changeTempoCommand({ tick: 480, bpm: 140 }, "Change tempo");

    const next = cmd.execute(score);
    expect(next.tempoMap.map((e) => e.tick)).toEqual([0, 480]);
    expect(next.tempoMap[1].bpm).toBe(140);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("updates an existing tempo event when tempoEventId is given", () => {
    const score = baseScore();
    const existingId = score.tempoMap[0].id;
    const cmd = changeTempoCommand(
      {
        tempoEventId: existingId,
        tick: 0,
        bpm: 90,
      },
      "Change tempo",
    );

    const next = cmd.execute(score);
    expect(next.tempoMap).toEqual([{ id: existingId, tick: 0, bpm: 90 }]);
    expect(cmd.undo(next)).toEqual(score);
  });
});

describe("changeMetadataCommand", () => {
  it("patches title while preserving createdAt, and round-trips through undo", () => {
    const score = baseScore();
    const cmd = changeMetadataCommand(
      { title: "New Title", composer: "Jane" },
      "Change metadata",
    );

    const next = cmd.execute(score);
    expect(next.metadata.title).toBe("New Title");
    expect(next.metadata.composer).toBe("Jane");
    expect(next.metadata.createdAt).toBe(score.metadata.createdAt);
    expect(cmd.undo(next)).toEqual(score);
  });
});

describe("changeTrackPropsCommand", () => {
  it("patches non-structural track properties and round-trips through undo", () => {
    const score = baseScore();
    const trackId = score.tracks[0].id;
    const cmd = changeTrackPropsCommand(
      trackId,
      { volume: 0.5, muted: true },
      "Change track properties",
    );

    const next = cmd.execute(score);
    expect(next.tracks[0].volume).toBe(0.5);
    expect(next.tracks[0].muted).toBe(true);
    expect(next.tracks[0].measures).toEqual(score.tracks[0].measures);
    expect(cmd.undo(next)).toEqual(score);
  });

  it("keeps mute and solo exclusive and allows only one solo track", () => {
    const score = twoTrackScore();
    const [first] = score.tracks;

    const soloed = changeTrackPropsCommand(
      first.id,
      { solo: true },
      "Solo",
    ).execute({
      ...score,
      tracks: score.tracks.map((track) =>
        track.id === first.id
          ? { ...track, muted: true }
          : { ...track, solo: true },
      ),
    });

    expect(soloed.tracks[0].solo).toBe(true);
    expect(soloed.tracks[0].muted).toBe(false);
    expect(soloed.tracks[1].solo).toBe(false);

    const muted = changeTrackPropsCommand(
      first.id,
      { muted: true },
      "Mute",
    ).execute(soloed);
    expect(muted.tracks[0].muted).toBe(true);
    expect(muted.tracks[0].solo).toBe(false);
    expect(muted.tracks[1].solo).toBe(false);
  });

  it("turning solo off has no effect on other tracks", () => {
    const score = twoTrackScore();
    const [first, second] = score.tracks;
    const next = changeTrackPropsCommand(
      first.id,
      { solo: false },
      "Unsolo",
    ).execute({
      ...score,
      tracks: score.tracks.map((track) => ({ ...track, solo: true })),
    });

    expect(next.tracks.map((track) => track.solo)).toEqual([false, true]);
    expect(second.id).toBe(next.tracks[1].id);
  });
});

describe("command kind", () => {
  it("classifies a patch of only mix properties as mix", () => {
    expect(
      changeTrackPropsCommand("t1", { muted: true }, "Change track properties")
        .kind,
    ).toBe("mix");
    expect(
      changeTrackPropsCommand("t1", { solo: true }, "Change track properties")
        .kind,
    ).toBe("mix");
    expect(
      changeTrackPropsCommand("t1", { volume: 0.5 }, "Change track properties")
        .kind,
    ).toBe("mix");
    expect(
      changeTrackPropsCommand("t1", { pan: -1 }, "Change track properties")
        .kind,
    ).toBe("mix");
    expect(
      changeTrackPropsCommand(
        "t1",
        { volume: 0.5, muted: true },
        "Change track properties",
      ).kind,
    ).toBe("mix");
  });

  it("classifies anything touching the score as content", () => {
    expect(
      changeTrackPropsCommand(
        "t1",
        { name: "Viola" },
        "Change track properties",
      ).kind,
    ).toBe("content");
    expect(
      changeTrackPropsCommand(
        "t1",
        { midiProgram: 41 },
        "Change track properties",
      ).kind,
    ).toBe("content");
    expect(
      changeTrackPropsCommand("t1", { clef: "bass" }, "Change track properties")
        .kind,
    ).toBe("content");
  });

  it("classifies a mixed patch as content, because half of it is", () => {
    expect(
      changeTrackPropsCommand(
        "t1",
        { muted: true, name: "Viola" },
        "Change track properties",
      ).kind,
    ).toBe("content");
  });

  it("treats an empty patch as mix, since it changes nothing", () => {
    expect(
      changeTrackPropsCommand("t1", {}, "Change track properties").kind,
    ).toBe("mix");
  });

  it("defaults every other command to content", () => {
    expect(addTrackCommand({ name: "New" }, "Add track").kind).toBe("content");
  });
});

describe("removeTempoCommand", () => {
  it("drops a mid-score tempo change", () => {
    const score = twinkleScore();
    const added = changeTempoCommand({ tick: 1920, bpm: 90 }, "Add").execute(
      score,
    );
    expect(added.tempoMap).toHaveLength(2);

    const removed = removeTempoCommand(added.tempoMap[1].id, "Remove").execute(
      added,
    );
    expect(removed.tempoMap).toHaveLength(1);
    expect(removed.tempoMap[0].tick).toBe(0);
  });

  it("refuses to remove the starting tempo, which is not a change", () => {
    // A score with an empty tempoMap has no tempo at all.
    const score = twinkleScore();
    const result = removeTempoCommand(score.tempoMap[0].id, "Remove").execute(
      score,
    );
    expect(result.tempoMap).toHaveLength(1);
  });

  it("leaves the score alone for an id it does not have", () => {
    const score = twinkleScore();
    const added = changeTempoCommand({ tick: 1920, bpm: 90 }, "Add").execute(
      score,
    );
    expect(
      removeTempoCommand("no-such-id", "Remove").execute(added).tempoMap,
    ).toHaveLength(2);
  });
});

describe("changeRepeatsCommand", () => {
  it("marks the barlines of a repeated section", () => {
    const score = twoTrackScore();
    const first = score.tracks[0].measures[0];
    const last = score.tracks[0].measures[3];

    let result = changeRepeatsCommand(
      first.id,
      { repeatStart: true },
      "Repeat",
    ).execute(score);
    result = changeRepeatsCommand(
      last.id,
      { repeatEnd: true },
      "Repeat",
    ).execute(result);

    expect(result.tracks[0].measures[0].repeatStart).toBe(true);
    expect(result.tracks[0].measures[3].repeatEnd).toBe(true);
  });

  it("applies to every track, so the parts agree", () => {
    // A `:|` on the top stave but not the others is a score that reads
    // differently depending on which part you play from.
    const score = twoTrackScore();
    const result = changeRepeatsCommand(
      score.tracks[0].measures[2].id,
      { repeatEnd: true },
      "Repeat",
    ).execute(score);

    expect(result.tracks.every((t) => t.measures[2].repeatEnd === true)).toBe(
      true,
    );
  });

  it("removes a marking rather than storing a false one", () => {
    const score = twoTrackScore();
    const id = score.tracks[0].measures[0].id;
    const on = changeRepeatsCommand(
      id,
      { repeatStart: true },
      "Repeat",
    ).execute(score);
    const off = changeRepeatsCommand(
      id,
      { repeatStart: false },
      "Repeat",
    ).execute(on);

    expect("repeatStart" in off.tracks[0].measures[0]).toBe(false);
  });

  it("leaves untouched fields alone", () => {
    const score = twoTrackScore();
    const id = score.tracks[0].measures[0].id;
    let result = changeRepeatsCommand(
      id,
      { repeatStart: true },
      "Repeat",
    ).execute(score);
    result = changeRepeatsCommand(id, { endingNumbers: [1] }, "Repeat").execute(
      result,
    );

    expect(result.tracks[0].measures[0].repeatStart).toBe(true);
    expect(result.tracks[0].measures[0].endingNumbers).toEqual([1]);
  });

  it("sorts ending numbers and drops an empty list", () => {
    const score = twoTrackScore();
    const id = score.tracks[0].measures[0].id;
    const on = changeRepeatsCommand(
      id,
      { endingNumbers: [2, 1] },
      "Repeat",
    ).execute(score);
    expect(on.tracks[0].measures[0].endingNumbers).toEqual([1, 2]);

    const off = changeRepeatsCommand(
      id,
      { endingNumbers: [] },
      "Repeat",
    ).execute(on);
    expect("endingNumbers" in off.tracks[0].measures[0]).toBe(false);
  });

  it("leaves the score valid and the bars unchanged in length", () => {
    const score = twoTrackScore();
    const before = score.tracks[0].measures.map((m) => m.durationTicks);
    const result = changeRepeatsCommand(
      score.tracks[0].measures[0].id,
      { repeatStart: true, endingNumbers: [1] },
      "Repeat",
    ).execute(score);

    expect(result.tracks[0].measures.map((m) => m.durationTicks)).toEqual(
      before,
    );
    expect(validateScore(result).filter((i) => i.severity === "error")).toEqual(
      [],
    );
  });
});

describe("setUnpluggedListenerCommand", () => {
  it("creates the arrangement from an all-default listener on first move", () => {
    const score = baseScore();
    const cmd = setUnpluggedListenerCommand({ x: 1, z: 2 }, "Move listener");

    const next = cmd.execute(score);
    expect(next.unplugged).toEqual({
      listener: { x: 1, z: 2, facingDeg: 0 },
      tracks: {},
    });
    expect(cmd.undo(next)).toEqual(score);
  });

  it("patches rather than replaces, so a turn does not move the listener", () => {
    const score = setUnpluggedListenerCommand(
      { x: 3, z: 4, facingDeg: 10 },
      "Move listener",
    ).execute(baseScore());

    const turned = setUnpluggedListenerCommand(
      { facingDeg: 45 },
      "Turn listener",
    ).execute(score);

    expect(turned.unplugged?.listener).toEqual({ x: 3, z: 4, facingDeg: 45 });
  });

  it("leaves any placed tracks alone", () => {
    const score = setUnpluggedTrackPositionCommand(
      "t1",
      { x: 5, z: 5 },
      "Move instrument",
    ).execute(baseScore());

    const next = setUnpluggedListenerCommand(
      { x: 1, z: 1 },
      "Move listener",
    ).execute(score);

    expect(next.unplugged?.tracks).toEqual({ t1: { x: 5, z: 5 } });
  });

  it("is a mix command, so it works while the transport plays", () => {
    expect(
      setUnpluggedListenerCommand({ x: 1, z: 1 }, "Move listener").kind,
    ).toBe("mix");
  });
});

describe("setUnpluggedTrackPositionCommand", () => {
  it("places one track and round-trips through undo", () => {
    const score = baseScore();
    const trackId = score.tracks[0].id;
    const cmd = setUnpluggedTrackPositionCommand(
      trackId,
      { x: -2, z: 3 },
      "Move instrument",
    );

    const next = cmd.execute(score);
    expect(next.unplugged?.tracks[trackId]).toEqual({ x: -2, z: 3 });
    expect(next.unplugged?.listener).toEqual({ x: 0, z: 0, facingDeg: 0 });
    expect(cmd.undo(next)).toEqual(score);
  });

  it("moving a second track leaves the first where it was placed", () => {
    const score = twoTrackScore();
    const [first, second] = score.tracks;
    const onePlaced = setUnpluggedTrackPositionCommand(
      first.id,
      { x: 1, z: 1 },
      "Move instrument",
    ).execute(score);

    const bothPlaced = setUnpluggedTrackPositionCommand(
      second.id,
      { x: -1, z: 1 },
      "Move instrument",
    ).execute(onePlaced);

    expect(bothPlaced.unplugged?.tracks).toEqual({
      [first.id]: { x: 1, z: 1 },
      [second.id]: { x: -1, z: 1 },
    });
  });

  it("is a mix command, so it works while the transport plays", () => {
    expect(
      setUnpluggedTrackPositionCommand("t1", { x: 0, z: 0 }, "Move instrument")
        .kind,
    ).toBe("mix");
  });
});

describe("resetUnpluggedArrangementCommand", () => {
  it("drops the arrangement back to absent and round-trips through undo", () => {
    const placed = setUnpluggedTrackPositionCommand(
      "t1",
      { x: 1, z: 1 },
      "Move instrument",
    ).execute(baseScore());
    expect(placed.unplugged).toBeDefined();

    const cmd = resetUnpluggedArrangementCommand("Reset arrangement");
    const next = cmd.execute(placed);
    expect(next.unplugged).toBeUndefined();
    expect(cmd.undo(next)).toEqual(placed);
  });

  it("is a no-op, and still a mix command, on a score with no arrangement", () => {
    const score = baseScore();
    const cmd = resetUnpluggedArrangementCommand("Reset arrangement");
    expect(cmd.execute(score)).toEqual(score);
    expect(cmd.kind).toBe("mix");
  });
});
