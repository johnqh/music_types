/**
 * What a score is when nobody has said otherwise.
 *
 * These four numbers are read by every decoder: a MIDI file states its tempo
 * only if it wants to, MusicXML may omit the key, and a generated fragment
 * carries neither. Each of those readers used to declare its own copy, so
 * "the default" was six declarations that happened to agree — `factory.ts`
 * alone held `DEFAULT_TEMPO_BPM` one line away from `tempo-map.ts`'s
 * `DEFAULT_BPM`, the same fact under two names in one package.
 *
 * A tracker module's 125 BPM is deliberately NOT here: that is the MOD/XM
 * format's own default, not ours, and folding it in would make one constant
 * mean two things.
 */
import type { KeySignature, TimeSignature } from "../../index.js";

/** Ticks per quarter note. Every tick in the model is against this. */
export const DEFAULT_PPQ = 480;

export const DEFAULT_BPM = 120;

export const DEFAULT_TIME_SIGNATURE: TimeSignature = {
  numerator: 4,
  denominator: 4,
};

export const DEFAULT_KEY_SIGNATURE: KeySignature = { fifths: 0, mode: "major" };
