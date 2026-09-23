/**
 * The score's context menu, and the two things it acts between: what the
 * selection is *of*, and what the clipboard holds.
 *
 * The model and the rules (`scoreContextMenuModel`, `selectionKind`,
 * `canPasteInto`) are music_editing's. Keys, never words.
 */
import type { NoteEvent, Track } from "../../model/score";
import type { MeasureSlice } from "../commands/clipboard-commands";

/**
 * What a selection is *of*. **Notes win, then measures, then tracks** — see
 * `selectionKind` in music_editing.
 */
export type SelectionKind = "notes" | "measures" | "track";

/**
 * What was copied, tagged with what kind of thing it is.
 *
 * A union rather than three fields, because the clipboard holds exactly one
 * thing and Paste is only offered when its kind matches the selection's — see
 * `canPasteInto`. It was a bare `{events, anchorTick}` while notes were the only
 * thing that could be copied at all.
 *
 * A **measures** entry is a vertical slice: the bars at those indices across
 * every track, not one part's. That is what the score model already means by a
 * bar — `deleteMeasureCommand` removes one from every track — and it is what
 * lets insert and replace put a slice back without leaving the parts
 * disagreeing about where bar 40 is.
 */
export type ClipboardData = (
  | { kind: "notes"; events: NoteEvent[]; anchorTick: number }
  | { kind: "measures"; slice: MeasureSlice; count: number }
  | { kind: "track"; track: Track }
) & {
  /**
   * Whether the clipboard was filled by a cut rather than a copy.
   *
   * It matters only when a paste is refused: after a copy the music is still
   * where it was, but after a cut it exists nowhere except the clipboard and
   * the undo history, so the refusal offers Undo. Absent reads as a copy, so a
   * clipboard built by hand elsewhere needs no change.
   */
  fromCut?: boolean;
};

/** Every entry, in the order the menu shows them. */
export const SCORE_CONTEXT_ACTIONS = [
  "copy",
  "cut",
  "clear",
  "delete",
  "paste",
  "selectAll",
] as const;

export type ScoreContextAction = (typeof SCORE_CONTEXT_ACTIONS)[number];

/** The label each entry is read as. A record, so a new action fails to compile here. */
export const SCORE_CONTEXT_ACTION_LABEL_KEY: Record<
  ScoreContextAction,
  string
> = {
  copy: "editor.copy",
  cut: "editor.cut",
  clear: "editor.clear",
  delete: "editor.deleteSelection",
  paste: "editor.paste",
  selectAll: "editor.selectAllNotes",
};

export type ScoreContextMenuEntry = {
  action: ScoreContextAction;
  labelKey: string;
  enabled: boolean;
};

export type ScoreContextMenuModel = {
  /** The menu's accessible name / sheet title. */
  titleKey: string;
  /**
   * What every entry acts on — "Track", "Bars", "Notes" — or null with nothing
   * selected. `count` is for the plural; translate with `{ count }`.
   */
  subject: { key: string; count: number } | null;
  entries: readonly ScoreContextMenuEntry[];
};
