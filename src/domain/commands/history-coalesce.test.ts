import { describe, expect, it } from "vitest";
import { twinkleScore } from "../../test/fixtures";
import { HistoryManager } from "./history";
import {
  setUnpluggedListenerCommand,
  setUnpluggedTrackPositionCommand,
} from "./structure-commands";

describe("HistoryManager coalescing", () => {
  it("folds a run of listener moves into one undo entry that restores where the run began", () => {
    const history = new HistoryManager(5);
    let score = twinkleScore();
    for (let i = 1; i <= 50; i++) {
      score = history.execute(setUnpluggedListenerCommand({ x: i, z: 0 }, "Move"), score);
    }
    expect(score.unplugged?.listener.x).toBe(50);
    expect(history.canUndo).toBe(true);
    const undone = history.undo(score)!;
    // One undo takes the whole walk back — to no arrangement at all, which
    // is what the score had before the first move.
    expect(undone.unplugged).toBeUndefined();
    expect(history.canUndo).toBe(false);
  });

  it("redoes the run to its end state", () => {
    const history = new HistoryManager();
    let score = twinkleScore();
    score = history.execute(setUnpluggedListenerCommand({ x: 1, z: 0 }, "Move"), score);
    score = history.execute(setUnpluggedListenerCommand({ x: 2, z: 0 }, "Move"), score);
    const undone = history.undo(score)!;
    const redone = history.redo(undone)!;
    expect(redone.unplugged?.listener.x).toBe(2);
  });

  it("does not fold across different keys, or across an unrelated command", () => {
    const history = new HistoryManager();
    let score = twinkleScore();
    const trackId = score.tracks[0].id;
    score = history.execute(setUnpluggedListenerCommand({ x: 1, z: 0 }, "Move"), score);
    score = history.execute(setUnpluggedTrackPositionCommand(trackId, { x: 3, z: 3 }, "Drag"), score);
    score = history.execute(setUnpluggedListenerCommand({ x: 2, z: 0 }, "Move"), score);
    // Three entries: listener, track, listener — the last move is not folded
    // into the first because the drag sits between them.
    const a = history.undo(score)!;
    expect(a.unplugged?.listener.x).toBe(1);
    const b = history.undo(a)!;
    expect(b.unplugged?.tracks[trackId]).toBeUndefined();
    const c = history.undo(b)!;
    expect(c.unplugged).toBeUndefined();
  });

  it("keeps the newest label, so the undo menu names what the run did", () => {
    const history = new HistoryManager();
    const score = history.execute(setUnpluggedListenerCommand({ x: 1, z: 0 }, "Move listener"), twinkleScore());
    history.execute(setUnpluggedListenerCommand({ facingDeg: 30 }, "Turn listener"), score);
    expect(history.undoLabel).toBe("Turn listener");
  });
});
