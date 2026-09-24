/**
 * Command-based undo/redo history (spec §14). `HistoryManager` holds only
 * command-history bookkeeping (the undo/redo stacks and a size limit) —
 * never a `Score` itself or any store reference: the current score always
 * lives with the caller, passed in and received back on every call.
 */
import type { Score } from "../../index";
import type { ScoreCommand } from "./types";

const DEFAULT_LIMIT = 200;

/** `first`'s undo with `latest`'s execute — see `ScoreCommand.coalesceKey`. */
function coalesced(first: ScoreCommand, latest: ScoreCommand): ScoreCommand {
  return {
    id: first.id,
    label: latest.label,
    timestamp: first.timestamp,
    kind: latest.kind,
    coalesceKey: first.coalesceKey,
    execute: (score) => latest.execute(score),
    undo: (score) => first.undo(score),
  };
}

export class HistoryManager {
  private readonly limit: number;
  private undoStack: ScoreCommand[] = [];
  private redoStack: ScoreCommand[] = [];

  constructor(limit: number = DEFAULT_LIMIT) {
    this.limit = limit;
  }

  /**
   * Runs `cmd.execute(score)`, pushes `cmd` onto the undo stack (evicting
   * the oldest entry if that exceeds `limit`), and clears the redo stack
   * (a fresh command invalidates any previously-undone branch), per spec
   * §14.
   */
  execute(cmd: ScoreCommand, score: Score): Score {
    const next = cmd.execute(score);
    const top = this.undoStack[this.undoStack.length - 1];
    if (cmd.coalesceKey !== undefined && top?.coalesceKey === cmd.coalesceKey) {
      // Fold into the previous entry: it keeps its own undo (which restores
      // the state before the whole run began) and takes on the newest
      // command's execute and label, so redo replays the run's end state.
      this.undoStack[this.undoStack.length - 1] = coalesced(top, cmd);
    } else {
      this.undoStack.push(cmd);
      if (this.undoStack.length > this.limit) {
        this.undoStack.shift();
      }
    }
    this.redoStack = [];
    return next;
  }

  /** Undoes the most recently executed (or redone) command, or returns `null` if there is nothing to undo. */
  undo(score: Score): Score | null {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    const previous = cmd.undo(score);
    this.redoStack.push(cmd);
    return previous;
  }

  /** Re-executes the most recently undone command, or returns `null` if there is nothing to redo. */
  redo(score: Score): Score | null {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;
    const next = cmd.execute(score);
    this.undoStack.push(cmd);
    return next;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1].label
      : null;
  }

  get redoLabel(): string | null {
    return this.redoStack.length > 0
      ? this.redoStack[this.redoStack.length - 1].label
      : null;
  }

  /** Clears both the undo and redo stacks. */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
