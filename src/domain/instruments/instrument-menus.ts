/**
 * The instrument menus, as data both apps draw.
 *
 * `instrument-options.ts` holds the catalogue's pieces — voices, kits, the GM
 * families. The *menus* built from them were written three times: the web's
 * `InstrumentSelectItems`, the native score-setup sheet's flat list and the
 * native Generate Track sheet's flat list, which had already drifted (no voice
 * group). The order is the web's: voices first, because General MIDI files a
 * singer under Ensemble where nobody looks for one; kits next, because a kit
 * is not a program; then the families in catalogue order.
 */
import type { Track } from "../../index";
import {
  FAMILY_GROUPS,
  INSTRUMENT_OPTIONS,
  KIT_OPTIONS,
  VOICE_OPTIONS,
  kitOptionValue,
} from "./instrument-options";
import type { InstrumentOption } from "./instrument-options";
import { isPercussionTrack } from "./track-instrument";

/**
 * One heading and its entries.
 *
 * Exactly one of `labelKey` and `label` is set: the voice and kit headings are
 * this product's words and travel as i18n keys, while a GM family's name is a
 * fixed identifier ("Chromatic Percussion") printed as it is, the way the
 * program names are.
 */
export type InstrumentMenuGroup = {
  key: string;
  labelKey: string | null;
  label: string | null;
  options: readonly InstrumentOption[];
};

export const GENERATION_INSTRUMENT_GROUPS: readonly InstrumentMenuGroup[] = [
  { key: "voices", labelKey: "generate.voices", label: null, options: VOICE_OPTIONS },
  { key: "kits", labelKey: "generate.drumKits", label: null, options: KIT_OPTIONS },
  ...FAMILY_GROUPS.map((group) => ({
    key: group.key as string,
    labelKey: null,
    label: group.label,
    options: group.instruments.map((instrument) => ({
      value: String(instrument.program),
      label: instrument.name,
      group: group.label,
    })),
  })),
];

/**
 * The same menu flattened, for a picker that draws no group headings.
 *
 * A melodic entry carries its family in the label (`Piano · Acoustic Grand
 * Piano`), since the heading that would have said so is gone; voices and kits
 * are named plainly. `voices: false` is the Generate Track list, which adds an
 * accompanying part to a score and does not offer a singer.
 */
export function generationInstrumentOptionsFlat({
  voices = true,
}: { voices?: boolean } = {}): Array<{ value: string; label: string }> {
  return GENERATION_INSTRUMENT_GROUPS.filter(
    (group) => voices || group.key !== "voices",
  ).flatMap((group) =>
    group.options.map((option) => ({
      value: option.value,
      label: group.label ? `${group.label} · ${option.label}` : option.label,
    })),
  );
}

/**
 * The instrument picker for a track: which list, which value, which title.
 *
 * A percussion track's program addresses a *kit* — Brush is 40 and program 40
 * is Violin — so it gets the kit list and a `kit:` value; handing a bare
 * program to the kit list matches nothing and renders an empty control.
 */
export function instrumentPickerFor(
  track: Pick<Track, "clef" | "midiProgram">,
): { options: readonly InstrumentOption[]; value: string; titleKey: string } {
  if (isPercussionTrack(track)) {
    return {
      options: KIT_OPTIONS,
      value: kitOptionValue(track.midiProgram),
      titleKey: "inspector.drumKit",
    };
  }
  return {
    options: INSTRUMENT_OPTIONS,
    value: String(track.midiProgram),
    titleKey: "generate.instrument",
  };
}
