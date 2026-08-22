/**
 * The current selection, as an interface rather than a store shape.
 *
 * Same reasoning as `IMusicPosition` next door. What the user has selected —
 * notes, measures, the active track — is read by things that have no business
 * knowing which state library holds it: the renderer colouring noteheads, a
 * command deciding what it applies to, a toolbar deciding what to disable.
 * Depending on the store for that couples every one of them to zustand and to
 * this app's particular slice layout.
 *
 * The rule that keeps it honest is the same one the playhead follows: there is
 * exactly **one writer**. The store's own selection actions feed this, so it
 * mirrors rather than duplicates, and the two cannot drift apart. Nothing here
 * is a second copy of the truth that somebody has to remember to update.
 */
import type { ScoreSelection, UUID } from "../index.js";

/** Undoes a `subscribe`. */
export type UnsubscribeSelection = () => void;

/** Read access to what is currently selected. */
export interface IMusicSelection {
  /** Ids of the selected note events. Empty when nothing is selected. */
  readonly noteIds: readonly UUID[];

  /** Ids of the selected measures. */
  readonly measureIds: readonly UUID[];

  /** Ids of tracks selected outright — *not* the active track, which is separate. */
  readonly trackIds: readonly UUID[];

  /**
   * The track edits are aimed at.
   *
   * Distinct from `trackIds`: one track is always active (it is what the
   * caret writes into and what the piano keyboard shows), whereas selecting a
   * track is something the user does to a track and usually does not.
   */
  readonly activeTrackId: UUID | null;

  /** The whole selection, in the shape commands already take. */
  readonly selection: ScoreSelection;

  /** Called after any of the above changes. */
  subscribe(listener: () => void): UnsubscribeSelection;
}

/**
 * The write side, held by the store and by nothing else.
 *
 * Split from `IMusicSelection` so that a consumer can be handed the reading
 * half and be structurally unable to change what it is reading — the same
 * split `IMusicPositionSource` makes, and for the same reason.
 */
export interface IMusicSelectionSource extends IMusicSelection {
  /** Replaces the selection wholesale. */
  setSelection(selection: ScoreSelection): void;

  /** Records which track edits are aimed at. */
  setActiveTrackId(trackId: UUID | null): void;
}
