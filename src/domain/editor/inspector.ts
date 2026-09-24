/**
 * The property sheet's vocabulary: its tabs, the controls that stay live while
 * the transport plays, and the patches its fields write.
 *
 * The rules over these — which tab a selection opens, what a typed tempo
 * commits — are music_editing's. Keys, never words.
 */
import type { Clef, Track } from "../../model/score";
import type { INHERIT_CLEF } from "../notation/picker-options";

/**
 * The inspector's tabs, in the web order.
 *
 * Score first, then Track — the only tab that always has something to show,
 * since there is always an active track — then Note and Bar. The native panel
 * listed Track, Note, Measure, Score; one order means a reader moving between
 * the apps finds the same tab in the same place.
 *
 * `measure` is the id and the model's word; the label is "Bar" (see the app's
 * copy), because the reader is shown a bar and the code keeps `Measure`.
 *
 * `unplugged` is last, never auto-selected the way `defaultInspectorTab`
 * picks Note or Bar from a selection — a reader reaches it only by tapping
 * it, same as Score.
 */
export const INSPECTOR_TABS = [
  "score",
  "track",
  "note",
  "measure",
  "unplugged",
] as const;

export type InspectorTab = (typeof INSPECTOR_TABS)[number];

/** The copy key naming each tab. */
export const INSPECTOR_TAB_LABEL_KEY: Record<InspectorTab, string> = {
  score: "inspector.score",
  track: "inspector.track",
  note: "inspector.note",
  measure: "inspector.measure",
  unplugged: "inspector.unplugged",
};

/**
 * The controls that stay live while the transport plays.
 *
 * Mixing, not editing: these are `kind: 'mix'` commands and reach the engine
 * live, because muting a part while listening is how an arrangement gets
 * listened to. Everything else in the inspector locks. A list rather than a
 * flag per control so the exemption is one decision, written down.
 */
export const MIX_ONLY_CONTROLS = [
  "trackVolume",
  "trackPan",
  "trackMute",
  "trackSolo",
  /**
   * Dragging an instrument or the listener, or turning the listener's
   * facing. One name for the whole Unplugged canvas rather than one per
   * gesture — the commands underneath (`setUnpluggedListenerCommand`,
   * `setUnpluggedTrackPositionCommand`) are already `kind: "mix"`, so this
   * is only what decides whether the canvas *renders* as locked; a reader
   * dragging the stage while the piece plays is the point of the feature.
   */
  "unpluggedArrangement",
] as const;

export type MixOnlyControl = (typeof MIX_ONLY_CONTROLS)[number];

/** A picker value for a bar's clef: a clef, or inherit-what-is-in-force. */
export type MeasureClefValue = Clef | typeof INHERIT_CLEF;

/** The mixing properties, which stay editable while the transport plays. */
export type TrackMixPatch = Partial<
  Pick<Track, "volume" | "pan" | "muted" | "solo">
>;

/** The metadata fields a user can edit. `createdAt` is the score's, not theirs. */
export type ScoreMetadataPatch = {
  title?: string;
  composer?: string;
  description?: string;
};
