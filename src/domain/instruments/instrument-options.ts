/**
 * The General MIDI catalogue, shaped for a picker.
 *
 * Every caller that offers "which instrument?" — a generate dialog, a track
 * property sheet — needs the same three things: the flattened list of melodic
 * programs grouped by family, the eight drum kits, and a way to turn whichever
 * one was chosen back into the fields a `Track` stores. Deriving those at each
 * call site is how the two lists get confused, so they are derived once here.
 *
 * Kits are tagged rather than numbered, because a kit's program means
 * something else entirely from a melodic one: on channel 10, program 8 is the
 * Room Kit, not Celesta. That is what `KIT_PREFIX` is for, and why a bare
 * program number must never be handed to a control offering `KIT_OPTIONS` —
 * it matches nothing and the control renders empty while still selecting
 * correctly, which is a bug that looks like a styling problem.
 *
 * No user-facing copy lives here beyond the GM names themselves, which are
 * fixed identifiers rather than translatable strings — "Acoustic Grand Piano"
 * is the program's name in every locale.
 */
import type { Clef } from "../../index";
import {
  GM_FAMILIES,
  GM_FAMILY_LABELS,
  gmInstrument,
  gmInstrumentsByFamily,
} from "./gm";
import { GM_KITS, gmKit, gmKitAt } from "./gm-kit";
import { VOICE_PROGRAMS, isVocalProgram } from "./arrangement-order";

/** What a caller needs to write an instrument onto a track, or request one. */
export type InstrumentChoice = {
  midiProgram: number;
  instrumentName: string;
  clef: Clef;
};

/** One entry in a picker: the value to round-trip, its label, and its family heading. */
export type InstrumentOption = {
  value: string;
  label: string;
  group?: string;
};

const KIT_PREFIX = "kit:";

/** The default selection: Piano, which is also the melody-carrying lead. */
export const DEFAULT_INSTRUMENT_VALUE = "0";

/**
 * The voice a song is carried by, when one is added for the reader.
 *
 * `Voice Oohs` rather than `Choir Aahs`: a lead vocal is one person, and the
 * choir patch is what a *backing* line sounds like. This is the only place the
 * distinction between the three voice programs is stated — everywhere else
 * they are simply "a voice" — so it is stated once, here.
 */
export const DEFAULT_VOCAL_INSTRUMENT_VALUE = "53";

/**
 * The `KIT_OPTIONS` value for a program.
 *
 * Through `gmKitAt`, so a track sitting at an address no kit is at still
 * selects the kit it actually plays rather than showing an empty control.
 */
export function kitOptionValue(program: number): string {
  return `${KIT_PREFIX}${gmKitAt(program).program}`;
}

/** The eight GM drum kits, for a percussion track. */
export const KIT_OPTIONS: InstrumentOption[] = GM_KITS.map((kit) => ({
  value: `${KIT_PREFIX}${kit.program}`,
  label: kit.name,
}));

/**
 * The three programs that are a human voice, as a group of their own.
 *
 * GM files them under `ensemble`, between String Ensemble and Orchestra Hit,
 * which is where nobody setting out to write a song looks for a singer — so in
 * practice a generated score never had one. The group is *derived* from the set
 * the arranger reads (`VOICE_PROGRAMS`) rather than restating three numbers,
 * because a picker offering a voice the arranger does not recognise as one is
 * exactly the drift that costs a vocal-led arrangement.
 *
 * The default lead goes first and the rest follow in catalogue order: the first
 * entry of a group is the one a reader takes as its ordinary answer, and here
 * that answer is the solo voice.
 */
export const VOICE_OPTIONS: InstrumentOption[] = [
  Number(DEFAULT_VOCAL_INSTRUMENT_VALUE),
  ...[...VOICE_PROGRAMS].filter(
    (program) => program !== Number(DEFAULT_VOCAL_INSTRUMENT_VALUE),
  ),
].map((program) => ({
  value: String(program),
  label: gmInstrument(program)?.name ?? "Voice",
}));

/**
 * Whether a picker value is a sung part.
 *
 * Through the value rather than the program, because `kit:52` addresses a drum
 * kit and a bare number check would read it as a choir — the same confusion
 * `KIT_PREFIX` exists to prevent everywhere else.
 */
export function isVocalInstrumentValue(value: string): boolean {
  if (value.startsWith(KIT_PREFIX)) return false;
  return isVocalProgram(Number(value));
}

/**
 * Every melodic program, grouped by GM family.
 *
 * Built once at module load: the catalogue is 128 fixed entries, so rebuilding
 * it per render — which a track panel once did — was pure waste.
 */
export const INSTRUMENT_OPTIONS: InstrumentOption[] = GM_FAMILIES.flatMap(
  (family) =>
    gmInstrumentsByFamily(family).map((instrument) => ({
      value: String(instrument.program),
      label: instrument.name,
      group: GM_FAMILY_LABELS[family],
    })),
);

/** The same catalogue as nested groups, for a picker that draws its own headings. */
/**
 * The same catalogue as nested groups, for a picker that draws its own headings.
 *
 * **The voices are not in it**: they are offered as `VOICE_OPTIONS` above, and
 * a program appearing in two groups of one menu is an entry whose selection is
 * ambiguous — the control shows whichever heading it matched first and the
 * reader cannot tell the two apart. `INSTRUMENT_OPTIONS` keeps all 128, because
 * that one is the catalogue rather than a menu.
 */
export const FAMILY_GROUPS = GM_FAMILIES.map((family) => ({
  key: family,
  label: GM_FAMILY_LABELS[family],
  instruments: gmInstrumentsByFamily(family).filter(
    (instrument) => !isVocalProgram(instrument.program),
  ),
})).filter((group) => group.instruments.length > 0);

/**
 * The clef a melodic program is written on.
 *
 * Only the Bass family reads better on the bass staff; everything else starts
 * on treble, which can be changed on the track afterwards.
 */
function clefForProgram(program: number): Clef {
  return program >= 32 && program <= 39 ? "bass" : "treble";
}

/** Turns a picker value — from either list — back into track fields. */
export function instrumentChoiceFor(value: string): InstrumentChoice {
  if (value.startsWith(KIT_PREFIX)) {
    // `gmKit` rather than the raw number: an address no kit sits on falls back
    // to Standard instead of producing a track nothing can play.
    const kit = gmKit(Number(value.slice(KIT_PREFIX.length))) ?? GM_KITS[0];
    return {
      midiProgram: kit.program,
      instrumentName: kit.name,
      clef: "percussion",
    };
  }
  const program = Number(value);
  return {
    midiProgram: program,
    instrumentName: gmInstrument(program)?.name ?? "Piano",
    clef: clefForProgram(program),
  };
}

/** The label shown for a catalogue value. */
export function instrumentLabelFor(value: string): string {
  return instrumentChoiceFor(value).instrumentName;
}
