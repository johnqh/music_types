/**
 * What happens to music already at the caret when a new note is written.
 */
import type { NotationIconName } from "../notation/notation-icon-art";

/**
 * `insert` shifts the active track's later notes out of the way, `replace`
 * overwrites them, `stack` joins them as a chord. Deliberately NOT about
 * whether one gesture makes a chord — keys held together are one chord in
 * every mode, because that is what playing them means.
 */
export const EDIT_MODES = ["insert", "replace", "stack"] as const;

export type EditMode = (typeof EDIT_MODES)[number];

/**
 * The edit modes as a toolbar offers them: in order, each with its glyph and
 * its label and hint keys.
 *
 * Beside `EditMode` because that is what it lists — one declaration of the
 * vocabulary and one of its options, in the package every app and library
 * reads vocabulary from.
 *
 * Stack's hint has a second form, `editor.stackModeUnavailable`, for a track
 * whose instrument cannot play a chord — that depends on the track, so the
 * caller picks it (`editModeHintKey` in music_editing).
 */
export const EDIT_MODE_OPTIONS: ReadonlyArray<{
  value: EditMode;
  icon: NotationIconName;
  labelKey: string;
  hintKey: string;
}> = [
  {
    value: "insert",
    icon: "InsertModeIcon",
    labelKey: "editor.insertMode",
    hintKey: "editor.insertModeHint",
  },
  {
    value: "replace",
    icon: "ReplaceModeIcon",
    labelKey: "editor.replaceMode",
    hintKey: "editor.replaceModeHint",
  },
  {
    value: "stack",
    icon: "ChordIcon",
    labelKey: "editor.stackMode",
    hintKey: "editor.stackModeHint",
  },
];
