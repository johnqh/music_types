/**
 * The option lists a picker offers, derived from the vocabularies.
 *
 * **A list keyed by a closed vocabulary belongs beside the vocabulary**, not in
 * whichever app happened to need a picker first. Every one of these was written
 * out by hand in more than one place: the articulation list existed in
 * `music_app`'s inspector, in `music_app_rn`'s toolbar and in its Note tab, and
 * the three agreed only because nobody had added a fifth articulation yet. Each
 * is now `map`ped off the vocabulary itself, so adding a member reaches every
 * picker in both apps without anybody remembering to.
 *
 * **They carry an i18n *key*, never a translated string.** The words belong to
 * the app — a Chinese reader must get Chinese — and a key is not prose: it is
 * the name of a fact, which is exactly the kind of thing that may live here.
 * `none` travels under a sentinel string rather than `undefined` because a
 * picker's value is a string, and an empty one is indistinguishable from
 * "nothing chosen" (Radix refuses it outright, and the native `Select` behaves
 * the same way).
 */
import { ACCIDENTALS, ARTICULATIONS, DYNAMICS, ORNAMENTS } from "../../index.js";
import type {
  Accidental,
  Articulation,
  DurationName,
  Dynamic,
  Ornament,
} from "../../index.js";

/** "No marking here", distinct from a marking that happens to be quiet. */
export const NO_MARK = "none";

/** An entry in a picker: the value it sets, and the key naming it. */
export type PickerOption<T> = { value: T; labelKey: string };

/**
 * Articulations, with "none" first.
 *
 * The keys are `articulation.<member>` and `articulation.none`, which both apps
 * already carry — so this changes no copy, only where the list is stated.
 */
export const ARTICULATION_OPTIONS: ReadonlyArray<
  PickerOption<Articulation | typeof NO_MARK>
> = [
  { value: NO_MARK, labelKey: "articulation.none" },
  ...ARTICULATIONS.map((value) => ({
    value,
    labelKey: `articulation.${value}`,
  })),
];

/**
 * Ornament signs, with "none" first.
 *
 * `inverted-mordent` is keyed `ornament.invertedMordent`: the vocabulary member
 * is kebab-case because that is what MusicXML and the model use, and i18n keys
 * across this family are camelCase. Mapping it here is what stops each app
 * inventing its own spelling of the key — and one of them getting it wrong,
 * which shows up as the untranslated key name printed in the picker.
 */
export const ORNAMENT_OPTIONS: ReadonlyArray<
  PickerOption<Ornament | typeof NO_MARK>
> = [
  { value: NO_MARK, labelKey: "ornament.none" },
  ...ORNAMENTS.map((value) => ({
    value,
    labelKey: `ornament.${
      value === "inverted-mordent" ? "invertedMordent" : value
    }`,
  })),
];

/** Accidentals, keyed `accidental.<fifths>` — `accidental.-1` is Flat. */
export const ACCIDENTAL_OPTIONS: ReadonlyArray<PickerOption<Accidental>> =
  ACCIDENTALS.map((value) => ({ value, labelKey: `accidental.${value}` }));

/** Dynamics, with "no dynamic" first. A level is not a loudness of zero. */
export const DYNAMIC_OPTIONS: ReadonlyArray<
  PickerOption<Dynamic | typeof NO_MARK>
> = [
  { value: NO_MARK, labelKey: "inspector.noDynamic" },
  ...DYNAMICS.map((value) => ({ value, labelKey: `dynamic.${value}` })),
];

/**
 * The grids a MIDI import may be quantized onto, coarsest first.
 *
 * `none` is a real answer and the right one for a performance already sitting
 * on a grid the analyser could not confidently name: snapping such a file onto
 * a straight grid is how a swung or triplet performance arrives mechanical.
 *
 * Written out rather than mapped off `DURATION_NAMES`, and deliberately: that
 * list includes dotted and triplet values, which are not grids a performance is
 * quantized *to*. A shorter list here is the decision, not an omission.
 */
export const MIDI_GRID_OPTIONS: ReadonlyArray<
  PickerOption<DurationName | typeof NO_MARK>
> = [
  { value: NO_MARK, labelKey: "importMidi.gridNone" },
  { value: "whole", labelKey: "importMidi.gridWhole" },
  { value: "half", labelKey: "importMidi.gridHalf" },
  { value: "quarter", labelKey: "importMidi.gridQuarter" },
  { value: "eighth", labelKey: "importMidi.gridEighth" },
  { value: "sixteenth", labelKey: "importMidi.gridSixteenth" },
  { value: "thirtysecond", labelKey: "importMidi.gridThirtySecond" },
];
