/**
 * The 3D wireframe model for every instrument this app supports: all 128
 * General MIDI programs and all 8 drum kits, each built from real
 * dimensions and posed as played — see `spatial-models/` for the models and
 * `spatial-geometry.ts` for how they are built.
 *
 * Every program has its own entry. Where two programs are physically the
 * same object (Acoustic Grand and Bright Acoustic are the same piano; the
 * eight synth leads are all played on the same monosynth) they share a
 * model on purpose — the point is that a listener walking the stage sees
 * the instrument that is actually being played, not that every table row
 * has a unique strokes list. `FAMILY_SPATIAL_MODEL` exists only for a
 * `midiProgram` outside 0–127 (bad or legacy data), never as a stand-in for
 * an unauthored program: `gm-spatial-model.test.ts` asserts all 128 are in
 * the program table.
 */
import { gmFamilyOf, gmInstrument } from "./gm";
import type { GmFamily } from "./gm";
import { playedNeutral, type InstrumentSpatialModel, type PlayedInstrumentModel } from "./spatial-art";
import {
  ACOUSTIC_BASS,
  CELLO,
  CONTRABASS,
  FIDDLE,
  ORCHESTRAL_HARP,
  PIZZICATO_STRINGS,
  STRING_ENSEMBLE_1,
  STRING_ENSEMBLE_2,
  TIMPANI,
  TREMOLO_STRINGS,
  VIOLA,
  VIOLIN,
} from "./spatial-models/bowed";
import { BRASS_SECTION, FRENCH_HORN, MUTED_TRUMPET, TROMBONE, TRUMPET, TUBA } from "./spatial-models/brass";
import { APPLAUSE, BIRD_TWEET, BREATH_NOISE, GUITAR_FRET_NOISE, GUNSHOT, HELICOPTER, SEASHORE, TELEPHONE_RING } from "./spatial-models/effects";
import { CHOIR_AAHS, VOICE_OOHS } from "./spatial-models/ensembles";
import { BAGPIPE, BANJO, KALIMBA, KOTO, SHAMISEN, SHANAI, SITAR } from "./spatial-models/ethnic";
import {
  ACOUSTIC_GUITAR_NYLON,
  ACOUSTIC_GUITAR_STEEL,
  DISTORTION_GUITAR,
  ELECTRIC_BASS_FINGER,
  ELECTRIC_BASS_PICK,
  ELECTRIC_GUITAR_CLEAN,
  ELECTRIC_GUITAR_JAZZ,
  ELECTRIC_GUITAR_MUTED,
  FRETLESS_BASS,
  GUITAR_HARMONICS,
  OVERDRIVEN_GUITAR,
  SLAP_BASS_1,
  SLAP_BASS_2,
} from "./spatial-models/guitars";
import {
  ACCORDION,
  CELESTA,
  CHURCH_ORGAN,
  CLAVINET,
  DRAWBAR_ORGAN,
  ELECTRIC_GRAND,
  ELECTRIC_PIANO_RHODES,
  ELECTRIC_PIANO_WURLITZER,
  GRAND_PIANO,
  HARMONICA,
  HARPSICHORD,
  REED_ORGAN,
  TANGO_ACCORDION,
  UPRIGHT_PIANO,
} from "./spatial-models/keyboards";
import { BRUSH_KIT, ELECTRONIC_KIT, JAZZ_KIT, ORCHESTRA_KIT, POWER_KIT, ROOM_KIT, STANDARD_KIT, TR808_KIT } from "./spatial-models/kits";
import { DULCIMER, GLOCKENSPIEL, MARIMBA, MUSIC_BOX, TUBULAR_BELLS, VIBRAPHONE, XYLOPHONE } from "./spatial-models/mallets";
import { AGOGO, MELODIC_TOM, REVERSE_CYMBAL, STEEL_DRUMS, SYNTH_DRUM, TAIKO_DRUM, TINKLE_BELL, WOODBLOCK } from "./spatial-models/percussion";
import { BLOWN_BOTTLE, FLUTE, OCARINA, PAN_FLUTE, PICCOLO, RECORDER, SHAKUHACHI, WHISTLE } from "./spatial-models/pipes";
import { ALTO_SAX, BARITONE_SAX, BASSOON, CLARINET, ENGLISH_HORN, OBOE, SOPRANO_SAX, TENOR_SAX } from "./spatial-models/reeds";
import { SYNTH_MODULAR, SYNTH_MONO, SYNTH_POLY, SYNTH_SAMPLER, SYNTH_WORKSTATION } from "./spatial-models/synths";

/** One model per General MIDI program, 0–127. Exported for the coverage test. */
export const PROGRAM_SPATIAL_MODELS: Readonly<Record<number, InstrumentSpatialModel>> = {
  // Piano
  0: GRAND_PIANO,
  1: GRAND_PIANO,
  2: ELECTRIC_GRAND,
  3: UPRIGHT_PIANO,
  4: ELECTRIC_PIANO_RHODES,
  5: ELECTRIC_PIANO_WURLITZER,
  6: HARPSICHORD,
  7: CLAVINET,
  // Chromatic percussion
  8: CELESTA,
  9: GLOCKENSPIEL,
  10: MUSIC_BOX,
  11: VIBRAPHONE,
  12: MARIMBA,
  13: XYLOPHONE,
  14: TUBULAR_BELLS,
  15: DULCIMER,
  // Organ
  16: DRAWBAR_ORGAN,
  17: DRAWBAR_ORGAN,
  18: DRAWBAR_ORGAN,
  19: CHURCH_ORGAN,
  20: REED_ORGAN,
  21: ACCORDION,
  22: HARMONICA,
  23: TANGO_ACCORDION,
  // Guitar
  24: ACOUSTIC_GUITAR_NYLON,
  25: ACOUSTIC_GUITAR_STEEL,
  26: ELECTRIC_GUITAR_JAZZ,
  27: ELECTRIC_GUITAR_CLEAN,
  28: ELECTRIC_GUITAR_MUTED,
  29: OVERDRIVEN_GUITAR,
  30: DISTORTION_GUITAR,
  31: GUITAR_HARMONICS,
  // Bass
  32: ACOUSTIC_BASS,
  33: ELECTRIC_BASS_FINGER,
  34: ELECTRIC_BASS_PICK,
  35: FRETLESS_BASS,
  36: SLAP_BASS_1,
  37: SLAP_BASS_2,
  38: SYNTH_MONO,
  39: SYNTH_MONO,
  // Strings
  40: VIOLIN,
  41: VIOLA,
  42: CELLO,
  43: CONTRABASS,
  44: TREMOLO_STRINGS,
  45: PIZZICATO_STRINGS,
  46: ORCHESTRAL_HARP,
  47: TIMPANI,
  // Ensemble
  48: STRING_ENSEMBLE_1,
  49: STRING_ENSEMBLE_2,
  50: SYNTH_POLY,
  51: SYNTH_WORKSTATION,
  52: CHOIR_AAHS,
  53: VOICE_OOHS,
  54: SYNTH_POLY,
  55: SYNTH_SAMPLER,
  // Brass
  56: TRUMPET,
  57: TROMBONE,
  58: TUBA,
  59: MUTED_TRUMPET,
  60: FRENCH_HORN,
  61: BRASS_SECTION,
  62: SYNTH_POLY,
  63: SYNTH_POLY,
  // Reed
  64: SOPRANO_SAX,
  65: ALTO_SAX,
  66: TENOR_SAX,
  67: BARITONE_SAX,
  68: OBOE,
  69: ENGLISH_HORN,
  70: BASSOON,
  71: CLARINET,
  // Pipe
  72: PICCOLO,
  73: FLUTE,
  74: RECORDER,
  75: PAN_FLUTE,
  76: BLOWN_BOTTLE,
  77: SHAKUHACHI,
  78: WHISTLE,
  79: OCARINA,
  // Synth lead
  80: SYNTH_MONO,
  81: SYNTH_MONO,
  82: SYNTH_MONO,
  83: SYNTH_MONO,
  84: SYNTH_MONO,
  85: SYNTH_MONO,
  86: SYNTH_MONO,
  87: SYNTH_MONO,
  // Synth pad
  88: SYNTH_WORKSTATION,
  89: SYNTH_WORKSTATION,
  90: SYNTH_WORKSTATION,
  91: SYNTH_WORKSTATION,
  92: SYNTH_WORKSTATION,
  93: SYNTH_WORKSTATION,
  94: SYNTH_WORKSTATION,
  95: SYNTH_WORKSTATION,
  // Synth effects
  96: SYNTH_MODULAR,
  97: SYNTH_MODULAR,
  98: SYNTH_MODULAR,
  99: SYNTH_MODULAR,
  100: SYNTH_MODULAR,
  101: SYNTH_MODULAR,
  102: SYNTH_MODULAR,
  103: SYNTH_MODULAR,
  // Ethnic
  104: SITAR,
  105: BANJO,
  106: SHAMISEN,
  107: KOTO,
  108: KALIMBA,
  109: BAGPIPE,
  110: FIDDLE,
  111: SHANAI,
  // Percussive
  112: TINKLE_BELL,
  113: AGOGO,
  114: STEEL_DRUMS,
  115: WOODBLOCK,
  116: TAIKO_DRUM,
  117: MELODIC_TOM,
  118: SYNTH_DRUM,
  119: REVERSE_CYMBAL,
  // Sound effects
  120: GUITAR_FRET_NOISE,
  121: BREATH_NOISE,
  122: SEASHORE,
  123: BIRD_TWEET,
  124: TELEPHONE_RING,
  125: HELICOPTER,
  126: APPLAUSE,
  127: GUNSHOT,
};

/** One model per drum kit address, matching `GM_KITS`. Exported for the coverage test. */
export const KIT_SPATIAL_MODELS: Readonly<Record<number, InstrumentSpatialModel>> = {
  0: STANDARD_KIT,
  8: ROOM_KIT,
  16: POWER_KIT,
  24: ELECTRONIC_KIT,
  25: TR808_KIT,
  32: JAZZ_KIT,
  40: BRUSH_KIT,
  48: ORCHESTRA_KIT,
};

/** Only reachable for a program outside 0–127. */
const FAMILY_SPATIAL_MODEL: Record<GmFamily, InstrumentSpatialModel> = {
  piano: GRAND_PIANO,
  "chromatic-percussion": VIBRAPHONE,
  organ: DRAWBAR_ORGAN,
  guitar: ACOUSTIC_GUITAR_STEEL,
  bass: ELECTRIC_BASS_FINGER,
  strings: VIOLIN,
  ensemble: STRING_ENSEMBLE_1,
  brass: TRUMPET,
  reed: ALTO_SAX,
  pipe: FLUTE,
  "synth-lead": SYNTH_MONO,
  "synth-pad": SYNTH_WORKSTATION,
  "synth-effects": SYNTH_MODULAR,
  ethnic: SITAR,
  percussive: TAIKO_DRUM,
  "sound-effects": APPLAUSE,
};

/**
 * The model for a drum kit's program address. Not reachable through
 * `gmSpatialModelFor` — a kit is addressed by a number that means an
 * entirely different melodic program in that table (Brush is 40, where the
 * melodic model is the violin).
 */
export function gmKitSpatialModel(kitProgram: number): PlayedInstrumentModel {
  return playedNeutral(KIT_SPATIAL_MODELS[kitProgram] ?? STANDARD_KIT);
}

/** The model for `program`; the family's representative only for a program that is not a General MIDI program at all. */
export function gmSpatialModelFor(program: number): PlayedInstrumentModel {
  const picked = PROGRAM_SPATIAL_MODELS[program];
  if (picked) return playedNeutral(picked);
  return playedNeutral(gmInstrument(program) ? FAMILY_SPATIAL_MODEL[gmFamilyOf(program)] : GRAND_PIANO);
}
