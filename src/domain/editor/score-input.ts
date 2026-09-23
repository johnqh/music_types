/**
 * What a hand does to the score, as data: a press and what lies under it, a
 * pointer gesture, a key chord, a group of piano keys, a lyric keystroke.
 *
 * The geometry that answers "what is under this point" is music_drawing's; the
 * meaning of each input is music_editing's. The shapes they pass between them
 * are declared here once, so neither package restates the other's.
 */
import type { Pitch, UUID } from "../../model/score";
import type { PitchDisplay } from "../score/display-score";

// ---- a press on the score ------------------------------------------------------

/**
 * Whatever lies under a point on the score, as the canvas reports it.
 *
 * `null` (passed where a hit is expected) means the press landed on nothing —
 * between systems, or on the gutter's empty band.
 *
 * A stave's `pitch` is the pitch **as drawn** at that point, after the display
 * lenses; `routeScorePress` inverts them itself, because a drawn pitch stored
 * raw writes a note an octave out inside an `8va` and a tone out on a B-flat
 * part — and it does so silently, since the note then draws where it was
 * pressed and only sounds wrong.
 */
export type ScoreCanvasHit =
  | { kind: "trackGutter"; trackId: UUID }
  | { kind: "measureNumber"; measureIndex: number }
  | {
      kind: "note";
      /** Every event sharing the notehead's box: a chord is one target. */
      eventIds: readonly UUID[];
      trackId: UUID;
      measureIndex: number;
      tick: number;
    }
  | {
      kind: "stave";
      trackId: UUID;
      measureIndex: number;
      tick: number;
      /** The pitch *as drawn* at that point, when the point is on a stave. */
      pitch: Pitch | null;
    };

export type ScorePressModifiers = {
  shift: boolean;
  /** Cmd on macOS, Ctrl elsewhere — resolved by the host. */
  mod: boolean;
  /** The store's `noteInput`, passed so a host can route a press it has already read. */
  noteInput: boolean;
  /** How the pressed pitch was drawn, so it can be taken back to sounding pitch. */
  pitchDisplay: PitchDisplay;
  /** The bar a shift-extended bar selection grows from; see `selectMeasureRange`. */
  anchor: number | null;
  /**
   * The tick the canvas reports for the press point (`ScoreCanvas.tickAt`), or
   * null where there is none. What a Mod press selects *to*.
   *
   * Not the hit's own tick: a hit only exists inside a measure, and its tick
   * falls back to 0 where the canvas has no answer — so reading it made a
   * Mod press between systems do nothing and one on an unmapped stretch select
   * back to the start of the piece. Required rather than defaulted to the hit,
   * so a host cannot quietly keep the old answer.
   */
  pointTick: number | null;
};

/**
 * What a primary press that may become a drag starts.
 *
 * - `move` — Alt on a note: drag the selection to another track or tick. The
 *   anchor is the last id of the box. `selectChord` is the chord to select
 *   first when none of it is selected yet (null to keep the selection); an
 *   explicit modifier leaves no ambiguity with a box select, so requiring a
 *   prior selection would be friction for nothing.
 * - `pitchDrag` — a press on the *one* selected note. Requiring it to be
 *   selected first is what keeps an ordinary press-and-drag across the staff a
 *   box select.
 * - `box` — everything else; Shift adds to the selection rather than replacing
 *   it. A box that never moves past the host's slop is an ordinary press, and
 *   goes to `routeScorePress` instead.
 */
export type PointerGesture =
  | {
      kind: "move";
      anchorId: UUID;
      anchorTick: number;
      selectChord: readonly UUID[] | null;
    }
  | { kind: "pitchDrag"; eventId: UUID; pitch: Pitch }
  | { kind: "box"; additive: boolean };

/** What produced a press. */
export type PointerKind = "mouse" | "touch";

/** What a press was, once it ended (`classifyPress`). */
export type PressKind = "tap" | "longPress" | "drag";

// ---- keys --------------------------------------------------------------------

/**
 * One keypress, platform-free.
 *
 * `mod` is Cmd on macOS and Ctrl elsewhere, resolved by the host because only
 * it knows which platform it is on — and reserved for the system throughout
 * the shortcut table, so a browser or OS shortcut is never mistaken for an
 * edit.
 */
export type EditorKeyChord = {
  key: string;
  shift: boolean;
  alt: boolean;
  mod: boolean;
};

/** Piano keys pressed together, grouped into one chord until the last lifts. */
export type KeyGroup = {
  /** Every key touched since the first went down, in the order touched. */
  midis: readonly number[];
  /** Keys still held. Empty means the group is finished. */
  down: readonly number[];
  /** When the first key went down; 0 when no group is open. */
  startedAt: number;
};

export type ReleaseResult = {
  group: KeyGroup;
  /** Set once the last finger lifts — what to hand `playKeyGroup`. */
  finished: { midis: readonly number[]; heldMs: number } | null;
};

/** A change to an existing note's pitch. */
export type PitchChange = { id: UUID; to: Pitch };

// ---- lyric entry -------------------------------------------------------------

/** Where lyric entry is in the line. */
export type LyricEntryState = {
  /** The note being written, into the notes entry began with. */
  index: number;
  /** How many notes the line has. */
  count: number;
  /** Whether the syllable before this one ended in a hyphen. */
  continuing: boolean;
};

/** A keystroke, or its on-screen equivalent, that means something to entry. */
export type LyricInput =
  "space" | "tab" | "hyphen" | "enter" | "escape" | "back";

export type LyricWrite = {
  index: number;
  text: string;
  continuing: boolean;
  hyphenated: boolean;
};

export type LyricStep = {
  state: LyricEntryState;
  /** What to write, or null when the input writes nothing. */
  write: LyricWrite | null;
  /** Whether entry is over. */
  close: boolean;
};
