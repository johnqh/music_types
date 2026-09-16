/**
 * The editing bar's vocabulary: its controls, the More menu, the two ways to
 * add a track, and how many voices it offers.
 *
 * When each control is available is music_editing's rule
 * (`selectToolbarAvailability`); what they are called is the host's copy.
 */

/**
 * Every control on the editing bar whose availability depends on the score.
 *
 * The view controls — zoom, layout, pitch display, the inspector toggle — are
 * deliberately absent: they change how the score is looked at rather than the
 * score, so they are live with no score, with nothing selected and while the
 * transport plays, and a row of constant `true`s would only be something for a
 * bar to forget to read.
 */
export const TOOLBAR_CONTROLS = [
  "addTrack",
  "noteDuration",
  "dotted",
  "triplet",
  "accidental",
  "articulation",
  "ornament",
  "tie",
  "insertMode",
  "replaceMode",
  "stackMode",
  "insertNote",
  "slur",
  "crescendo",
  "diminuendo",
  "arpeggiate",
  "beamBreak",
  "beamNone",
  "fermata",
  "noteInput",
  "insertRest",
  "quantizeGrid",
  "quantize",
  "voice",
  "moreActions",
  "selectAll",
  "addMeasure",
  "deleteMeasure",
  "goToBar",
  "enterLyrics",
  "glissando",
] as const;

export type ToolbarControl = (typeof TOOLBAR_CONTROLS)[number];

export type ToolbarAvailability = Record<ToolbarControl, boolean>;

/**
 * How many voices the bar offers.
 *
 * Two is where notation actually needs them — stems up against stems down on
 * one stave. More is real notation too, but nothing else in the editor tells
 * voices apart yet, so offering four would be offering somewhere to lose notes.
 */
export const EDITOR_VOICE_COUNT = 2;

export type AddTrackChoice = "blank" | "generate";

export type AddTrackChoiceOption = {
  value: AddTrackChoice;
  labelKey: string;
  hintKey: string;
  disabled: boolean;
};

/** The rarely-used actions both bars keep behind a More menu, in order. */
export const EDITOR_MORE_ACTIONS = [
  {
    value: "select-all",
    labelKey: "editor.selectAllNotes",
    control: "selectAll",
  },
  {
    value: "add-measure",
    labelKey: "editor.addMeasure",
    control: "addMeasure",
  },
  {
    value: "delete-measure",
    labelKey: "editor.deleteMeasure",
    control: "deleteMeasure",
  },
  { value: "go-to-bar", labelKey: "editor.goToBar", control: "goToBar" },
  {
    value: "enter-lyrics",
    labelKey: "editor.enterLyrics",
    control: "enterLyrics",
  },
  { value: "glissando", labelKey: "editor.glissando", control: "glissando" },
] as const satisfies ReadonlyArray<{
  value: string;
  labelKey: string;
  control: ToolbarControl;
}>;

export type EditorMoreAction = (typeof EDITOR_MORE_ACTIONS)[number]["value"];
