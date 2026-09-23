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
/*
 * Imported from `model/score.js`, which declares them, and deliberately NOT
 * from the package barrel. A module that reads a *value* out of `index.js`
 * joins a cycle with everything the barrel re-exports — and the option lists
 * below are built while this module loads, so the read happens at
 * module-evaluation time, which is where such a cycle throws. That is what made
 * `music-vocabulary.js` unimportable as an entry point: it reaches this module,
 * this module pulled in the whole barrel, and `style-presets.js` then built its
 * table from a `SONG_SECONDS` that `music-vocabulary` had not defined yet.
 * Import the declaring module, never the barrel.
 */
import {
  ACCIDENTALS,
  ARTICULATIONS,
  BARLINE_STYLES,
  CLEFS,
  DYNAMICS,
  ORNAMENTS,
} from "../../model/score";
import type {
  Accidental,
  Articulation,
  BarlineStyle,
  Clef,
  DurationName,
  Dynamic,
  KeySignature,
  Ornament,
} from "../../model/score";

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

/**
 * An entry in the dynamic picker.
 *
 * Only "no dynamic" carries a key. A marking is its own label — `pp` is `pp`
 * in every language, the way a note name or a General MIDI program name is —
 * so both apps print the value itself. The list used to hand every marking a
 * `dynamic.<member>` key regardless, which neither app defined and neither
 * could usefully fill: a translator has nothing to write for `mf`, and a
 * published key nobody answers is a key some future picker prints raw. Leaving
 * it off the type makes "label a marking by its value" something the compiler
 * says rather than something each host has to know.
 */
export type DynamicOption =
  | { value: typeof NO_MARK; labelKey: string }
  | { value: Dynamic };

/** Dynamics, with "no dynamic" first. A level is not a loudness of zero. */
export const DYNAMIC_OPTIONS: ReadonlyArray<DynamicOption> = [
  { value: NO_MARK, labelKey: "inspector.noDynamic" },
  ...DYNAMICS.map((value) => ({ value })),
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

// ---- sentinels for the measure and note fields -----------------------------
//
// Each of these stands for an *absence* the model stores as a missing field.
// They live here, beside `NO_MARK`, because both apps' inspectors write the
// same pickers and had each declared their own copy — agreeing only because
// nobody had yet changed one. A picker's value is a string and an empty one is
// indistinguishable from "nothing chosen", so every absence needs a value of
// its own. `NO_MARK` serves the dynamic picker as well: "no dynamic" is not a
// different absence from "no articulation", and `DYNAMIC_OPTIONS` already
// uses it, so there is deliberately no `NO_DYNAMIC`.

/**
 * A length no single note value spells — a tie join or an import can leave
 * one. Shown so the duration picker states what the note actually is rather
 * than relabelling it as the nearest name, and inert when chosen.
 */
export const CUSTOM_DURATION = "__custom__";

/** "Carry on with the clef in force": the bar stores no clef change. */
export const INHERIT_CLEF = "inherit";

/** "This score opens without a pickup." */
export const NO_PICKUP = "none";

/** The ordinary barline, which is the absence of a `BarlineStyle`. */
export const SINGLE_BARLINE = "single";

/** "This bar carries no jump instruction." */
export const NO_JUMP = "none";

/** A record, so a new barline style fails to compile until it has a key. */
const BARLINE_LABEL_KEY: Record<BarlineStyle, string> = {
  double: "inspector.barlineDouble",
  final: "inspector.barlineFinal",
};

/**
 * The barline picker: the ordinary single line first, then every style.
 *
 * Mapped off `BARLINE_STYLES`, so a style added to the model reaches both
 * apps' pickers rather than going quietly unoffered.
 */
export const BARLINE_OPTIONS: ReadonlyArray<
  PickerOption<BarlineStyle | typeof SINGLE_BARLINE>
> = [
  { value: SINGLE_BARLINE, labelKey: "inspector.barlineSingle" },
  ...BARLINE_STYLES.map((value) => ({
    value,
    labelKey: BARLINE_LABEL_KEY[value],
  })),
];

/**
 * Major and minor, keyed `key.major`/`key.minor` — the keys both apps already
 * carry. The web inspector wrote the bare English words into this picker,
 * which is how a Chinese reader came to choose a mode in English.
 */
export const KEY_MODE_OPTIONS: ReadonlyArray<PickerOption<KeySignature["mode"]>> =
  (["major", "minor"] as const).map((value) => ({
    value,
    labelKey: `key.${value}`,
  }));

/**
 * The word for each clef.
 *
 * Every clef picker used to print the model's own token — `treble`, `bass` — so
 * a reader chose a clef in lower-case English whatever their language. Both
 * apps then fixed that the same way and each kept its own copy of this table,
 * which is exactly the drift this file exists to prevent: a `Record`, so a
 * sixth clef fails to compile here rather than printing its token in somebody's
 * picker.
 *
 * Published as the record *and* as the options below, because both shapes are
 * in use: the Bar tab names the clef *in force* ("carry on with Treble"), which
 * is one lookup rather than a list.
 */
export const CLEF_LABEL_KEY: Record<Clef, string> = {
  treble: "clef.treble",
  bass: "clef.bass",
  alto: "clef.alto",
  tenor: "clef.tenor",
  percussion: "clef.percussion",
};

/**
 * Every clef, in the model's order.
 *
 * There is no "none" here: a stave always has a clef, so the absence a *bar*
 * can express is `INHERIT_CLEF`, which the Bar tab prepends itself.
 */
export const CLEF_OPTIONS: ReadonlyArray<PickerOption<Clef>> = CLEFS.map(
  (value) => ({ value, labelKey: CLEF_LABEL_KEY[value] }),
);
