/**
 * The shapes a MusicXML import is described in.
 *
 * Types only; the importer lives in `@sudobility/music_codecs`. The warning
 * catalogue is a contract the host fills in — each app hands over a translated
 * sentence per key — so it is declared here, where both the importer and the
 * hosts that satisfy it can name it without either depending on the other.
 */
import type { Score } from "../model/score";

/**
 * Every warning the MusicXML importer can raise, in the caller's words.
 *
 * Functions where the warning names something it found — a clef, a tag, a
 * tempo — so the host can put the value where its own grammar wants it rather
 * than having English word order baked in by the importer.
 *
 * Every key must have a call site in the importer: music_codecs'
 * `warning-contract.test.ts` fails on one that cannot fire.
 */
export type MusicXmlWarnings = {
  unsupportedClef: (sign: string, line: number) => string;
  unsupportedKeyMode: (mode: string) => string;
  unsupportedTime: (measureNumber: number) => string;
  complexTimeSignature: string;
  unsupportedPitchStep: (step: string) => string;
  alterRounded: (alter: string, clamped: number) => string;
  unsupportedNotation: (tag: string) => string;
  unsupportedNoteElement: (tag: string) => string;
  unsupportedArticulation: (tag: string) => string;
  multipleArticulations: string;
  unpitched: string;
  noPitchOrRest: string;
  noDuration: string;
  nonPositiveDuration: string;
  noteTrimmed: string;
  unsupportedMeasureElement: (tag: string) => string;
  noTempo: (defaultBpm: number) => string;
  tempoClamped: (
    bpm: number,
    min: number,
    max: number,
    clamped: number,
  ) => string;
};

export type MusicXmlImportResult = { score: Score; warnings: string[] };
