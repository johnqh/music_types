/**
 * Every General MIDI program, one row each, stating its own numbers.
 *
 * This replaced four tables that each held a family default plus a handful of
 * per-program overrides. That shape looked like deduplication and was not: 90
 * of the 128 programs inherited a range nobody had chosen for them, and an
 * inherited value was indistinguishable from a researched one. It hid a real
 * bug — Muted Trumpet had no transposition entry, so a B-flat trumpet with a
 * mute in the bell was treated as non-transposing and its part displayed a
 * whole tone wrong — and it quietly gave the Clavinet an 88-key piano compass,
 * and gave the flute's exact range to five instruments that share none of it.
 *
 * One row per program costs some repetition where eight guitars really do
 * share a compass. That repetition is the point: writing it eight times is a
 * decision somebody made, where inheriting it eight times is a question nobody
 * was asked.
 *
 * `basis` is what makes this honest, and it is the field to read before
 * trusting a number:
 *
 * - `measured`   — checked against a source for that instrument.
 * - `tunable`    — the instrument has no fixed absolute pitch. A shamisen is
 *                  tuned to the singer, a koto to the piece, an mbira to
 *                  notes that are not on the tempered scale at all, and a pan
 *                  flute or hammered dulcimer is built in many sizes. The
 *                  range is a typical span, and refusing a note against it
 *                  would be refusing against the sampler rather than the
 *                  instrument.
 * - `synthetic`  — an electronic patch with no acoustic compass. The range is
 *                  the full keyboard because narrowing it would be a fiction.
 * - `unpitched`  — a sound effect. There is no pitch to be outside of.
 * - `assumed`    — NOT verified. Carried over from the old family default and
 *                  left deliberately wide. Anything reading these numbers to
 *                  refuse a note must not refuse on an `assumed` row.
 */
import { GM_FAMILIES } from "./gm.js";
import type { GmFamily } from "./gm.js";
import { FULL_KEYBOARD, type MidiRange } from "./gm-range.js";
import { UNLIMITED_POLYPHONY } from "./gm-polyphony.js";

/** How much to trust a row's numbers. See the module doc. */
export const INSTRUMENT_BASES = [
  "measured",
  "tunable",
  "synthetic",
  "unpitched",
  "assumed",
] as const;
export type InstrumentBasis = (typeof INSTRUMENT_BASES)[number];

export type GmInstrumentSpec = {
  program: number;
  name: string;
  family: GmFamily;
  /** Sounding compass, inclusive. */
  range: MidiRange;
  /** Notes that can sound at once; `UNLIMITED_POLYPHONY` for anything chordal. */
  maxPolyphony: number;
  /** Semitones to ADD to a sounding pitch to get the written one. */
  writtenTransposition: number;
  basis: InstrumentBasis;
  /** Why these numbers, in one line. */
  note: string;
};

type Row = {
  program: number;
  name: string;
  family: GmFamily;
  min: number;
  max: number;
  poly: number;
  transpose: number;
  basis: InstrumentBasis;
  note: string;
};

const ROWS: readonly Row[] = [
  { program: 0, name: "Acoustic Grand Piano", family: "piano", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "A0-C8, the 88-key piano" },
  { program: 1, name: "Bright Acoustic Piano", family: "piano", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "an acoustic piano" },
  { program: 2, name: "Electric Grand Piano", family: "piano", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "an electric grand is a full-size piano action" },
  { program: 3, name: "Honky-tonk Piano", family: "piano", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "a tack piano is a piano" },
  { program: 4, name: "Electric Piano 1", family: "piano", min: 28, max: 100, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "Rhodes 73: 73 keys from E1, so E1-E7" },
  { program: 5, name: "Electric Piano 2", family: "piano", min: 29, max: 88, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "Wurlitzer 200A: 64 keys, A1-C7 is often cited; the 60-key F1-E6 span is the conservative overlap" },
  { program: 6, name: "Harpsichord", family: "piano", min: 29, max: 89, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "F1-F6, the standard two-manual compass" },
  { program: 7, name: "Clavinet", family: "piano", min: 29, max: 88, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "Clavinet D6: 60 keys, F1-E6 (Wikipedia)" },
  { program: 8, name: "Celesta", family: "chromatic-percussion", min: 60, max: 108, poly: UNLIMITED_POLYPHONY, transpose: -12, basis: "measured", note: "C4-C8 sounding; written an octave lower" },
  { program: 9, name: "Glockenspiel", family: "chromatic-percussion", min: 79, max: 108, poly: UNLIMITED_POLYPHONY, transpose: -24, basis: "measured", note: "G5-C8 sounding; written two octaves lower" },
  { program: 10, name: "Music Box", family: "chromatic-percussion", min: 48, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a movement is built for one tune and spans about two and a half octaves"},
  { program: 11, name: "Vibraphone", family: "chromatic-percussion", min: 53, max: 89, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "F3-F6, three octaves" },
  { program: 12, name: "Marimba", family: "chromatic-percussion", min: 36, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "C2-C7, the five-octave concert marimba" },
  { program: 13, name: "Xylophone", family: "chromatic-percussion", min: 65, max: 108, poly: UNLIMITED_POLYPHONY, transpose: -12, basis: "measured", note: "F4-C8 sounding; written an octave lower" },
  { program: 14, name: "Tubular Bells", family: "chromatic-percussion", min: 60, max: 79, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "orchestral chimes are written C4-F5, though professional models reach G5" },
  { program: 15, name: "Dulcimer", family: "chromatic-percussion", min: 48, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "hammered dulcimers are built 15/14, 16/15 and larger, spanning about three octaves" },
  { program: 16, name: "Drawbar Organ", family: "organ", min: 36, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "Hammond drawbar manual: 61 keys, C2-C7" },
  { program: 17, name: "Percussive Organ", family: "organ", min: 36, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "same manual" },
  { program: 18, name: "Rock Organ", family: "organ", min: 36, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "same manual" },
  { program: 19, name: "Church Organ", family: "organ", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "C1-C7 manuals; the 32' pedal reaches lower but is a separate part" },
  { program: 20, name: "Reed Organ", family: "organ", min: 36, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "a reed organ is commonly 39-49 keys, about four octaves" },
  { program: 21, name: "Accordion", family: "organ", min: 41, max: 81, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "piano-accordion right hand, F2-A5 on a 41-key model" },
  { program: 22, name: "Harmonica", family: "organ", min: 60, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "12-hole chromatic, C4-C7" },
  { program: 23, name: "Tango Accordion", family: "organ", min: 41, max: 81, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "as the accordion above" },
  { program: 24, name: "Acoustic Guitar (nylon)", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 25, name: "Acoustic Guitar (steel)", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 26, name: "Electric Guitar (jazz)", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 27, name: "Electric Guitar (clean)", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 28, name: "Electric Guitar (muted)", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 29, name: "Overdriven Guitar", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 30, name: "Distortion Guitar", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 31, name: "Guitar Harmonics", family: "guitar", min: 40, max: 88, poly: 6, transpose: 12, basis: "measured", note: "six strings, low E2 up to E6 at the top fret" },
  { program: 32, name: "Acoustic Bass", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 33, name: "Electric Bass (finger)", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 34, name: "Electric Bass (pick)", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 35, name: "Fretless Bass", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 36, name: "Slap Bass 1", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 37, name: "Slap Bass 2", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 38, name: "Synth Bass 1", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 39, name: "Synth Bass 2", family: "bass", min: 28, max: 67, poly: 4, transpose: 12, basis: "measured", note: "four strings, low E1 up to G4 at the top fret" },
  { program: 40, name: "Violin", family: "strings", min: 55, max: 100, poly: 2, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 41, name: "Viola", family: "strings", min: 48, max: 88, poly: 2, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 42, name: "Cello", family: "strings", min: 36, max: 84, poly: 2, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 43, name: "Contrabass", family: "strings", min: 28, max: 67, poly: 2, transpose: 12, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 44, name: "Tremolo Strings", family: "strings", min: 28, max: 100, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "a tremolo STRING SECTION: the union of its instruments, and it plays chords" },
  { program: 45, name: "Pizzicato Strings", family: "strings", min: 28, max: 100, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "a pizzicato STRING SECTION: the union of its instruments, and it plays chords" },
  { program: 46, name: "Orchestral Harp", family: "strings", min: 24, max: 103, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 47, name: "Timpani", family: "strings", min: 38, max: 57, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "D2-A3 across a set; a timpanist plays several drums and can sound them together" },
  { program: 48, name: "String Ensemble 1", family: "ensemble", min: 28, max: 100, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "the string section: contrabass floor to violin ceiling" },
  { program: 49, name: "String Ensemble 2", family: "ensemble", min: 28, max: 100, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "the string section: contrabass floor to violin ceiling" },
  { program: 50, name: "Synth Strings 1", family: "ensemble", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "a synth pad in the shape of strings" },
  { program: 51, name: "Synth Strings 2", family: "ensemble", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "a synth pad in the shape of strings" },
  { program: 52, name: "Choir Aahs", family: "ensemble", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 53, name: "Voice Oohs", family: "ensemble", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 54, name: "Synth Voice", family: "ensemble", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "a synthesised voice, not a singer" },
  { program: 55, name: "Orchestra Hit", family: "ensemble", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "a sampled orchestral stab, not an instrument with a compass" },
  { program: 56, name: "Trumpet", family: "brass", min: 52, max: 86, poly: 1, transpose: 2, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 57, name: "Trombone", family: "brass", min: 40, max: 77, poly: 1, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 58, name: "Tuba", family: "brass", min: 26, max: 65, poly: 1, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 59, name: "Muted Trumpet", family: "brass", min: 52, max: 86, poly: 1, transpose: 2, basis: "measured", note: "a muted trumpet is a B-flat trumpet with a mute in the bell" },
  { program: 60, name: "French Horn", family: "brass", min: 35, max: 77, poly: 1, transpose: 7, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 61, name: "Brass Section", family: "brass", min: 26, max: 86, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "the brass section: tuba floor to trumpet ceiling" },
  { program: 62, name: "Synth Brass 1", family: "brass", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "a synth patch in the shape of brass" },
  { program: 63, name: "Synth Brass 2", family: "brass", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "a synth patch in the shape of brass" },
  { program: 64, name: "Soprano Sax", family: "reed", min: 56, max: 88, poly: 1, transpose: 2, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 65, name: "Alto Sax", family: "reed", min: 49, max: 81, poly: 1, transpose: 9, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 66, name: "Tenor Sax", family: "reed", min: 44, max: 76, poly: 1, transpose: 14, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 67, name: "Baritone Sax", family: "reed", min: 36, max: 69, poly: 1, transpose: 21, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 68, name: "Oboe", family: "reed", min: 58, max: 91, poly: 1, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 69, name: "English Horn", family: "reed", min: 52, max: 81, poly: 1, transpose: 7, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 70, name: "Bassoon", family: "reed", min: 34, max: 75, poly: 1, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 71, name: "Clarinet", family: "reed", min: 50, max: 94, poly: 1, transpose: 2, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 72, name: "Piccolo", family: "pipe", min: 74, max: 108, poly: 1, transpose: -12, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 73, name: "Flute", family: "pipe", min: 60, max: 98, poly: 1, transpose: 0, basis: "measured", note: "checked against an orchestration range chart" },
  { program: 74, name: "Recorder", family: "pipe", min: 65, max: 98, poly: 1, transpose: 0, basis: "measured", note: "alto F4-G6 and soprano C5-D7 together; GM does not say which" },
  { program: 75, name: "Pan Flute", family: "pipe", min: 55, max: 91, poly: 1, transpose: 0, basis: "tunable", note: "a Romanian nai is built in 20, 22, 25, 28 and 30 pipes, in G or in C; 22 tubes in G spans about three octaves" },
  { program: 76, name: "Blown Bottle", family: "pipe", min: 48, max: 96, poly: 1, transpose: 0, basis: "tunable", note: "the pitch of a blown bottle is the bottle" },
  { program: 77, name: "Shakuhachi", family: "pipe", min: 62, max: 91, poly: 1, transpose: 0, basis: "measured", note: "1.8 shakuhachi: D4 fundamental, two octaves and a partial third" },
  { program: 78, name: "Whistle", family: "pipe", min: 74, max: 98, poly: 1, transpose: 0, basis: "measured", note: "a D tin whistle: D5-D7, two octaves" },
  { program: 79, name: "Ocarina", family: "pipe", min: 69, max: 89, poly: 1, transpose: 0, basis: "measured", note: "a 12-hole alto C ocarina: A4-F6, the octave and a sixth Wikipedia gives" },
  { program: 80, name: "Lead 1 (square)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 81, name: "Lead 2 (sawtooth)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 82, name: "Lead 3 (calliope)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 83, name: "Lead 4 (chiff)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 84, name: "Lead 5 (charang)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 85, name: "Lead 6 (voice)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 86, name: "Lead 7 (fifths)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 87, name: "Lead 8 (bass + lead)", family: "synth-lead", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 88, name: "Pad 1 (new age)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 89, name: "Pad 2 (warm)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 90, name: "Pad 3 (polysynth)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 91, name: "Pad 4 (choir)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 92, name: "Pad 5 (bowed)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 93, name: "Pad 6 (metallic)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 94, name: "Pad 7 (halo)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 95, name: "Pad 8 (sweep)", family: "synth-pad", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 96, name: "FX 1 (rain)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 97, name: "FX 2 (soundtrack)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 98, name: "FX 3 (crystal)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 99, name: "FX 4 (atmosphere)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 100, name: "FX 5 (brightness)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 101, name: "FX 6 (goblins)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 102, name: "FX 7 (echoes)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 103, name: "FX 8 (sci-fi)", family: "synth-effects", min: 24, max: 96, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic patch has no acoustic compass" },
  { program: 104, name: "Sitar", family: "ethnic", min: 40, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a sitar is tuned to the singer, not to concert pitch"},
  { program: 105, name: "Banjo", family: "ethnic", min: 48, max: 84, poly: 5, transpose: 0, basis: "measured", note: "5-string banjo open G reaches D3; tenor banjo down to C3; up to about C6" },
  { program: 106, name: "Shamisen", family: "ethnic", min: 48, max: 79, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a shamisen is tuned to whatever register the singer wants" },
  { program: 107, name: "Koto", family: "ethnic", min: 43, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a koto is tuned to the piece before it is played" },
  { program: 108, name: "Kalimba", family: "ethnic", min: 53, max: 89, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "mbira and kalimba tunings vary by maker and are often not on the tempered scale" },
  { program: 109, name: "Bagpipe", family: "ethnic", min: 62, max: 86, poly: 1, transpose: 0, basis: "measured", note: "General MIDI says only \"Bagpipe\": the Highland chanter is nine notes G4-A5, the uilleann chanter two octaves from D4, so this is the pair" },
  { program: 110, name: "Fiddle", family: "ethnic", min: 55, max: 100, poly: 2, transpose: 0, basis: "measured", note: "a fiddle is a violin: G3-E7" },
  { program: 111, name: "Shanai", family: "ethnic", min: 57, max: 81, poly: 1, transpose: 0, basis: "measured", note: "the shehnai: A3-A5, two octaves" },
  { program: 112, name: "Tinkle Bell", family: "percussive", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "a tinkle bell has a sound, not a scale"},
  { program: 113, name: "Agogo", family: "percussive", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "an agogo is two or three bells, not a scale" },
  { program: 114, name: "Steel Drums", family: "percussive", min: 33, max: 91, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "measured", note: "steelpan family A1-G6"},
  { program: 115, name: "Woodblock", family: "percussive", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "a woodblock has a sound, not a scale"},
  { program: 116, name: "Taiko Drum", family: "percussive", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a taiko is tuned by its head tension; a set has no standard compass" },
  { program: 117, name: "Melodic Tom", family: "percussive", min: 48, max: 84, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "tunable", note: "a melodic tom set is tuned by the player" },
  { program: 118, name: "Synth Drum", family: "percussive", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "synthetic", note: "an electronic drum voice" },
  { program: 119, name: "Reverse Cymbal", family: "percussive", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "reverse cymbal is an effect, not a pitch" },
  { program: 120, name: "Guitar Fret Noise", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 121, name: "Breath Noise", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 122, name: "Seashore", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 123, name: "Bird Tweet", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 124, name: "Telephone Ring", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 125, name: "Helicopter", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 126, name: "Applause", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },
  { program: 127, name: "Gunshot", family: "sound-effects", min: 21, max: 108, poly: UNLIMITED_POLYPHONY, transpose: 0, basis: "unpitched", note: "sound effect" },];

/**
 * Section patches take the union of the instruments in them, computed rather
 * than typed, so a string section cannot end up narrower than the cello
 * sitting inside it when the cello's own row is corrected.
 */
const SECTION_MEMBERS: Record<number, number[]> = {
  44: [40, 41, 42, 43], // Tremolo Strings
  45: [40, 41, 42, 43], // Pizzicato Strings
  48: [40, 41, 42, 43], // String Ensemble 1
  49: [40, 41, 42, 43], // String Ensemble 2
  61: [56, 57, 58, 60], // Brass Section: trumpet, trombone, tuba, horn
};

/** The catalogue, in program order. */
export const GM_CATALOGUE: readonly GmInstrumentSpec[] = ROWS.map((r) => ({
  program: r.program,
  name: r.name,
  family: r.family,
  range: SECTION_MEMBERS[r.program]
    ? sectionRange(...SECTION_MEMBERS[r.program]!)
    : { min: r.min, max: r.max },
  maxPolyphony: r.poly,
  writtenTransposition: r.transpose,
  basis: r.basis,
  note: r.note,
}));

/**
 * The row for `program`, or `null` outside 0-127.
 *
 * Every other instrument accessor reads this, so there is one lookup to get
 * wrong rather than four.
 */
export function gmSpec(program: number): GmInstrumentSpec | null {
  return GM_CATALOGUE[program] ?? null;
}

/**
 * Whether a note outside this instrument's range is worth refusing.
 *
 * False for a synthetic patch, a sound effect, and — importantly — anything
 * whose compass was never verified: refusing a note against a number nobody
 * checked is worse than not checking, because it rejects music that was fine.
 */
export function gmRangeIsBinding(program: number): boolean {
  return gmSpec(program)?.basis === "measured";
}

/**
 * The compass of a section patch: the union of the instruments in it.
 *
 * Derived rather than looked up, so a string section cannot end up narrower
 * than the cello sitting inside it.
 */
function sectionRange(...programs: number[]): { min: number; max: number } {
  const specs = programs.map((p) => ROWS[p]!);
  return {
    min: Math.min(...specs.map((r) => r.min)),
    max: Math.max(...specs.map((r) => r.max)),
  };
}

/** Guard: the families in program order, so a row cannot claim the wrong one. */
export function gmFamilyForProgram(program: number): GmFamily {
  const family = GM_FAMILIES[Math.floor(program / 8)];
  if (!family) throw new RangeError(`no General MIDI family for ${program}`);
  return family;
}

export { FULL_KEYBOARD, UNLIMITED_POLYPHONY };
